/**
 * Staff accounts (FR08), the activity log (FR21), the dashboard (FR17) and reports
 * (FR18). Admin-only except the dashboard and reports, which both roles use.
 */
import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { z } from 'zod'

import { PERAN } from '#/db/schema'
import { logAksi } from '#/domain/log'
import { geserBulan, todayWib } from '#/lib/dates'
import { butuhAdmin, butuhSesi } from '#/lib/guards'

/* --- accounts (FR08) ------------------------------------------------------ */

export const daftarPengguna = createServerFn({ method: 'GET' }).handler(
  async () => {
    await butuhAdmin()
    const { results } = await env.DB.prepare(
      `SELECT id, name, email, peran, created_at FROM user ORDER BY peran ASC, name ASC`,
    ).all<{
      id: string
      name: string
      email: string
      peran: string
      created_at: number
    }>()
    return results.map((r) => ({
      id: r.id,
      nama: r.name,
      email: r.email,
      peran: r.peran,
      createdAt: new Date(r.created_at * 1000),
    }))
  },
)

/**
 * Create or edit a staff account. Admin only.
 *
 * Self-lockout guards, both surfaced as refusals rather than hidden: an admin cannot
 * demote themselves, and cannot remove the last admin. Without the second rule a
 * mis-click can leave the system with no one able to manage it, and there is no
 * bootstrap path by design (disableSignUp).
 */
export const simpanPengguna = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().optional(),
      nama: z.string().trim().min(2, 'Nama wajib diisi').max(120),
      email: z.email('Email tidak valid'),
      peran: z.enum(PERAN),
      sandi: z.string().min(8, 'Kata sandi minimal 8 karakter').optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sesi = await butuhAdmin()
    const db = env.DB
    const now = Math.floor(Date.now() / 1000)

    if (data.id) {
      if (data.id === sesi.id && data.peran !== 'admin') {
        return {
          ok: false as const,
          pesan: 'Anda tidak dapat menurunkan peran akun Anda sendiri.',
        }
      }
      if (data.peran !== 'admin') {
        const admins = await db
          .prepare(`SELECT COUNT(*) AS c FROM user WHERE peran = 'admin'`)
          .first<{ c: number }>()
        const target = await db
          .prepare(`SELECT peran FROM user WHERE id = ?`)
          .bind(data.id)
          .first<{ peran: string }>()
        if (target?.peran === 'admin' && (admins?.c ?? 0) <= 1) {
          return {
            ok: false as const,
            pesan:
              'Ini satu-satunya akun admin. Angkat admin lain terlebih dahulu.',
          }
        }
      }
      await db
        .prepare(
          `UPDATE user SET name = ?, email = ?, peran = ?, updated_at = ? WHERE id = ?`,
        )
        .bind(data.nama, data.email, data.peran, now, data.id)
        .run()
    } else {
      if (!data.sandi) {
        return {
          ok: false as const,
          pesan: 'Kata sandi wajib diisi untuk akun baru.',
        }
      }
      const ada = await db
        .prepare(`SELECT id FROM user WHERE email = ?`)
        .bind(data.email)
        .first<{ id: string }>()
      if (ada) return { ok: false as const, pesan: 'Email sudah terdaftar.' }

      const { buatAkun } = await import('#/lib/users')
      const hasil = await buatAkun({
        nama: data.nama,
        email: data.email,
        sandi: data.sandi,
        peran: data.peran,
      })
      if (!hasil.ok) return { ok: false as const, pesan: hasil.pesan }
    }

    await logAksi({
      penggunaId: sesi.id,
      penggunaNama: sesi.nama,
      aksi: data.id ? 'mengubah' : 'membuat',
      entitas: 'pengguna',
      entitasId: data.id ?? null,
    })
    return { ok: true as const }
  })

export const hapusPengguna = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const sesi = await butuhAdmin()
    if (data.id === sesi.id) {
      return {
        ok: false as const,
        pesan: 'Anda tidak dapat menghapus akun Anda sendiri.',
      }
    }
    const target = await env.DB.prepare(
      `SELECT peran, name FROM user WHERE id = ?`,
    )
      .bind(data.id)
      .first<{ peran: string; name: string }>()
    if (!target) return { ok: false as const, pesan: 'Akun tidak ditemukan.' }
    if (target.peran === 'admin') {
      const admins = await env.DB.prepare(
        `SELECT COUNT(*) AS c FROM user WHERE peran = 'admin'`,
      ).first<{ c: number }>()
      if ((admins?.c ?? 0) <= 1) {
        return {
          ok: false as const,
          pesan: 'Ini satu-satunya akun admin dan tidak dapat dihapus.',
        }
      }
    }
    // Sessions cascade with the user row (schema FK), so deletion revokes access.
    await env.DB.prepare(`DELETE FROM user WHERE id = ?`).bind(data.id).run()
    await logAksi({
      penggunaId: sesi.id,
      penggunaNama: sesi.nama,
      aksi: 'menghapus',
      entitas: 'pengguna',
      entitasId: data.id,
    })
    return { ok: true as const }
  })

