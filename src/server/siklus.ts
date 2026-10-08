/**
 * The physical lifecycle: letters, handover, return.
 *
 * All three are available to admin and PJ inventaris (v2 role split — these are
 * operational steps). The status machine is the gate on each transition.
 */
import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { z } from 'zod'

import { KONDISI_KEMBALI } from '#/db/schema'
import { logAksi } from '#/domain/log'
import { bolehTransisi } from '#/domain/status'
import { ekstensiBerkas } from '#/domain/unggahan'
import { butuhPeran, butuhSesi } from '#/lib/guards'
import { newId } from '#/lib/id'
import type { HasilHalaman } from '#/lib/tabel'
import { PER_HALAMAN } from '#/lib/tabel'
import { ambilHalaman, pilihUrut, susunWhere } from './query'

const TIPE_SURAT = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const MAKS_SURAT = 8 * 1024 * 1024

/* --- letters (FR13, BR03, NFR03) ------------------------------------------ */

/**
 * Upload or replace the letter. Staff only, both roles.
 *
 * Re-upload replaces and resets verification to `diterima` — a new document has not been
 * checked just because the old one was. History is latest-only, as the plan decided.
 */
export const unggahSurat = createServerFn({ method: 'POST' })
  // FormData, not a plain object: a File cannot cross the server-function boundary as
  // JSON, and base64 would inflate an 8 MB letter by a third.
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error('Diharapkan FormData')
    const kode = String(data.get('kode') ?? '')
    const file = data.get('file')
    if (!kode) throw new Error('Kode pengajuan wajib diisi')
    if (!(file instanceof File)) throw new Error('Berkas surat wajib dipilih')
    return { kode, file }
  })
  .handler(async ({ data }) => {
    const sesi = await butuhPeran('admin', 'pj_inventaris')
    if (!TIPE_SURAT.includes(data.file.type)) {
      return { ok: false as const, pesan: 'Surat harus PDF, JPG, atau PNG.' }
    }
    if (data.file.size > MAKS_SURAT) {
      return { ok: false as const, pesan: 'Ukuran surat maksimal 8 MB.' }
    }
    const p = await env.DB.prepare(`SELECT id FROM pengajuan WHERE kode = ?`)
      .bind(data.kode)
      .first<{ id: string }>()
    if (!p) return { ok: false as const, pesan: 'Pengajuan tidak ditemukan.' }

    // Code-based naming, never user-supplied (path traversal, collisions).
    const key = `letters/${data.kode}.${ekstensiBerkas(data.file.type)}`
    await env.BUCKET.put(key, data.file.stream(), {
      httpMetadata: { contentType: data.file.type },
    })

    const now = Math.floor(Date.now() / 1000)
    await env.DB.prepare(
      `INSERT INTO surat (id, pengajuan_id, file_path, nama_file, status_verifikasi,
                          diunggah_oleh, waktu, diverifikasi_oleh, waktu_verifikasi)
       VALUES (?, ?, ?, ?, 'diterima', ?, ?, NULL, NULL)
       ON CONFLICT(pengajuan_id) DO UPDATE SET
         file_path = excluded.file_path,
         nama_file = excluded.nama_file,
         status_verifikasi = 'diterima',
         diunggah_oleh = excluded.diunggah_oleh,
         waktu = excluded.waktu,
         diverifikasi_oleh = NULL,
         waktu_verifikasi = NULL`,
    )
      .bind(newId(), p.id, key, data.file.name, sesi.id, now)
      .run()

    await logAksi({
      penggunaId: sesi.id,
      penggunaNama: sesi.nama,
      aksi: 'mengunggah_surat',
      entitas: 'pengajuan',
      entitasId: p.id,
    })
    return { ok: true as const }
  })

/** Mark the letter verified. Either staff role (FR13), logged with who and when. */
export const verifikasiSurat = createServerFn({ method: 'POST' })
  .validator(z.object({ kode: z.string() }))
  .handler(async ({ data }) => {
    const sesi = await butuhPeran('admin', 'pj_inventaris')
    const p = await env.DB.prepare(`SELECT id FROM pengajuan WHERE kode = ?`)
      .bind(data.kode)
      .first<{ id: string }>()
    if (!p) return { ok: false as const, pesan: 'Pengajuan tidak ditemukan.' }

    const res = await env.DB.prepare(
      `UPDATE surat SET status_verifikasi = 'terverifikasi',
                        diverifikasi_oleh = ?, waktu_verifikasi = ?
       WHERE pengajuan_id = ?`,
    )
      .bind(sesi.id, Math.floor(Date.now() / 1000), p.id)
      .run()
    if (res.meta.changes !== 1) {
      return {
        ok: false as const,
        pesan: 'Belum ada surat untuk diverifikasi.',
      }
    }

    await logAksi({
      penggunaId: sesi.id,
      penggunaNama: sesi.nama,
      aksi: 'memverifikasi_surat',
      entitas: 'pengajuan',
      entitasId: p.id,
    })
    return { ok: true as const }
  })

