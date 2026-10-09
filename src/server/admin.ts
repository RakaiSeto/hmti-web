/**
 * Staff accounts (FR08), the activity log (FR21), the dashboard (FR17) and reports
 * (FR18). Admin-only except the dashboard and reports, which both roles use.
 */
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { isAPIError } from 'better-auth/api'
import { env } from 'cloudflare:workers'
import { z } from 'zod'

import { PERAN } from '#/db/schema'
import { logAksi } from '#/domain/log'
import { auth } from '#/lib/auth'
import { geserBulan, todayWib } from '#/lib/dates'
import { butuhAdmin, butuhSesi } from '#/lib/guards'
import type { HasilHalaman } from '#/lib/tabel'
import { PER_HALAMAN } from '#/lib/tabel'
import { PESAN_SANDI, sandiSah } from '#/lib/validasi'
import { ambilHalaman, pilihUrut, susunWhere } from './query'

/* --- accounts (FR08) ------------------------------------------------------ */

export interface BarisPengguna {
  id: string
  nama: string
  email: string
  peran: string
  createdAt: Date
}

/** Sortable account columns, keyed by the `sort` search param. */
const URUT_PENGGUNA: Record<string, string> = {
  nama: 'u.name',
  email: 'u.email',
  peran: 'u.peran',
  dibuat: 'u.created_at',
}

export const daftarPengguna = createServerFn({ method: 'GET' })
  .validator(
    z
      .object({
        q: z.string().default(''),
        peran: z.string().default(''),
        sort: z.string().default(''),
        dir: z.enum(['asc', 'desc']).default('asc'),
        halaman: z.number().int().min(1).default(1),
        perHalaman: z.number().int().default(PER_HALAMAN),
      })
      .default({
        q: '',
        peran: '',
        sort: '',
        dir: 'asc',
        halaman: 1,
        perHalaman: PER_HALAMAN,
      }),
  )
  .handler(async ({ data }): Promise<HasilHalaman<BarisPengguna>> => {
    await butuhAdmin()
    const clauses: string[] = []
    const params: unknown[] = []
    if (data.q.trim()) {
      clauses.push('(u.name LIKE ? OR u.email LIKE ?)')
      const like = `%${data.q.trim()}%`
      params.push(like, like)
    }
    if (data.peran) {
      clauses.push('u.peran = ?')
      params.push(data.peran)
    }
    const where = susunWhere(clauses)
    const order = pilihUrut(
      URUT_PENGGUNA,
      data.sort,
      data.dir,
      'ORDER BY u.peran ASC, u.name ASC',
    )
    const hasil = await ambilHalaman<{
      id: string
      name: string
      email: string
      peran: string
      created_at: number
    }>(
      env.DB,
      {
        count: `SELECT COUNT(*) AS c FROM user u ${where}`,
        countSemua: `SELECT COUNT(*) AS c FROM user u`,
        rows: `SELECT u.id, u.name, u.email, u.peran, u.created_at
               FROM user u ${where} ${order}`,
      },
      params,
      data.halaman,
      data.perHalaman,
    )
    return {
      ...hasil,
      rows: hasil.rows.map((r) => ({
        id: r.id,
        nama: r.name,
        email: r.email,
        peran: r.peran,
        createdAt: new Date(r.created_at * 1000),
      })),
    }
  })

/**
 * Every account's id and name, unpaginated, for the activity log's user filter — the same
 * split as `daftarKategori`/`daftarKategoriRef`: the table is paged, the select is not.
 */
