/**
 * Inventory server functions: categories and items (FR09, FR10).
 *
 * Admin-only throughout — a PJ inventaris cannot manage items (v2 role split). The guard
 * is on every mutation, not on the route, because a server function is callable directly.
 */
import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { z } from 'zod'

import { KONDISI } from '#/db/schema'
import { statusDari } from '#/domain/ketersediaan'
import { logAksi } from '#/domain/log'
import { ekstensiBerkas } from '#/domain/unggahan'
import { todayWib } from '#/lib/dates'
import { butuhAdmin, butuhSesi } from '#/lib/guards'
import { newId } from '#/lib/id'
import type { HasilHalaman } from '#/lib/tabel'
import { PER_HALAMAN } from '#/lib/tabel'
import { ambilHalaman, pilihUrut, susunWhere } from './query'

/* --- categories (FR10) ---------------------------------------------------- */

/** Sortable category columns, keyed by the `sort` search param. */
const URUT_KATEGORI: Record<string, string> = {
  nama: 'k.nama',
  jumlah: 'jumlah_barang',
}

export interface BarisKategori {
  id: string
  nama: string
  jumlah_barang: number
}

export const daftarKategori = createServerFn({ method: 'GET' })
  .validator(
    z
      .object({
        q: z.string().default(''),
        sort: z.string().default(''),
        dir: z.enum(['asc', 'desc']).default('asc'),
        halaman: z.number().int().min(1).default(1),
        perHalaman: z.number().int().default(PER_HALAMAN),
      })
      .default({
        q: '',
        sort: '',
        dir: 'asc',
        halaman: 1,
        perHalaman: PER_HALAMAN,
      }),
  )
  .handler(async ({ data }): Promise<HasilHalaman<BarisKategori>> => {
    await butuhSesi()
    const clauses: string[] = []
    const params: unknown[] = []
    if (data.q.trim()) {
      clauses.push('k.nama LIKE ?')
      params.push(`%${data.q.trim()}%`)
    }
    const where = susunWhere(clauses)
    const order = pilihUrut(
      URUT_KATEGORI,
      data.sort,
      data.dir,
      'ORDER BY k.nama ASC',
    )
    return ambilHalaman<BarisKategori>(
      env.DB,
      {
        count: `SELECT COUNT(*) AS c FROM kategori k ${where}`,
        countSemua: `SELECT COUNT(*) AS c FROM kategori k`,
        rows: `SELECT k.id, k.nama,
                      (SELECT COUNT(*) FROM barang b WHERE b.kategori_id = k.id) AS jumlah_barang
               FROM kategori k ${where} ${order}`,
      },
      params,
      data.halaman,
      data.perHalaman,
    )
  })

/**
 * Just `{id, nama}`, for populating a select. Available to both roles: a PJ inventaris
 * cannot manage categories but does need to filter by them.
 */
export const daftarKategoriRef = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<{ id: string; nama: string }>> => {
    await butuhSesi()
    const { results } = await env.DB.prepare(
      `SELECT id, nama FROM kategori ORDER BY nama ASC`,
    ).all<{ id: string; nama: string }>()
    return results
  },
)

export const simpanKategori = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().optional(),
      nama: z.string().trim().min(2, 'Nama kategori wajib diisi').max(60),
    }),
  )
  .handler(
    async ({ data }): Promise<{ ok: true } | { ok: false; pesan: string }> => {
      const sesi = await butuhAdmin()
      const nama = data.nama.trim()
      try {
        if (data.id) {
          await env.DB.prepare(`UPDATE kategori SET nama = ? WHERE id = ?`)
            .bind(nama, data.id)
            .run()
        } else {
          await env.DB.prepare(
            `INSERT INTO kategori (id, nama, created_at) VALUES (?, ?, ?)`,
          )
            .bind(newId(), nama, Math.floor(Date.now() / 1000))
            .run()
        }
      } catch {
        return { ok: false as const, pesan: `Kategori "${nama}" sudah ada.` }
      }
      await logAksi({
        penggunaId: sesi.id,
        penggunaNama: sesi.nama,
        aksi: data.id ? 'mengubah' : 'membuat',
        entitas: 'kategori',
        entitasId: data.id ?? null,
      })
      return { ok: true as const }
    },
  )