/**
 * Stream the letter for viewing. Staff only, never cached (NFR03) — this is the route
 * that would leak a borrower's document if it were public.
 */
export const ambilSurat = createServerFn({ method: 'GET' })
  .validator(z.object({ kode: z.string() }))
  .handler(async ({ data }) => {
    await butuhPeran('admin', 'pj_inventaris')
    const row = await env.DB.prepare(
      `SELECT s.file_path, s.nama_file FROM surat s
       JOIN pengajuan p ON p.id = s.pengajuan_id WHERE p.kode = ?`,
    )
      .bind(data.kode)
      .first<{ file_path: string; nama_file: string | null }>()
    if (!row) return null
    const obj = await env.BUCKET.get(row.file_path)
    if (!obj) return null
    const buf = await obj.arrayBuffer()
    return {
      base64: btoa(String.fromCharCode(...new Uint8Array(buf))),
      contentType: obj.httpMetadata?.contentType ?? 'application/pdf',
      namaFile: row.nama_file ?? 'surat.pdf',
    }
  })

/* --- handover (FR15, FR14, BR04) ------------------------------------------ */

const MasukanSerahTerima = z.object({
  kode: z.string(),
  penerima: z.string().trim().min(2, 'Nama penerima wajib diisi').max(120),
  catatan: z.string().trim().max(500).default(''),
  items: z
    .array(
      z.object({
        barangId: z.string(),
        kondisi: z.enum(['baik', 'rusak_ringan', 'rusak_berat']),
      }),
    )
    .min(1),
})

/**
 * Record handover and move the request to `Dipinjam`.
 *
 * FR14/BR04 are *soft* gates in v2: an unverified letter produces a warning in the UI,
 * but the server allows the handover. There is deliberately no check here that blocks on
 * `surat.status_verifikasi` — adding one would silently reintroduce the hard gate the
 * requirements removed.
 */
