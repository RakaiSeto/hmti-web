/**
 * Request server functions: submit, review, track.
 *
 * The submit path is the delicate one — it has to be atomic on D1, which has no
 * interactive transactions (decisions.md §1a). See `kirimPengajuan` for how the
 * availability decision is carried inside the writing statement.
 */
import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { z } from 'zod'

import type { StatusPengajuan } from '#/db/schema'
import { STATUS_PENGAJUAN } from '#/db/schema'
import { guardKetersediaan, periksaKetersediaan } from '#/domain/availability'
import type { Kekurangan } from '#/domain/availability'
import { logAksi } from '#/domain/log'
import { bolehTransisi, isTerlambat } from '#/domain/status'
import { todayWib } from '#/lib/dates'
import { butuhPeran, butuhSesi } from '#/lib/guards'
import { newId, newKode, normaliseKode } from '#/lib/id'

const tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid')

const BarisMasuk = z.object({
  barangId: z.string().min(1),
  jumlah: z.number().int().positive().max(999),
})

const MasukanPengajuan = z.object({
  organisasi: z.string().trim().min(2, 'Nama organisasi wajib diisi').max(160),
  penanggungJawab: z
    .string()
    .trim()
    .min(2, 'Nama penanggung jawab wajib diisi')
    .max(120),
  kontak: z.string().trim().min(8, 'Nomor WhatsApp wajib diisi').max(32),
  tglPinjam: tanggal,
  tglKembali: tanggal,
  keperluan: z.string().trim().min(3, 'Keperluan wajib diisi').max(500),
  baris: z.array(BarisMasuk).min(1, 'Pilih minimal satu barang'),
})

export interface HasilKirim {
  ok: boolean
  kode?: string
  /** Per-line shortfalls when the request lost the availability race. */
  kekurangan?: Kekurangan[]
  pesan?: string
}

/**
 * Submit a request (FR03, FR04, BR01, BR08).
 *
 * The race this closes: two borrowers submit for the last unit in the same second. A
 * read-then-write would let both through. D1 cannot hold a transaction open across the
 * read and the write, so the availability test is folded into the INSERT itself
 * (`guardKetersediaan`) and the whole thing is one `batch()` — a single serialised
 * transaction. If the parent insert writes zero rows, availability was gone; the line
 * inserts are guarded on the parent existing, so nothing partial lands and no FK error
 * is raised. Then the caller gets the shortfalls from a fresh read, for the message.
 */
export const kirimPengajuan = createServerFn({ method: 'POST' })
  .validator(MasukanPengajuan)
  .handler(async ({ data }): Promise<HasilKirim> => {
    const db = env.DB

    // Boundary validation beyond the shape: dates and quantities are business rules.
    if (data.tglKembali <= data.tglPinjam) {
      return {
        ok: false,
        pesan: 'Tanggal kembali harus setelah tanggal pinjam.',
      }
    }
    if (data.tglPinjam < todayWib()) {
      return { ok: false, pesan: 'Tanggal pinjam tidak boleh di masa lalu.' }
    }

    // Cheap pre-check so the common failure (obviously not enough stock) gets a precise
    // per-line message without touching the insert.
    const kurang = await periksaKetersediaan(
      data.baris,
      data.tglPinjam,
      data.tglKembali,
    )
    if (kurang.length > 0) return { ok: false, kekurangan: kurang }

    const pengajuanId = newId()
    const kode = newKode()
    const now = Math.floor(Date.now() / 1000)
    const guard = guardKetersediaan(data.baris, data.tglPinjam, data.tglKembali)

    const statements = [
      db
        .prepare(
          `INSERT INTO pengajuan
             (id, kode, organisasi, penanggung_jawab, kontak, tgl_pinjam, tgl_kembali,
              keperluan, status, alasan_penolakan, created_at, updated_at)
           SELECT ?, ?, ?, ?, ?, ?, ?, ?, 'Diajukan', NULL, ?, ?
           WHERE ${guard.sql}`,
        )
        .bind(
          pengajuanId,
          kode,
          data.organisasi,
          data.penanggungJawab,
          data.kontak,
          data.tglPinjam,
          data.tglKembali,
          data.keperluan,
          now,
          now,
          ...guard.params,
        ),
      ...data.baris.map((b) =>
        db
          .prepare(
            `INSERT INTO pengajuan_barang (id, pengajuan_id, barang_id, jumlah)
             SELECT ?, ?, ?, ?
             WHERE EXISTS (SELECT 1 FROM pengajuan WHERE id = ?)`,
          )
          .bind(newId(), pengajuanId, b.barangId, b.jumlah, pengajuanId),
      ),
    ]

    const hasil = await db.batch(statements)
    if (hasil[0]?.meta.changes !== 1) {
      // Lost the race between the pre-check and the insert. Re-read for the real numbers.
      const sekarang = await periksaKetersediaan(
        data.baris,
        data.tglPinjam,
        data.tglKembali,
      )
      return {
        ok: false,
        kekurangan:
          sekarang.length > 0
            ? sekarang
            : [
                {
                  barangId: data.baris[0].barangId,
                  namaBarang: 'Barang',
                  diminta: data.baris[0].jumlah,
                  tersedia: 0,
                },
              ],
      }
    }

    await logAksi({
      penggunaId: null,
      penggunaNama: data.organisasi,
      aksi: 'membuat',
      entitas: 'pengajuan',
      entitasId: pengajuanId,
    })

    return { ok: true, kode }
  })