/**
 * Delete a category (FR10). Refused while it still holds items — the rule the plan asks
 * to be visible in the UI rather than silent. Reassigning is the admin's call, not
 * something this function guesses.
 */
export const hapusKategori = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string() }))
  .handler(
    async ({ data }): Promise<{ ok: true } | { ok: false; pesan: string }> => {
      const sesi = await butuhAdmin()
      const pakai = await env.DB.prepare(
        `SELECT COUNT(*) AS c FROM barang WHERE kategori_id = ?`,
      )
        .bind(data.id)
        .first<{ c: number }>()
      if ((pakai?.c ?? 0) > 0) {
        return {
          ok: false as const,
          pesan: `Kategori ini masih dipakai ${pakai!.c} barang. Pindahkan barangnya dulu.`,
        }
      }
      await env.DB.prepare(`DELETE FROM kategori WHERE id = ?`)
        .bind(data.id)
        .run()
      await logAksi({
        penggunaId: sesi.id,
        penggunaNama: sesi.nama,
        aksi: 'menghapus',
        entitas: 'kategori',
        entitasId: data.id,
      })
      return { ok: true as const }
    },
  )

/* --- items (FR09) --------------------------------------------------------- */

export interface BarangRingkas {
  id: string
  nama: string
  kategoriId: string
  kategoriNama: string
  jumlah: number
  kondisi: string
  lokasi: string | null
  deskripsi: string | null
  fotoPath: string | null
  /** Free units right now, derived (never stored). */
  tersedia: number
  statusKetersediaan: 'Tersedia' | 'Terbatas' | 'Habis'
}

/** Sortable item columns, keyed by the `sort` search param. */
const URUT_BARANG: Record<string, string> = {
  nama: 'b.nama',
  kategori: 'k.nama',
  jumlah: 'b.jumlah',
  kondisi: 'b.kondisi',
}

export const daftarBarang = createServerFn({ method: 'GET' })
  .validator(
    z
      .object({
        q: z.string().default(''),
        kategoriId: z.string().default(''),
        sort: z.string().default(''),
        dir: z.enum(['asc', 'desc']).default('asc'),
        halaman: z.number().int().min(1).default(1),
        perHalaman: z.number().int().default(PER_HALAMAN),
      })
      .default({
        q: '',
        kategoriId: '',
        sort: '',
        dir: 'asc',
        halaman: 1,
        perHalaman: PER_HALAMAN,
      }),
  )
  .handler(async ({ data }): Promise<HasilHalaman<BarangRingkas>> => {
    await butuhSesi()
    const clauses: string[] = []
    const params: unknown[] = []
    if (data.q.trim()) {
      clauses.push('(b.nama LIKE ? OR b.lokasi LIKE ?)')
      const like = `%${data.q.trim()}%`
      params.push(like, like)
    }
    if (data.kategoriId) {
      clauses.push('b.kategori_id = ?')
      params.push(data.kategoriId)
    }
    const where = susunWhere(clauses)
    const order = pilihUrut(
      URUT_BARANG,
      data.sort,
      data.dir,
      'ORDER BY b.nama ASC',
    )

    const halaman = await ambilHalaman<Record<string, unknown>>(
      env.DB,
      {
        count: `SELECT COUNT(*) AS c FROM barang b
                JOIN kategori k ON k.id = b.kategori_id ${where}`,
        countSemua: `SELECT COUNT(*) AS c FROM barang b
                     JOIN kategori k ON k.id = b.kategori_id`,
        rows: `SELECT b.*, k.nama AS kategori_nama FROM barang b
               JOIN kategori k ON k.id = b.kategori_id
               ${where} ${order}`,
      },
      params,
      data.halaman,
      data.perHalaman,
    )

    // Availability for "today" — the list's badge is a right-now reading, not a window.
    // Computed for this page's rows only, which is the point of paginating.
    const hariIni = todayWib()
    const besok = new Date(`${hariIni}T00:00:00Z`)
    besok.setUTCDate(besok.getUTCDate() + 1)
    const { ketersediaanBanyak } = await import('#/domain/availability')
    const map = await ketersediaanBanyak(
      halaman.rows.map((r) => r.id as string),
      hariIni,
      besok.toISOString().slice(0, 10),
    )

    return {
      ...halaman,
      rows: halaman.rows.map((r) => {
        const k = map.get(r.id as string)
        const tersedia = k?.tersedia ?? 0
        return {
          id: r.id as string,
          nama: r.nama as string,
          kategoriId: r.kategori_id as string,
          kategoriNama: r.kategori_nama as string,
          jumlah: r.jumlah as number,
          kondisi: r.kondisi as string,
          lokasi: (r.lokasi as string | null) ?? null,
          deskripsi: (r.deskripsi as string | null) ?? null,
          fotoPath: (r.foto_path as string | null) ?? null,
          tersedia,
          statusKetersediaan: statusDari(tersedia, r.jumlah as number),
        }
      }),
    }
  })

