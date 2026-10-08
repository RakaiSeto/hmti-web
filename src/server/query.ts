/**
 * Shared SQL plumbing for the paginated admin lists.
 *
 * Every list server function builds the same three things: a `WHERE` clause from a list
 * of predicates, a `COUNT(*)` for the pager, and one `LIMIT`/`OFFSET` page of rows. This
 * module holds that shape so the six list functions do not each re-derive it.
 *
 * No bindings are imported here — the caller passes its own `D1Database` — so this module
 * stays safe to import from a server module without dragging `cloudflare:workers` around.
 */
import type { HasilHalaman } from '#/lib/tabel'
import {
  bagianHalaman,
  clampHalaman,
  PER_HALAMAN,
  ukuranHalaman,
} from '#/lib/tabel'

/** Join already-built predicates with `AND`; empty means no `WHERE` at all. */
export function susunWhere(clauses: string[]): string {
  return clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
}

/**
 * Run the count and the requested page for one list query.
 *
 * `count` is a complete `SELECT COUNT(*) AS c ...` for the filtered set; `rows` is a
 * complete `SELECT ...` with its `ORDER BY` but no `LIMIT`; `countSemua` is the same count
 * with no filter, for the "menampilkan x dari y" footer. All share `params`, in order. The
 * requested page is clamped to the real range, so an out-of-range URL yields the last page
 * rather than an empty table.
 */
export async function ambilHalaman<T>(
  db: D1Database,
  sql: { count: string; rows: string; countSemua?: string },
  params: unknown[],
  halaman: number,
  perHalaman = PER_HALAMAN,
): Promise<HasilHalaman<T>> {
  const [total, semua] = await Promise.all([
    db
      .prepare(sql.count)
      .bind(...params)
      .first<{ c: number }>(),
    sql.countSemua
      ? db.prepare(sql.countSemua).first<{ c: number }>()
      : Promise.resolve(null),
  ])
  const jumlah = total?.c ?? 0
  const jumlahSemua = Math.max(semua?.c ?? jumlah, jumlah)
  // Normalise here too: a server function is callable directly, so the page size must be
  // forced into the whitelist regardless of what the caller sent.
  const ukuran = ukuranHalaman(perHalaman)
  const halamanAman = clampHalaman(halaman, jumlah, ukuran)
  const { limit, offset } = bagianHalaman(halamanAman, ukuran)
  const { results } = await db
    .prepare(`${sql.rows} LIMIT ? OFFSET ?`)
    .bind(...params, limit, offset)
    .all<T>()
  return {
    rows: results,
    total: jumlah,
    totalSemua: jumlahSemua,
    perHalaman: ukuran,
    halaman: halamanAman,
  }
}

/**
 * An `ORDER BY` clause from a whitelist of sort keys.
 *
 * `urut` maps a sort key to a column expression; anything not in it falls back to
 * `bawaan`, so a hand-edited sort key can never reach SQL.
 */
export function pilihUrut(
  urut: Record<string, string>,
  sort: string,
  dir: 'asc' | 'desc',
  bawaan: string,
): string {
  const kolom = urut[sort]
  if (!kolom) return bawaan
  return `ORDER BY ${kolom} ${dir === 'desc' ? 'DESC' : 'ASC'}`
}