/** Public availability check for the form, so a line can warn before submit (FR03). */
export const cekKetersediaan = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      mulai: tanggal,
      selesai: tanggal,
      barangIds: z.array(z.string()),
    }),
  )
  .handler(async ({ data }) => {
    const { ketersediaanBanyak } = await import('#/domain/availability')
    const map = await ketersediaanBanyak(
      data.barangIds,
      data.mulai,
      data.selesai,
    )
    return Object.fromEntries(
      [...map.entries()].map(([id, k]) => [id, k.tersedia]),
    )
  })

/** Track a request by code (FR06). The code is the only credential, so no other data. */
export const lacakPengajuan = createServerFn({ method: 'GET' })
  .validator(z.object({ kode: z.string().min(4) }))
  .handler(async ({ data }) => {
    const kode = normaliseKode(data.kode)
    const row = await env.DB.prepare(
      `SELECT id, kode, organisasi, penanggung_jawab, kontak, tgl_pinjam, tgl_kembali,
              keperluan, status, alasan_penolakan, created_at
       FROM pengajuan WHERE kode = ?`,
    )
      .bind(kode)
      .first<Record<string, unknown>>()
    if (!row) return null

    const { results: baris } = await env.DB.prepare(
      `SELECT b.nama, pb.jumlah FROM pengajuan_barang pb
       JOIN barang b ON b.id = pb.barang_id
       WHERE pb.pengajuan_id = ?`,
    )
      .bind(row.id)
      .all<{ nama: string; jumlah: number }>()

    const suratRow = await env.DB.prepare(
      `SELECT status_verifikasi, waktu FROM surat WHERE pengajuan_id = ?`,
    )
      .bind(row.id)
      .first<{ status_verifikasi: string; waktu: number }>()

    const status = row.status as StatusPengajuan
    return {
      kode: row.kode as string,
      organisasi: row.organisasi as string,
      penanggungJawab: row.penanggung_jawab as string,
      tglPinjam: row.tgl_pinjam as string,
      tglKembali: row.tgl_kembali as string,
      keperluan: row.keperluan as string,
      status,
      terlambat: isTerlambat(status, row.tgl_kembali as string),
      alasanPenolakan: (row.alasan_penolakan as string | null) ?? null,
      createdAt: new Date((row.created_at as number) * 1000),
      baris,
      surat: suratRow
        ? {
            status: suratRow.status_verifikasi,
            waktu: new Date(suratRow.waktu * 1000),
          }
        : null,
    }
  })

/**
 * The queue query's row shape.
 *
 * `total_unit` is `SUM()` over a correlated subquery with no COALESCE, so SQLite really
 * does hand back NULL when a request has no lines — hence `| null`, and hence the `?? 0`
 * at the call site. The rest are NOT NULL columns.
 */
interface BarisDaftar {
  id: string
  kode: string
  organisasi: string
  penanggung_jawab: string
  tgl_pinjam: string
  tgl_kembali: string
  keperluan: string
  status: StatusPengajuan
  created_at: number
  jumlah_baris: number
  total_unit: number | null
}