export const daftarPenggunaRef = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<{ id: string; nama: string }>> => {
    await butuhAdmin()
    const { results } = await env.DB.prepare(
      `SELECT id, name FROM user ORDER BY peran ASC, name ASC`,
    ).all<{ id: string; name: string }>()
    return results.map((r) => ({ id: r.id, nama: r.name }))
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
      sandi: z.string().refine(sandiSah, PESAN_SANDI).optional(),
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

/** An admin edits their own name (FR08). */
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

/**
 * Change your own password (FR08).
 *
 * A server function rather than calling `authClient.changePassword` from the page, so the
 * policy is the one in `lib/validasi.ts` and not a second, weaker rule. Better Auth's own
 * config carries only a length range — it has no notion of character classes — so wrapping
 * its endpoint is what makes the profile path and the admin's user form agree.
 *
 * The current password is still checked by Better Auth, which is called with the caller's
 * own headers so it resolves the session itself; this function does not touch the hash.
 */
export const gantiSandi = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      lama: z.string().min(1, 'Kata sandi saat ini wajib diisi'),
      baru: z.string().refine(sandiSah, PESAN_SANDI),
    }),
  )
  .handler(async ({ data }) => {
    const sesi = await butuhSesi()
    try {
      await auth.api.changePassword({
        body: { currentPassword: data.lama, newPassword: data.baru },
        headers: getRequestHeaders(),
      })
    } catch (err) {
      // `INVALID_PASSWORD` is the endpoint's one expected refusal. Reporting anything else
      // as a wrong password is how a misconfiguration stays invisible — the login page
      // makes the same distinction, for the same reason.
      const salahSandi =
        isAPIError(err) && err.body?.code === 'INVALID_PASSWORD'
      return {
        ok: false as const,
        pesan: salahSandi
          ? 'Kata sandi saat ini salah.'
          : 'Kata sandi gagal diubah. Coba lagi.',
      }
    }

    await logAksi({
      penggunaId: sesi.id,
      penggunaNama: sesi.nama,
      aksi: 'mengubah',
      entitas: 'sesi',
      entitasId: sesi.id,
    })
    return { ok: true as const }
  })

/* --- activity log (FR21) -------------------------------------------------- */

