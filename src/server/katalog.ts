/**
 * Public catalog reads (FR01, FR02).
 *
 * These live in server functions rather than in route loaders on purpose. A TanStack
 * Start loader runs on the client as well as the server during a client-side navigation,
 * so a loader that touched `cloudflare:workers` would drag a Worker-only module into the
 * browser bundle and fail to resolve. Server functions keep the binding on the server.
 */
import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { z } from 'zod'

import { ketersediaanBanyak, statusDari } from '#/domain/availability'
import { bulanBounds, rentangTanggal, todayWib } from '#/lib/dates'

/**
 * Categories for the public filters (FR01).
 *
 * Deliberately unauthenticated: the catalog and the request form are borrower-facing and
 * have no session. The admin-side `daftarKategoriRef` stays session-gated — the two are
 * separate functions precisely so neither has to relax its guard.
 */
export const daftarKategoriPublik = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<{ id: string; nama: string }>> => {
    const { results } = await env.DB.prepare(
      `SELECT id, nama FROM kategori ORDER BY nama ASC`,
    ).all<{ id: string; nama: string }>()
    return results
  },
)

export interface BarangKatalog {
  id: string
  nama: string
  deskripsi: string | null
  lokasi: string | null
  kondisi: string
  jumlah: number
  kategoriNama: string
  /** Free units today. */
  tersedia: number
  status: 'Tersedia' | 'Terbatas' | 'Habis'
}

/** The catalog list (FR01). Public — no session required. */
export const katalogBarang = createServerFn({ method: 'GET' })
  .validator(
    z
      .object({ q: z.string().default(''), kategori: z.string().default('') })
      .default({ q: '', kategori: '' }),
  )
  .handler(async ({ data }): Promise<BarangKatalog[]> => {
    const clauses: string[] = []
    const params: unknown[] = []
    if (data.q.trim()) {
      clauses.push('(b.nama LIKE ? OR b.deskripsi LIKE ?)')
      const like = `%${data.q.trim()}%`
      params.push(like, like)
    }
    if (data.kategori) {
      clauses.push('b.kategori_id = ?')
      params.push(data.kategori)
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''

    const { results } = await env.DB.prepare(
      `SELECT b.id, b.nama, b.deskripsi, b.lokasi, b.kondisi, b.jumlah,
              k.nama AS kategori_nama
       FROM barang b JOIN kategori k ON k.id = b.kategori_id
       ${where} ORDER BY k.nama ASC, b.nama ASC`,
    )
      .bind(...params)
      .all<{
        id: string
        nama: string
        deskripsi: string | null
        lokasi: string | null
        kondisi: string
        jumlah: number
        kategori_nama: string
      }>()

    // Availability for today, one query for the whole list.
    const hariIni = todayWib()
    const map = await ketersediaanBanyak(
      results.map((r) => r.id),
      hariIni,
      tambahSatu(hariIni),
    )

    return results.map((r) => {
      const tersedia = map.get(r.id)?.tersedia ?? 0
      return {
        id: r.id,
        nama: r.nama,
        deskripsi: r.deskripsi,
        lokasi: r.lokasi,
        kondisi: r.kondisi,
        jumlah: r.jumlah,
        kategoriNama: r.kategori_nama,
        tersedia,
        status: statusDari(tersedia, r.jumlah),
      }
    })
  })

/** The item picker's data source for the request form (FR03). Public. */
export const daftarBarangUntukForm = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { results } = await env.DB.prepare(
      `SELECT b.id, b.nama, b.jumlah, b.lokasi, k.nama AS kategori_nama, k.id AS kategori_id
       FROM barang b JOIN kategori k ON k.id = b.kategori_id
       ORDER BY k.nama ASC, b.nama ASC`,
    ).all<{
      id: string
      nama: string
      jumlah: number
      lokasi: string | null
      kategori_nama: string
      kategori_id: string
    }>()
    return results.map((r) => ({
      id: r.id,
      nama: r.nama,
      jumlah: r.jumlah,
      lokasi: r.lokasi,
      kategoriId: r.kategori_id,
      kategoriNama: r.kategori_nama,
    }))
  },
)

export interface DetailBarangKatalog {
  barang: {
    id: string
    nama: string
    deskripsi: string | null
    lokasi: string | null
    kondisi: string
    jumlah: number
    kategoriNama: string
  }
  hari: Array<{
    tanggal: string
    tersedia: number
    jumlahTotal: number
    status: 'Tersedia' | 'Terbatas' | 'Habis'
  }>
  tersediaHariIni: number
}

/** One item plus a month of per-day availability (FR01, FR02). Public. */
export const detailBarangKatalog = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string(), bulan: z.string() }))
  .handler(async ({ data }): Promise<DetailBarangKatalog | null> => {
    const b = await env.DB.prepare(
      `SELECT b.*, k.nama AS kategori_nama FROM barang b
       JOIN kategori k ON k.id = b.kategori_id WHERE b.id = ?`,
    )
      .bind(data.id)
      .first<{
        id: string
        nama: string
        deskripsi: string | null
        lokasi: string | null
        kondisi: string
        jumlah: number
        kategori_nama: string
      }>()
    if (!b) return null

    const { awal, akhir } = bulanBounds(`${data.bulan}-01`)
    const { kalenderBulan } = await import('#/domain/availability')
    const hari = await kalenderBulan(b.id, rentangTanggal(awal, akhir))

    const hariIni = todayWib()
    const hariIniRow = hari.find((h) => h.tanggal === hariIni)
    const tersediaHariIni = hariIniRow
      ? hariIniRow.tersedia
      : hari.length > 0
        ? hari[0].tersedia
        : 0

    return {
      barang: {
        id: b.id,
        nama: b.nama,
        deskripsi: b.deskripsi,
        lokasi: b.lokasi,
        kondisi: b.kondisi,
        jumlah: b.jumlah,
        kategoriNama: b.kategori_nama,
      },
      hari,
      tersediaHariIni,
    }
  })

function tambahSatu(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}