/** The staff queue (FR11). Filters compose; pending sorts first. */
export const daftarPengajuan = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      status: z
        .enum([...STATUS_PENGAJUAN, 'semua', 'Terlambat'])
        .default('semua'),
      q: z.string().default(''),
      dari: z.string().default(''),
      sampai: z.string().default(''),
    }),
  )
  .handler(async ({ data }) => {
    await butuhSesi()
    const clauses: string[] = []
    const params: unknown[] = []

    if (data.status !== 'semua') {
      if (data.status === 'Terlambat') {
        clauses.push(`p.status = 'Dipinjam' AND p.tgl_kembali < ?`)
        params.push(todayWib())
      } else {
        clauses.push('p.status = ?')
        params.push(data.status)
      }
    }
    if (data.q.trim()) {
      clauses.push(
        '(p.organisasi LIKE ? OR p.penanggung_jawab LIKE ? OR p.kode LIKE ?)',
      )
      const like = `%${data.q.trim()}%`
      params.push(like, like, like)
    }
    if (data.dari) {
      clauses.push('p.tgl_pinjam >= ?')
      params.push(data.dari)
    }
    if (data.sampai) {
      clauses.push('p.tgl_pinjam <= ?')
      params.push(data.sampai)
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const { results } = await env.DB.prepare(
      `SELECT p.id, p.kode, p.organisasi, p.penanggung_jawab, p.tgl_pinjam, p.tgl_kembali,
              p.keperluan, p.status, p.created_at,
              (SELECT COUNT(*) FROM pengajuan_barang pb WHERE pb.pengajuan_id = p.id) AS jumlah_baris,
              (SELECT SUM(pb.jumlah) FROM pengajuan_barang pb WHERE pb.pengajuan_id = p.id) AS total_unit
       FROM pengajuan p
       ${where}
       ORDER BY
         CASE p.status
           WHEN 'Diajukan' THEN 0
           WHEN 'Disetujui' THEN 1
           WHEN 'Dipinjam' THEN 2
           ELSE 3
         END,
         p.tgl_pinjam ASC`,
    )
      .bind(...params)
      .all<BarisDaftar>()

    return results.map((r) => ({
      id: r.id,
      kode: r.kode,
      organisasi: r.organisasi,
      penanggungJawab: r.penanggung_jawab,
      tglPinjam: r.tgl_pinjam,
      tglKembali: r.tgl_kembali,
      keperluan: r.keperluan,
      status: r.status,
      terlambat: isTerlambat(r.status, r.tgl_kembali),
      jumlahBaris: r.jumlah_baris,
      totalUnit: r.total_unit ?? 0,
    }))
  })

/** The lines recorded against a return, with their item names. */
async function ambilItemPengembalian(
  pengembalianId: string,
  db: D1Database = env.DB,
): Promise<
  Array<{
    kondisi: string
    jumlah: number
    catatan: string | null
    nama: string
  }>
> {
  const { results } = await db
    .prepare(
      `SELECT pi.kondisi, pi.jumlah, pi.catatan, b.nama
       FROM pengembalian_item pi JOIN barang b ON b.id = pi.barang_id
       WHERE pi.pengembalian_id = ?`,
    )
    .bind(pengembalianId)
    .all<{
      kondisi: string
      jumlah: number
      catatan: string | null
      nama: string
    }>()
  return results
}

/** One request in full, for the staff detail page (FR11–FR13). */
export const detailPengajuan = createServerFn({ method: 'GET' })
  .validator(z.object({ kode: z.string() }))
  .handler(async ({ data }) => {
    const sesi = await butuhSesi()
    const db = env.DB
    const p = await db
      .prepare(`SELECT * FROM pengajuan WHERE kode = ?`)
      .bind(data.kode)
      .first<Record<string, unknown>>()
    if (!p) return null

    const id = p.id as string
    const { results: baris } = await db
      .prepare(
        `SELECT pb.barang_id, pb.jumlah, b.nama, b.jumlah AS stok
         FROM pengajuan_barang pb JOIN barang b ON b.id = pb.barang_id
         WHERE pb.pengajuan_id = ?`,
      )
      .bind(id)
      .all<{ barang_id: string; jumlah: number; nama: string; stok: number }>()

    const suratRow = await db
      .prepare(`SELECT * FROM surat WHERE pengajuan_id = ?`)
      .bind(id)
      .first<Record<string, unknown>>()

    const serahTerima = await db
      .prepare(
        `SELECT st.*, u.name AS oleh FROM serah_terima st
         LEFT JOIN user u ON u.id = st.dicatat_oleh WHERE st.pengajuan_id = ?`,
      )
      .bind(id)
      .first<Record<string, unknown>>()

    // Annotated rather than inferred: the nullability of `first()` is what makes the
    // guard below meaningful, and stating it keeps that obvious at a glance.
    const kembali: Record<string, unknown> | null = await db
      .prepare(
        `SELECT pk.*, u.name AS oleh FROM pengembalian pk
         LEFT JOIN user u ON u.id = pk.dicatat_oleh WHERE pk.pengajuan_id = ?`,
      )
      .bind(id)
      .first<Record<string, unknown>>()

    const kembaliItems = kembali
      ? await ambilItemPengembalian(String(kembali.id))
      : []

    const { results: log } = await db
      .prepare(
        `SELECT aksi, pengguna_nama, waktu FROM log_aktivitas
         WHERE entitas = 'pengajuan' AND entitas_id = ? ORDER BY waktu DESC LIMIT 20`,
      )
      .bind(id)
      .all<{ aksi: string; pengguna_nama: string | null; waktu: number }>()

    const status = p.status as StatusPengajuan
    return {
      id,
      kode: p.kode as string,
      organisasi: p.organisasi as string,
      penanggungJawab: p.penanggung_jawab as string,
      kontak: p.kontak as string,
      tglPinjam: p.tgl_pinjam as string,
      tglKembali: p.tgl_kembali as string,
      keperluan: p.keperluan as string,
      status,
      terlambat: isTerlambat(status, p.tgl_kembali as string),
      alasanPenolakan: (p.alasan_penolakan as string | null) ?? null,
      createdAt: new Date((p.created_at as number) * 1000),
      baris,
      surat: suratRow
        ? {
            id: suratRow.id as string,
            namaFile: (suratRow.nama_file as string | null) ?? null,
            status: suratRow.status_verifikasi as 'diterima' | 'terverifikasi',
            waktu: new Date((suratRow.waktu as number) * 1000),
            waktuVerifikasi: suratRow.waktu_verifikasi
              ? new Date((suratRow.waktu_verifikasi as number) * 1000)
              : null,
          }
        : null,
      serahTerima: serahTerima
        ? {
            penerima: serahTerima.penerima as string,
            catatan: (serahTerima.catatan as string | null) ?? null,
            oleh: (serahTerima.oleh as string | null) ?? '—',
            waktu: new Date((serahTerima.waktu as number) * 1000),
          }
        : null,
      pengembalian: kembali
        ? {
            catatan: (kembali.catatan as string | null) ?? null,
            oleh: (kembali.oleh as string | null) ?? '—',
            waktu: new Date((kembali.waktu as number) * 1000),
            items: kembaliItems,
          }
        : null,
      log: log.map((l) => ({
        aksi: l.aksi,
        oleh: l.pengguna_nama ?? 'Sistem',
        waktu: new Date(l.waktu * 1000),
      })),
      peran: sesi.peran,
    }
  })

/** Approve or reject (FR12, BR06). Admin only; the status machine is the gate. */
export const putuskanPengajuan = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      kode: z.string(),
      keputusan: z.enum(['Disetujui', 'Ditolak']),
      alasan: z.string().default(''),
    }),
  )
  .handler(async ({ data }) => {
    const sesi = await butuhPeran('admin')
    const db = env.DB

    const p = await db
      .prepare(`SELECT id, status FROM pengajuan WHERE kode = ?`)
      .bind(data.kode)
      .first<{ id: string; status: StatusPengajuan }>()
    if (!p) return { ok: false as const, pesan: 'Pengajuan tidak ditemukan.' }

    const izin = bolehTransisi(p.status, data.keputusan, 'admin')
    if (!izin.ok) return { ok: false as const, pesan: izin.alasan! }

    if (data.keputusan === 'Ditolak' && data.alasan.trim().length < 3) {
      return { ok: false as const, pesan: 'Alasan penolakan wajib diisi.' }
    }

    await db
      .prepare(
        `UPDATE pengajuan SET status = ?, alasan_penolakan = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        data.keputusan,
        data.keputusan === 'Ditolak' ? data.alasan.trim() : null,
        Math.floor(Date.now() / 1000),
        p.id,
      )
      .run()

    await logAksi({
      penggunaId: sesi.id,
      penggunaNama: sesi.nama,
      aksi: data.keputusan === 'Ditolak' ? 'menolak' : 'menyetujui',
      entitas: 'pengajuan',
      entitasId: p.id,
    })

    return { ok: true as const }
  })

/** Admin re-approve on a request BR07 cancelled (overview §8). */
export const aktifkanKembali = createServerFn({ method: 'POST' })
  .validator(z.object({ kode: z.string() }))
  .handler(async ({ data }) => {
    const sesi = await butuhPeran('admin')
    const db = env.DB
    const p = await db
      .prepare(`SELECT id, status FROM pengajuan WHERE kode = ?`)
      .bind(data.kode)
      .first<{ id: string; status: StatusPengajuan }>()
    if (!p) return { ok: false as const, pesan: 'Pengajuan tidak ditemukan.' }

    const izin = bolehTransisi(p.status, 'Disetujui', 'admin')
    if (!izin.ok) return { ok: false as const, pesan: izin.alasan! }

    await db
      .prepare(
        `UPDATE pengajuan SET status = 'Disetujui', updated_at = ? WHERE id = ?`,
      )
      .bind(Math.floor(Date.now() / 1000), p.id)
      .run()

    await logAksi({
      penggunaId: sesi.id,
      penggunaNama: sesi.nama,
      aksi: 'menyetujui',
      entitas: 'pengajuan',
      entitasId: p.id,
    })
    return { ok: true as const }
  })