export const catatSerahTerima = createServerFn({ method: 'POST' })
  .validator(MasukanSerahTerima)
  .handler(async ({ data }) => {
    const sesi = await butuhPeran('admin', 'pj_inventaris')
    const db = env.DB
    const p = await db
      .prepare(`SELECT id, status FROM pengajuan WHERE kode = ?`)
      .bind(data.kode)
      .first<{ id: string; status: string }>()
    if (!p) return { ok: false as const, pesan: 'Pengajuan tidak ditemukan.' }

    const izin = bolehTransisi(p.status as never, 'Dipinjam', sesi.peran)
    if (!izin.ok) return { ok: false as const, pesan: izin.alasan! }

    const now = Math.floor(Date.now() / 1000)
    const stId = newId()
    await db.batch([
      db
        .prepare(
          `INSERT INTO serah_terima (id, pengajuan_id, penerima, catatan, dicatat_oleh, waktu)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(stId, p.id, data.penerima, data.catatan || null, sesi.id, now),
      ...data.items.map((it) =>
        db
          .prepare(
            `INSERT INTO serah_terima_item (id, serah_terima_id, barang_id, kondisi)
             VALUES (?, ?, ?, ?)`,
          )
          .bind(newId(), stId, it.barangId, it.kondisi),
      ),
      db
        .prepare(
          `UPDATE pengajuan SET status = 'Dipinjam', updated_at = ? WHERE id = ?`,
        )
        .bind(now, p.id),
    ])

    await logAksi({
      penggunaId: sesi.id,
      penggunaNama: sesi.nama,
      aksi: 'mencatat_serah_terima',
      entitas: 'pengajuan',
      entitasId: p.id,
    })
    return { ok: true as const }
  })

/* --- return (FR16, BR05) -------------------------------------------------- */

const TIPE_BUKTI = ['image/jpeg', 'image/png', 'image/webp']
/** 8 MB, the letter's cap rather than the 2 MB item-photo one: this is a phone photo taken
 *  at the counter, and refusing a real one would block the return it is meant to record. */
const MAKS_BUKTI = 8 * 1024 * 1024

const MasukanPengembalian = z.object({
  kode: z.string(),
  catatan: z.string().trim().max(500).default(''),
  items: z
    .array(
      z.object({
        barangId: z.string(),
        kondisi: z.enum(KONDISI_KEMBALI),
        jumlah: z.number().int().positive().max(999),
        catatan: z.string().trim().max(300).default(''),
      }),
    )
    .min(1),
})

/**
 * Record the return and close the request (FR16).
 *
 * BR05 is the point of this function: a `rusak` or `hilang` line reduces the item's
 * `jumlah` in the same batch as the return record, so stock can never disagree with the
 * record that explains it. `baik` changes nothing.
 *
 * The proof photo is required, not optional — a condition recorded as `rusak` with nothing
 * to look at is exactly the claim the photo exists to settle. FormData rather than JSON for
 * the same reason `unggahSurat` uses it: a `File` cannot cross the server-function boundary
 * as JSON, and base64 would inflate the upload by a third. The `items` array rides along as
 * a JSON string, which is the one thing FormData cannot carry natively.
 */
export const catatPengembalian = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error('Diharapkan FormData')
    const kode = String(data.get('kode') ?? '')
    const file = data.get('file')
    if (!kode) throw new Error('Kode pengajuan wajib diisi')
    if (!(file instanceof File)) {
      throw new Error('Foto bukti pengembalian wajib diunggah')
    }
    const mentah = String(data.get('items') ?? '')
    let items: unknown
    try {
      items = JSON.parse(mentah)
    } catch {
      throw new Error('Daftar barang tidak dapat dibaca')
    }
    return {
      kode,
      file,
      items: MasukanPengembalian.shape.items.parse(items),
      catatan: MasukanPengembalian.shape.catatan.parse(
        String(data.get('catatan') ?? ''),
      ),
    }
  })
  .handler(async ({ data }) => {
    const sesi = await butuhPeran('admin', 'pj_inventaris')
    if (!TIPE_BUKTI.includes(data.file.type)) {
      return {
        ok: false as const,
        pesan: 'Foto bukti harus JPG, PNG, atau WebP.',
      }
    }
    if (data.file.size > MAKS_BUKTI) {
      return { ok: false as const, pesan: 'Ukuran foto bukti maksimal 8 MB.' }
    }

    const db = env.DB
    const p = await db
      .prepare(`SELECT id, status FROM pengajuan WHERE kode = ?`)
      .bind(data.kode)
      .first<{ id: string; status: string }>()
    if (!p) return { ok: false as const, pesan: 'Pengajuan tidak ditemukan.' }

    const izin = bolehTransisi(p.status as never, 'Selesai', sesi.peran)
    if (!izin.ok) return { ok: false as const, pesan: izin.alasan! }

    const rusak = data.items.filter((i) => i.kondisi !== 'baik')
    if (rusak.length > 0 && data.catatan.trim().length < 3) {
      return {
        ok: false as const,
        pesan: 'Barang rusak atau hilang wajib disertai catatan.',
      }
    }

    // Everything that can reject the submission has run by now, so the object is written
    // only for a return we are about to record. Code-based key, never user-supplied.
    const key = `returns/${data.kode}.${ekstensiBerkas(data.file.type)}`
    await env.BUCKET.put(key, data.file.stream(), {
      httpMetadata: { contentType: data.file.type },
    })

    const now = Math.floor(Date.now() / 1000)
    const kembId = newId()
    const statements = [
      db
        .prepare(
          `INSERT INTO pengembalian (id, pengajuan_id, catatan, file_path, nama_file,
                                     dicatat_oleh, waktu)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          kembId,
          p.id,
          data.catatan || null,
          key,
          data.file.name,
          sesi.id,
          now,
        ),
      ...data.items.map((it) =>
        db
          .prepare(
            `INSERT INTO pengembalian_item (id, pengembalian_id, barang_id, kondisi, jumlah, catatan)
             VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            newId(),
            kembId,
            it.barangId,
            it.kondisi,
            it.jumlah,
            it.catatan || null,
          ),
      ),
      // BR05: stock follows the recorded condition, in the same transaction.
      ...rusak.map((it) =>
        db
          .prepare(
            `UPDATE barang
             SET jumlah = MAX(0, jumlah - ?), updated_at = ?
             WHERE id = ?`,
          )
          .bind(it.jumlah, now, it.barangId),
      ),
      db
        .prepare(
          `UPDATE pengajuan SET status = 'Selesai', updated_at = ? WHERE id = ?`,
        )
        .bind(now, p.id),
    ]
    await db.batch(statements)

    // One entry, not two: the photo is not a separate act from recording the return.
    await logAksi({
      penggunaId: sesi.id,
      penggunaNama: sesi.nama,
      aksi: 'mencatat_pengembalian',
      entitas: 'pengajuan',
      entitasId: p.id,
    })
    return { ok: true as const }
  })

/* --- active loans (FR11, INV-21) ----------------------------------------- */

/**
 * An active loan's row shape. `total_unit` comes from a bare `SUM()` and is genuinely
 * NULL for a request with no lines, so the `?? 0` at the call site is load-bearing.
 */
interface BarisPinjaman {
  id: string
  kode: string
  organisasi: string
  penanggung_jawab: string
  kontak: string
  tgl_pinjam: string
  tgl_kembali: string
  keperluan: string
  status: string
  total_unit: number | null
  jumlah_baris: number
}

/** An active loan as the table renders it. */
export interface BarisPinjamanAktif {
  kode: string
  organisasi: string
  penanggungJawab: string
  kontak: string
  tglPinjam: string
  tglKembali: string
  keperluan: string
  totalUnit: number
  jumlahBaris: number
  terlambat: boolean
}

/** Sortable active-loan columns, keyed by the `sort` search param. */
const URUT_PINJAMAN: Record<string, string> = {
  kode: 'p.kode',
  organisasi: 'p.organisasi',
  kembali: 'p.tgl_kembali',
}

const SELECT_PINJAMAN = `SELECT p.id, p.kode, p.organisasi, p.penanggung_jawab, p.kontak,
        p.tgl_pinjam, p.tgl_kembali, p.keperluan, p.status,
        (SELECT SUM(pb.jumlah) FROM pengajuan_barang pb WHERE pb.pengajuan_id = p.id) AS total_unit,
        (SELECT COUNT(*) FROM pengajuan_barang pb WHERE pb.pengajuan_id = p.id) AS jumlah_baris
 FROM pengajuan p`

/** Requests currently out, overdue first. */
export const daftarPeminjamanAktif = createServerFn({ method: 'GET' })
  .validator(
    z
      .object({
        hanyaTerlambat: z.boolean().default(false),
        q: z.string().default(''),
        sort: z.string().default(''),
        dir: z.enum(['asc', 'desc']).default('asc'),
        halaman: z.number().int().min(1).default(1),
        perHalaman: z.number().int().default(PER_HALAMAN),
      })
      .default({
        hanyaTerlambat: false,
        q: '',
        sort: '',
        dir: 'asc',
        halaman: 1,
        perHalaman: PER_HALAMAN,
      }),
  )
  .handler(
    async ({
      data,
    }): Promise<HasilHalaman<BarisPinjamanAktif> & { hariIni: string }> => {
      await butuhSesi()
      const { todayWib } = await import('#/lib/dates')
      const hariIni = todayWib()

      const clauses: string[] = [`p.status = 'Dipinjam'`]
      const params: unknown[] = []
      if (data.hanyaTerlambat) {
        clauses.push('p.tgl_kembali < ?')
        params.push(hariIni)
      }
      if (data.q.trim()) {
        clauses.push(
          '(p.kode LIKE ? OR p.organisasi LIKE ? OR p.penanggung_jawab LIKE ?)',
        )
        const like = `%${data.q.trim()}%`
        params.push(like, like, like)
      }
      const where = susunWhere(clauses)
      const order = pilihUrut(
        URUT_PINJAMAN,
        data.sort,
        data.dir,
        'ORDER BY p.tgl_kembali ASC',
      )

      const hasil = await ambilHalaman<BarisPinjaman>(
        env.DB,
        {
          count: `SELECT COUNT(*) AS c FROM pengajuan p ${where}`,
          countSemua: `SELECT COUNT(*) AS c FROM pengajuan p
                       WHERE p.status = 'Dipinjam'`,
          rows: `${SELECT_PINJAMAN} ${where} ${order}`,
        },
        params,
        data.halaman,
        data.perHalaman,
      )

      return {
        ...hasil,
        hariIni,
        rows: hasil.rows.map((r) => ({
          kode: r.kode,
          organisasi: r.organisasi,
          penanggungJawab: r.penanggung_jawab,
          kontak: r.kontak,
          tglPinjam: r.tgl_pinjam,
          tglKembali: r.tgl_kembali,
          keperluan: r.keperluan,
          totalUnit: r.total_unit ?? 0,
          jumlahBaris: r.jumlah_baris,
          terlambat: r.tgl_kembali < hariIni,
        })),
      }
    },
  )

/* --- return history (FR16) ------------------------------------------------ */

/** A recorded return's raw row. */
interface BarisKembali {
  id: string
  kode: string
  organisasi: string
  penanggung_jawab: string
  waktu: number
  oleh: string | null
  jumlah_baris: number
  total_unit: number | null
  rusak_hilang: number
}

/** A recorded return as the table renders it. */
export interface BarisPengembalian {
  id: string
  kode: string
  organisasi: string
  penanggungJawab: string
  waktu: Date
  oleh: string
  jumlahBaris: number
  totalUnit: number
  rusakHilang: number
}

const SELECT_KEMBALI = `SELECT pk.id, p.kode, p.organisasi, p.penanggung_jawab, pk.waktu,
        u.name AS oleh,
        (SELECT COUNT(*) FROM pengajuan_barang pb WHERE pb.pengajuan_id = p.id) AS jumlah_baris,
        (SELECT SUM(pb.jumlah) FROM pengajuan_barang pb WHERE pb.pengajuan_id = p.id) AS total_unit,
        (SELECT COALESCE(SUM(pi.jumlah), 0) FROM pengembalian_item pi
           WHERE pi.pengembalian_id = pk.id AND pi.kondisi IN ('rusak', 'hilang')) AS rusak_hilang
 FROM pengembalian pk
 JOIN pengajuan p ON p.id = pk.pengajuan_id
 LEFT JOIN user u ON u.id = pk.dicatat_oleh`

/** Sortable return-history columns, keyed by the `sort` search param. */
const URUT_KEMBALI: Record<string, string> = {
  kode: 'p.kode',
  organisasi: 'p.organisasi',
  waktu: 'pk.waktu',
  rusak: 'rusak_hilang',
}

/**
 * Returns already recorded (FR16) — the finished half of the loop, newest first. Distinct
 * from `daftarPeminjamanAktif`, which lists what is still out.
 */
export const daftarPengembalian = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      q: z.string().default(''),
      dari: z.string().default(''),
      sampai: z.string().default(''),
      sort: z.string().default(''),
      dir: z.enum(['asc', 'desc']).default('desc'),
      halaman: z.number().int().min(1).default(1),
      perHalaman: z.number().int().default(PER_HALAMAN),
    }),
  )
  .handler(async ({ data }): Promise<HasilHalaman<BarisPengembalian>> => {
    await butuhSesi()
    const clauses: string[] = []
    const params: unknown[] = []
    if (data.q.trim()) {
      clauses.push(
        '(p.kode LIKE ? OR p.organisasi LIKE ? OR p.penanggung_jawab LIKE ?)',
      )
      const like = `%${data.q.trim()}%`
      params.push(like, like, like)
    }
    if (data.dari) {
      clauses.push(`pk.waktu >= strftime('%s', ?)`)
      params.push(`${data.dari} 00:00:00`)
    }
    if (data.sampai) {
      clauses.push(`pk.waktu <= strftime('%s', ?)`)
      params.push(`${data.sampai} 23:59:59`)
    }
    const where = susunWhere(clauses)
    const order = pilihUrut(
      URUT_KEMBALI,
      data.sort,
      data.dir,
      'ORDER BY pk.waktu DESC',
    )

    const hasil = await ambilHalaman<BarisKembali>(
      env.DB,
      {
        count: `SELECT COUNT(*) AS c FROM pengembalian pk
                JOIN pengajuan p ON p.id = pk.pengajuan_id ${where}`,
        countSemua: `SELECT COUNT(*) AS c FROM pengembalian pk`,
        rows: `${SELECT_KEMBALI} ${where} ${order}`,
      },
      params,
      data.halaman,
      data.perHalaman,
    )

    return {
      ...hasil,
      rows: hasil.rows.map((r) => ({
        id: r.id,
        kode: r.kode,
        organisasi: r.organisasi,
        penanggungJawab: r.penanggung_jawab,
        waktu: new Date(r.waktu * 1000),
        oleh: r.oleh ?? '—',
        jumlahBaris: r.jumlah_baris,
        totalUnit: r.total_unit ?? 0,
        rusakHilang: r.rusak_hilang,
      })),
    }
  })