export const ambilBarang = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await butuhSesi()
    const row = await env.DB.prepare(`SELECT * FROM barang WHERE id = ?`)
      .bind(data.id)
      .first<Record<string, unknown>>()
    if (!row) return null
    return {
      id: row.id as string,
      nama: row.nama as string,
      kategoriId: row.kategori_id as string,
      jumlah: row.jumlah as number,
      kondisi: row.kondisi as string,
      lokasi: (row.lokasi as string | null) ?? null,
      deskripsi: (row.deskripsi as string | null) ?? null,
      fotoPath: (row.foto_path as string | null) ?? null,
    }
  })

const MasukanBarang = z.object({
  id: z.string().optional(),
  nama: z.string().trim().min(2, 'Nama barang wajib diisi').max(120),
  kategoriId: z.string().min(1, 'Kategori wajib dipilih'),
  jumlah: z.number().int().min(0, 'Jumlah tidak boleh negatif').max(9999),
  kondisi: z.enum(KONDISI),
  lokasi: z.string().trim().max(120).default(''),
  deskripsi: z.string().trim().max(1000).default(''),
})

export const simpanBarang = createServerFn({ method: 'POST' })
  .validator(MasukanBarang)
  .handler(
    async ({ data }): Promise<{ ok: true } | { ok: false; pesan: string }> => {
      const sesi = await butuhAdmin()
      const now = Math.floor(Date.now() / 1000)

      // The category is a foreign key, so a stale one (deleted in another tab while this
      // form sat open) would fail the write with a constraint error and no explanation.
      // One primary-key lookup turns that into a sentence the operator can act on.
      const kategori = await env.DB.prepare(
        `SELECT id FROM kategori WHERE id = ?`,
      )
        .bind(data.kategoriId)
        .first<{ id: string }>()
      if (!kategori) {
        return {
          ok: false as const,
          pesan:
            'Kategori yang dipilih sudah tidak ada. Muat ulang halaman ini, lalu pilih kategori lain.',
        }
      }

      if (data.id) {
        await env.DB.prepare(
          `UPDATE barang SET nama = ?, kategori_id = ?, jumlah = ?, kondisi = ?,
                           lokasi = ?, deskripsi = ?, updated_at = ?
         WHERE id = ?`,
        )
          .bind(
            data.nama,
            data.kategoriId,
            data.jumlah,
            data.kondisi,
            data.lokasi || null,
            data.deskripsi || null,
            now,
            data.id,
          )
          .run()
      } else {
        await env.DB.prepare(
          `INSERT INTO barang (id, nama, kategori_id, jumlah, kondisi, lokasi, deskripsi,
                             foto_path, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
        )
          .bind(
            newId(),
            data.nama,
            data.kategoriId,
            data.jumlah,
            data.kondisi,
            data.lokasi || null,
            data.deskripsi || null,
            now,
            now,
          )
          .run()
      }
      await logAksi({
        penggunaId: sesi.id,
        penggunaNama: sesi.nama,
        aksi: data.id ? 'mengubah' : 'membuat',
        entitas: 'barang',
        entitasId: data.id ?? null,
      })
      return { ok: true as const }
    },
  )

/**
 * Delete an item (FR09). Refused while it appears in any request that has not finished —
 * silently removing it would leave those requests describing a thing that no longer
 * exists. Finished requests keep their history, so they do not block.
 */
export const hapusBarang = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string() }))
  .handler(
    async ({ data }): Promise<{ ok: true } | { ok: false; pesan: string }> => {
      const sesi = await butuhAdmin()
      const pakai = await env.DB.prepare(
        `SELECT COUNT(*) AS c FROM pengajuan_barang pb
       JOIN pengajuan p ON p.id = pb.pengajuan_id
       WHERE pb.barang_id = ? AND p.status NOT IN ('Selesai', 'Ditolak', 'Dibatalkan')`,
      )
        .bind(data.id)
        .first<{ c: number }>()
      if ((pakai?.c ?? 0) > 0) {
        return {
          ok: false as const,
          pesan: `Barang ini masih dipakai di ${pakai!.c} pengajuan yang belum selesai.`,
        }
      }
      // Line rows on finished requests are history; keep them and drop the FK by clearing
      // nothing — instead the item row stays if it has any history at all.
      const histori = await env.DB.prepare(
        `SELECT COUNT(*) AS c FROM pengajuan_barang WHERE barang_id = ?`,
      )
        .bind(data.id)
        .first<{ c: number }>()
      if ((histori?.c ?? 0) > 0) {
        return {
          ok: false as const,
          pesan:
            'Barang ini punya riwayat peminjaman, jadi tidak bisa dihapus. ' +
            'Ubah jumlahnya menjadi 0 untuk menandainya tidak tersedia.',
        }
      }
      await env.DB.prepare(`DELETE FROM barang WHERE id = ?`)
        .bind(data.id)
        .run()
      await logAksi({
        penggunaId: sesi.id,
        penggunaNama: sesi.nama,
        aksi: 'menghapus',
        entitas: 'barang',
        entitasId: data.id,
      })
      return { ok: true as const }
    },
  )

/* --- item photos (INV-09) ------------------------------------------------- */

const TIPE_FOTO = ['image/jpeg', 'image/png', 'image/webp']
const MAKS_FOTO = 2 * 1024 * 1024

/**
 * Upload or replace an item photo in R2 under `photos/` (public data, long cache).
 *
 * FormData, for the same reason `unggahSurat` uses it: a `File` cannot cross the
 * server-function boundary as JSON. This took `{ barangId, file }` as a plain object until
 * now, which never reached the server — the call rejected on the client and the photo was
 * silently never saved.
 */
export const unggahFoto = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error('Diharapkan FormData')
    const barangId = String(data.get('barangId') ?? '')
    const file = data.get('file')
    if (!barangId) throw new Error('Barang wajib dipilih')
    if (!(file instanceof File)) throw new Error('Berkas foto wajib dipilih')
    return { barangId, file }
  })
  .handler(async ({ data }) => {
    await butuhAdmin()
    if (!TIPE_FOTO.includes(data.file.type)) {
      return {
        ok: false as const,
        pesan: 'Format foto harus JPG, PNG, atau WebP.',
      }
    }
    if (data.file.size > MAKS_FOTO) {
      return { ok: false as const, pesan: 'Ukuran foto maksimal 2 MB.' }
    }
    const key = `photos/${data.barangId}.${ekstensiBerkas(data.file.type)}`
    await env.BUCKET.put(key, data.file.stream(), {
      httpMetadata: { contentType: data.file.type },
    })
    await env.DB.prepare(`UPDATE barang SET foto_path = ? WHERE id = ?`)
      .bind(key, data.barangId)
      .run()
    return { ok: true as const, path: key }
  })

/** Serve an item photo. Public — catalog images are not sensitive. */
export const ambilFoto = createServerFn({ method: 'GET' })
  .validator(z.object({ path: z.string() }))
  .handler(async ({ data }) => {
    const obj = await env.BUCKET.get(data.path)
    if (!obj) return null
    const buf = await obj.arrayBuffer()
    return {
      base64: btoa(String.fromCharCode(...new Uint8Array(buf))),
      contentType: obj.httpMetadata?.contentType ?? 'image/jpeg',
    }
  })