/** An admin edits their own name (FR08). Password changes go through Better Auth. */
export const ubahProfilSendiri = createServerFn({ method: 'POST' })
  .validator(z.object({ nama: z.string().trim().min(2).max(120) }))
  .handler(async ({ data }) => {
    const sesi = await butuhSesi()
    await env.DB.prepare(
      `UPDATE user SET name = ?, updated_at = ? WHERE id = ?`,
    )
      .bind(data.nama, Math.floor(Date.now() / 1000), sesi.id)
      .run()
    await logAksi({
      penggunaId: sesi.id,
      penggunaNama: data.nama,
      aksi: 'mengubah',
      entitas: 'pengguna',
      entitasId: sesi.id,
    })
    return { ok: true as const }
  })

/* --- activity log (FR21) -------------------------------------------------- */

/**
 * The log is read-only by construction: this is the only function in the codebase that
 * touches `log_aktivitas` for reading, and no update or delete statement exists anywhere.
 */
export const daftarLog = createServerFn({ method: 'GET' })
  .validator(
    z
      .object({
        penggunaId: z.string().default(''),
        dari: z.string().default(''),
        sampai: z.string().default(''),
        halaman: z.number().int().min(1).default(1),
      })
      .default({ penggunaId: '', dari: '', sampai: '', halaman: 1 }),
  )
  .handler(async ({ data }) => {
    await butuhAdmin()
    const PER_HALAMAN = 25
    const clauses: string[] = []
    const params: unknown[] = []
    if (data.penggunaId) {
      clauses.push('pengguna_id = ?')
      params.push(data.penggunaId)
    }
    if (data.dari) {
      clauses.push(`waktu >= strftime('%s', ?)`)
      params.push(`${data.dari} 00:00:00`)
    }
    if (data.sampai) {
      clauses.push(`waktu <= strftime('%s', ?)`)
      params.push(`${data.sampai} 23:59:59`)
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''

    const total = await env.DB.prepare(
      `SELECT COUNT(*) AS c FROM log_aktivitas ${where}`,
    )
      .bind(...params)
      .first<{ c: number }>()

    const { results } = await env.DB.prepare(
      `SELECT l.*, u.name AS nama_sekarang FROM log_aktivitas l
       LEFT JOIN user u ON u.id = l.pengguna_id
       ${where} ORDER BY l.waktu DESC LIMIT ? OFFSET ?`,
    )
      .bind(...params, PER_HALAMAN, (data.halaman - 1) * PER_HALAMAN)
      .all<Record<string, unknown>>()

    return {
      total: total?.c ?? 0,
      perHalaman: PER_HALAMAN,
      halaman: data.halaman,
      rows: results.map((r) => ({
        id: r.id as string,
        pengguna:
          (r.pengguna_nama as string | null) ??
          (r.nama_sekarang as string | null) ??
          'Sistem',
        aksi: r.aksi as string,
        entitas: r.entitas as string,
        entitasId: (r.entitas_id as string | null) ?? null,
        waktu: new Date((r.waktu as number) * 1000),
      })),
    }
  })

/* --- dashboard (FR17) ----------------------------------------------------- */

export const ringkasanDasbor = createServerFn({ method: 'GET' }).handler(
  async () => {
    await butuhSesi()
    const db = env.DB
    const hariIni = todayWib()

    const [baru, aktif, terlambat, totalBarang, unitDipinjam, aktivitas] =
      await Promise.all([
        db
          .prepare(`SELECT COUNT(*) c FROM pengajuan WHERE status = 'Diajukan'`)
          .first<{ c: number }>(),
        db
          .prepare(`SELECT COUNT(*) c FROM pengajuan WHERE status = 'Dipinjam'`)
          .first<{ c: number }>(),
        db
          .prepare(
            `SELECT COUNT(*) c FROM pengajuan WHERE status = 'Dipinjam' AND tgl_kembali < ?`,
          )
          .bind(hariIni)
          .first<{ c: number }>(),
        db
          .prepare(`SELECT COALESCE(SUM(jumlah), 0) c FROM barang`)
          .first<{ c: number }>(),
        db
          .prepare(
            `SELECT COALESCE(SUM(pb.jumlah), 0) c FROM pengajuan_barang pb
           JOIN pengajuan p ON p.id = pb.pengajuan_id WHERE p.status = 'Dipinjam'`,
          )
          .first<{ c: number }>(),
        db
          .prepare(
            `SELECT aksi, pengguna_nama, waktu FROM log_aktivitas ORDER BY waktu DESC LIMIT 8`,
          )
          .all<{ aksi: string; pengguna_nama: string | null; waktu: number }>(),
      ])

    // Requests per month for the design's bar chart: a fixed six-month window ending with
    // the current WIB month, so the axis keeps its shape instead of collapsing to whichever
    // months happen to hold data. `geserBulan` is the same month arithmetic the calendar
    // uses, so a window that crosses a year boundary stays correct.
    const awalBulan = geserBulan(todayWib().slice(0, 7), -5)
    const { results: hitungBulan } = await db
      .prepare(
        `SELECT substr(tgl_pinjam, 1, 7) AS bulan, COUNT(*) AS c
         FROM pengajuan WHERE tgl_pinjam >= ? GROUP BY bulan`,
      )
      .bind(`${awalBulan}-01`)
      .all<{ bulan: string; c: number }>()
    const perBulan = Array.from({ length: 6 }, (_, i) => {
      const bulan = geserBulan(awalBulan, i)
      return { bulan, c: hitungBulan.find((h) => h.bulan === bulan)?.c ?? 0 }
    })

    return {
      baru: baru?.c ?? 0,
      aktif: aktif?.c ?? 0,
      terlambat: terlambat?.c ?? 0,
      totalBarang: totalBarang?.c ?? 0,
      unitDipinjam: unitDipinjam?.c ?? 0,
      aktivitas: aktivitas.results.map((a) => ({
        aksi: a.aksi,
        oleh: a.pengguna_nama ?? 'Sistem',
        waktu: new Date(a.waktu * 1000),
      })),
      perBulan,
    }
  },
)

/* --- reports (FR18) ------------------------------------------------------- */

export const laporanPeminjaman = createServerFn({ method: 'GET' })
  .validator(
    z
      .object({
        dari: z.string().default(''),
        sampai: z.string().default(''),
        status: z.string().default('semua'),
      })
      .default({ dari: '', sampai: '', status: 'semua' }),
  )
  .handler(async ({ data }) => {
    await butuhSesi()
    const clauses: string[] = []
    const params: unknown[] = []
    if (data.dari) {
      clauses.push('p.tgl_pinjam >= ?')
      params.push(data.dari)
    }
    if (data.sampai) {
      clauses.push('p.tgl_pinjam <= ?')
      params.push(data.sampai)
    }
    if (data.status !== 'semua') {
      clauses.push('p.status = ?')
      params.push(data.status)
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''

    const { results } = await env.DB.prepare(
      `SELECT p.kode, p.organisasi, p.penanggung_jawab, p.tgl_pinjam, p.tgl_kembali,
              p.keperluan, p.status,
              (SELECT GROUP_CONCAT(b.nama || ' x' || pb.jumlah, ', ')
               FROM pengajuan_barang pb JOIN barang b ON b.id = pb.barang_id
               WHERE pb.pengajuan_id = p.id) AS barang
       FROM pengajuan p ${where} ORDER BY p.tgl_pinjam DESC`,
    )
      .bind(...params)
      .all<Record<string, unknown>>()

    return results.map((r) => ({
      kode: r.kode as string,
      organisasi: r.organisasi as string,
      penanggungJawab: r.penanggung_jawab as string,
      tglPinjam: r.tgl_pinjam as string,
      tglKembali: r.tgl_kembali as string,
      keperluan: r.keperluan as string,
      status: r.status as string,
      barang: (r.barang as string | null) ?? '—',
    }))
  })

/** Stock recap, including the damage/loss tally BR05 produces (FR18). */
export const rekapStok = createServerFn({ method: 'GET' }).handler(async () => {
  await butuhSesi()
  const { results } = await env.DB.prepare(
    `SELECT b.id, b.nama, k.nama AS kategori, b.jumlah, b.kondisi,
            COALESCE((
              SELECT SUM(pb.jumlah) FROM pengajuan_barang pb
              JOIN pengajuan p ON p.id = pb.pengajuan_id
              WHERE pb.barang_id = b.id AND p.status = 'Dipinjam'
            ), 0) AS sedang_dipinjam,
            COALESCE((
              SELECT SUM(pi.jumlah) FROM pengembalian_item pi
              WHERE pi.barang_id = b.id AND pi.kondisi IN ('rusak', 'hilang')
            ), 0) AS rusak_hilang
     FROM barang b JOIN kategori k ON k.id = b.kategori_id
     ORDER BY k.nama ASC, b.nama ASC`,
  ).all<Record<string, unknown>>()

  return results.map((r) => ({
    id: r.id as string,
    nama: r.nama as string,
    kategori: r.kategori as string,
    jumlah: r.jumlah as number,
    kondisi: r.kondisi as string,
    sedangDipinjam: r.sedang_dipinjam as number,
    rusakHilang: r.rusak_hilang as number,
  }))
})