/** Sortable log columns, keyed by the `sort` search param. */
const URUT_LOG: Record<string, string> = {
  waktu: 'l.waktu',
  pengguna: 'COALESCE(l.pengguna_nama, u.name)',
  aksi: 'l.aksi',
  entitas: 'l.entitas',
}

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
        q: z.string().default(''),
        sort: z.string().default(''),
        dir: z.enum(['asc', 'desc']).default('asc'),
        halaman: z.number().int().min(1).default(1),
        perHalaman: z.number().int().default(PER_HALAMAN),
      })
      .default({
        penggunaId: '',
        dari: '',
        sampai: '',
        q: '',
        sort: '',
        dir: 'asc',
        halaman: 1,
        perHalaman: PER_HALAMAN,
      }),
  )
  .handler(async ({ data }) => {
    await butuhAdmin()
    const clauses: string[] = []
    const params: unknown[] = []
    if (data.penggunaId) {
      clauses.push('l.pengguna_id = ?')
      params.push(data.penggunaId)
    }
    if (data.dari) {
      clauses.push(`l.waktu >= strftime('%s', ?)`)
      params.push(`${data.dari} 00:00:00`)
    }
    if (data.sampai) {
      clauses.push(`l.waktu <= strftime('%s', ?)`)
      params.push(`${data.sampai} 23:59:59`)
    }
    if (data.q.trim()) {
      clauses.push(
        '(l.pengguna_nama LIKE ? OR u.name LIKE ? OR l.aksi LIKE ? OR l.entitas LIKE ?)',
      )
      const like = `%${data.q.trim()}%`
      params.push(like, like, like, like)
    }
    const where = susunWhere(clauses)
    const order = pilihUrut(
      URUT_LOG,
      data.sort,
      data.dir,
      'ORDER BY l.waktu DESC',
    )

    const hasil = await ambilHalaman<Record<string, unknown>>(
      env.DB,
      {
        count: `SELECT COUNT(*) AS c FROM log_aktivitas l
                LEFT JOIN user u ON u.id = l.pengguna_id ${where}`,
        countSemua: `SELECT COUNT(*) AS c FROM log_aktivitas l
                     LEFT JOIN user u ON u.id = l.pengguna_id`,
        rows: `SELECT l.*, u.name AS nama_sekarang FROM log_aktivitas l
               LEFT JOIN user u ON u.id = l.pengguna_id
               ${where} ${order}`,
      },
      params,
      data.halaman,
      data.perHalaman,
    )

    return {
      ...hasil,
      rows: hasil.rows.map((r) => ({
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

/**
 * One thing waiting on a person, as the dashboard's "Perlu tindakan" card shows it.
 *
 * `hari` is whole days, and what it counts depends on `jenis`: days past the due date, days
 * since the request was made, or days since the letter was uploaded. The thresholds that
 * decide whether a row appears at all live in the queries below.
 */
export interface Tindakan {
  jenis: 'terlambat' | 'menunggu' | 'surat'
  kode: string
  organisasi: string
  penanggungJawab: string | null
  hari: number
}

export const ringkasanDasbor = createServerFn({ method: 'GET' }).handler(
  async () => {
    await butuhSesi()
    const db = env.DB
    const hariIni = todayWib()
    const sekarang = Math.floor(Date.now() / 1000)

    const [
      baru,
      aktif,
      terlambat,
      totalBarang,
      unitDipinjam,
      aktivitas,
      telat,
      menunggu,
      surat,
    ] = await Promise.all([
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
          `SELECT aksi, pengguna_nama, waktu FROM log_aktivitas ORDER BY waktu DESC LIMIT 5`,
        )
        .all<{ aksi: string; pengguna_nama: string | null; waktu: number }>(),
      // The three kinds of thing that wait on a person. Thresholds per the proposal's Q2
      // default: overdue from the first day, a request after two days, a letter after one
      // (it is handed over in person, so a same-day upload is not yet "waiting").
      db
        .prepare(
          `SELECT kode, organisasi, penanggung_jawab, tgl_kembali FROM pengajuan
             WHERE status = 'Dipinjam' AND tgl_kembali < ? ORDER BY tgl_kembali ASC`,
        )
        .bind(hariIni)
        .all<{
          kode: string
          organisasi: string
          penanggung_jawab: string
          tgl_kembali: string
        }>(),
      db
        .prepare(
          `SELECT kode, organisasi, penanggung_jawab, created_at FROM pengajuan
             WHERE status = 'Diajukan' AND created_at < ? ORDER BY created_at ASC`,
        )
        .bind(sekarang - 2 * 24 * 60 * 60)
        .all<{
          kode: string
          organisasi: string
          penanggung_jawab: string
          created_at: number
        }>(),
      db
        .prepare(
          `SELECT p.kode, p.organisasi, s.waktu FROM surat s
             JOIN pengajuan p ON p.id = s.pengajuan_id
             WHERE s.status_verifikasi = 'diterima' AND s.waktu < ?
             ORDER BY s.waktu ASC`,
        )
        .bind(sekarang - 24 * 60 * 60)
        .all<{ kode: string; organisasi: string; waktu: number }>(),
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
    // Who the bars are made of. Same population and same month key as `hitungBulan`, so the
    // names under a bar always add up to the number above it. Ordered by count so the
    // busiest borrower is the one the tooltip shows first.
    const { results: peminjamBulan } = await db
      .prepare(
        `SELECT substr(tgl_pinjam, 1, 7) AS bulan, organisasi, COUNT(*) AS c
         FROM pengajuan WHERE tgl_pinjam >= ?
         GROUP BY bulan, organisasi ORDER BY c DESC, organisasi ASC`,
      )
      .bind(`${awalBulan}-01`)
      .all<{ bulan: string; organisasi: string; c: number }>()
    const perBulan = Array.from({ length: 6 }, (_, i) => {
      const bulan = geserBulan(awalBulan, i)
      return {
        bulan,
        c: hitungBulan.find((h) => h.bulan === bulan)?.c ?? 0,
        peminjam: peminjamBulan
          .filter((p) => p.bulan === bulan)
          .map((p) => ({ organisasi: p.organisasi, c: p.c })),
      }
    })

    // One list, in the order it should be worked: overdue loans first, then the request that
    // has waited longest, then the letters. The card caps how many it draws; the count it
    // shows is the real backlog, not the capped length.
    const bedaHari = (dari: string, sampai: string) =>
      Math.round(
        (Date.parse(`${sampai}T00:00:00Z`) - Date.parse(`${dari}T00:00:00Z`)) /
          86_400_000,
      )
    const perluTindakan: Tindakan[] = [
      ...telat.results.map((r) => ({
        jenis: 'terlambat' as const,
        kode: r.kode,
        organisasi: r.organisasi,
        penanggungJawab: r.penanggung_jawab,
        hari: bedaHari(r.tgl_kembali, hariIni),
      })),
      ...menunggu.results.map((r) => ({
        jenis: 'menunggu' as const,
        kode: r.kode,
        organisasi: r.organisasi,
        penanggungJawab: r.penanggung_jawab,
        hari: Math.floor((sekarang - r.created_at) / 86_400),
      })),
      ...surat.results.map((r) => ({
        jenis: 'surat' as const,
        kode: r.kode,
        organisasi: r.organisasi,
        penanggungJawab: null,
        hari: Math.floor((sekarang - r.waktu) / 86_400),
      })),
    ]

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
      perluTindakan,
    }
  },
)

/* --- reports (FR18) ------------------------------------------------------- */

/** One borrowing-history row, as the table and the CSV both show it. */
export interface BarisLaporan {
  kode: string
  organisasi: string
  penanggungJawab: string
  tglPinjam: string
  tglKembali: string
  keperluan: string
  status: string
  barang: string
}

interface FilterLaporan {
  dari: string
  sampai: string
  status: string
  q: string
}

const SELECT_LAPORAN = `SELECT p.kode, p.organisasi, p.penanggung_jawab, p.tgl_pinjam, p.tgl_kembali,
        p.keperluan, p.status,
        (SELECT GROUP_CONCAT(b.nama || ' x' || pb.jumlah, ', ')
         FROM pengajuan_barang pb JOIN barang b ON b.id = pb.barang_id
         WHERE pb.pengajuan_id = p.id) AS barang
 FROM pengajuan p`

function whereLaporan(data: FilterLaporan): {
  where: string
  params: unknown[]
} {
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
  if (data.q.trim()) {
    clauses.push(
      '(p.kode LIKE ? OR p.organisasi LIKE ? OR p.penanggung_jawab LIKE ?)',
    )
    const like = `%${data.q.trim()}%`
    params.push(like, like, like)
  }
  return { where: susunWhere(clauses), params }
}

function petakanLaporan(r: Record<string, unknown>): BarisLaporan {
  return {
    kode: r.kode as string,
    organisasi: r.organisasi as string,
    penanggungJawab: r.penanggung_jawab as string,
    tglPinjam: r.tgl_pinjam as string,
    tglKembali: r.tgl_kembali as string,
    keperluan: r.keperluan as string,
    status: r.status as string,
    barang: (r.barang as string | null) ?? '—',
  }
}

/** Sortable report columns, keyed by the `sort` search param. */
const URUT_LAPORAN: Record<string, string> = {
  kode: 'p.kode',
  organisasi: 'p.organisasi',
  pinjam: 'p.tgl_pinjam',
  kembali: 'p.tgl_kembali',
  status: 'p.status',
}

const MasukanLaporan = z.object({
  dari: z.string().default(''),
  sampai: z.string().default(''),
  status: z.string().default('semua'),
  q: z.string().default(''),
  sort: z.string().default(''),
  dir: z.enum(['asc', 'desc']).default('asc'),
  halaman: z.number().int().min(1).default(1),
  perHalaman: z.number().int().default(PER_HALAMAN),
})

export const laporanPeminjaman = createServerFn({ method: 'GET' })
  .validator(MasukanLaporan)
  .handler(async ({ data }): Promise<HasilHalaman<BarisLaporan>> => {
    await butuhSesi()
    const { where, params } = whereLaporan(data)
    const order = pilihUrut(
      URUT_LAPORAN,
      data.sort,
      data.dir,
      'ORDER BY p.tgl_pinjam DESC',
    )
    const hasil = await ambilHalaman<Record<string, unknown>>(
      env.DB,
      {
        count: `SELECT COUNT(*) AS c FROM pengajuan p ${where}`,
        countSemua: `SELECT COUNT(*) AS c FROM pengajuan p`,
        rows: `${SELECT_LAPORAN} ${where} ${order}`,
      },
      params,
      data.halaman,
      data.perHalaman,
    )
    return { ...hasil, rows: hasil.rows.map(petakanLaporan) }
  })

/**
 * Every matching row, for CSV export. The table shows one page; the file must not, or an
 * export of a 200-row report would silently contain 25.
 */
export const eksporPeminjaman = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      dari: z.string().default(''),
      sampai: z.string().default(''),
      status: z.string().default('semua'),
      q: z.string().default(''),
    }),
  )
  .handler(async ({ data }): Promise<BarisLaporan[]> => {
    await butuhSesi()
    const { where, params } = whereLaporan(data)
    const { results } = await env.DB.prepare(
      `${SELECT_LAPORAN} ${where} ORDER BY p.tgl_pinjam DESC`,
    )
      .bind(...params)
      .all<Record<string, unknown>>()
    return results.map(petakanLaporan)
  })

/** One stock-recap row, including the damage/loss tally BR05 produces. */
export interface BarisStok {
  id: string
  nama: string
  kategori: string
  jumlah: number
  kondisi: string
  sedangDipinjam: number
  rusakHilang: number
}

interface FilterStok {
  q: string
  kategoriId: string
}

const SELECT_STOK = `SELECT b.id, b.nama, k.nama AS kategori, b.jumlah, b.kondisi,
        COALESCE((
          SELECT SUM(pb.jumlah) FROM pengajuan_barang pb
          JOIN pengajuan p ON p.id = pb.pengajuan_id
          WHERE pb.barang_id = b.id AND p.status = 'Dipinjam'
        ), 0) AS sedang_dipinjam,
        COALESCE((
          SELECT SUM(pi.jumlah) FROM pengembalian_item pi
          WHERE pi.barang_id = b.id AND pi.kondisi IN ('rusak', 'hilang')
        ), 0) AS rusak_hilang
 FROM barang b JOIN kategori k ON k.id = b.kategori_id`

function whereStok(data: FilterStok): { where: string; params: unknown[] } {
  const clauses: string[] = []
  const params: unknown[] = []
  if (data.q.trim()) {
    clauses.push('(b.nama LIKE ? OR k.nama LIKE ?)')
    const like = `%${data.q.trim()}%`
    params.push(like, like)
  }
  if (data.kategoriId) {
    clauses.push('b.kategori_id = ?')
    params.push(data.kategoriId)
  }
  return { where: susunWhere(clauses), params }
}

function petakanStok(r: Record<string, unknown>): BarisStok {
  return {
    id: r.id as string,
    nama: r.nama as string,
    kategori: r.kategori as string,
    jumlah: r.jumlah as number,
    kondisi: r.kondisi as string,
    sedangDipinjam: r.sedang_dipinjam as number,
    rusakHilang: r.rusak_hilang as number,
  }
}

/** Sortable stock columns, keyed by the `sort` search param. */
const URUT_STOK: Record<string, string> = {
  nama: 'b.nama',
  kategori: 'k.nama',
  jumlah: 'b.jumlah',
  kondisi: 'b.kondisi',
  dipinjam: 'sedang_dipinjam',
  rusak: 'rusak_hilang',
}

const MasukanStok = z.object({
  q: z.string().default(''),
  kategoriId: z.string().default(''),
  sort: z.string().default(''),
  dir: z.enum(['asc', 'desc']).default('asc'),
  halaman: z.number().int().min(1).default(1),
  perHalaman: z.number().int().default(PER_HALAMAN),
})

/** Stock recap, including the damage/loss tally BR05 produces (FR18). */
export const rekapStok = createServerFn({ method: 'GET' })
  .validator(MasukanStok)
  .handler(async ({ data }): Promise<HasilHalaman<BarisStok>> => {
    await butuhSesi()
    const { where, params } = whereStok(data)
    const order = pilihUrut(
      URUT_STOK,
      data.sort,
      data.dir,
      'ORDER BY k.nama ASC, b.nama ASC',
    )
    const hasil = await ambilHalaman<Record<string, unknown>>(
      env.DB,
      {
        count: `SELECT COUNT(*) AS c FROM barang b
                JOIN kategori k ON k.id = b.kategori_id ${where}`,
        countSemua: `SELECT COUNT(*) AS c FROM barang b
                     JOIN kategori k ON k.id = b.kategori_id`,
        rows: `${SELECT_STOK} ${where} ${order}`,
      },
      params,
      data.halaman,
      data.perHalaman,
    )
    return { ...hasil, rows: hasil.rows.map(petakanStok) }
  })

/** Every matching stock row, for CSV export. */
export const eksporStok = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      q: z.string().default(''),
      kategoriId: z.string().default(''),
    }),
  )
  .handler(async ({ data }): Promise<BarisStok[]> => {
    await butuhSesi()
    const { where, params } = whereStok(data)
    const { results } = await env.DB.prepare(
      `${SELECT_STOK} ${where} ORDER BY k.nama ASC, b.nama ASC`,
    )
      .bind(...params)
      .all<Record<string, unknown>>()
    return results.map(petakanStok)
  })
