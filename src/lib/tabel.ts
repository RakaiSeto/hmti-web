/**
 * List-table mechanics: pagination, sorting, and the search-param shapes every admin
 * list route shares.
 *
 * Pure — no bindings, no framework — so it is unit-tested in Node like `lib/csv.ts` and
 * `lib/origins.ts`. The server side of the same pattern (`LIMIT`/`OFFSET`, `ORDER BY`)
 * lives in `server/query.ts`, which imports the maths below.
 */

/** Rows per page by default. The user can pick another size from `UKURAN_HALAMAN`. */
export const PER_HALAMAN = 10

/** The page sizes a user may choose. A whitelist, so a hand-edited URL cannot ask for
 * everything at once. */
export const UKURAN_HALAMAN = [10, 25, 50, 100] as const

/** Coerce a requested page size to an allowed one; anything unknown falls back to the
 * default. Used server-side, so a crafted `perHalaman` cannot exceed the whitelist. */
export function ukuranHalaman(perHalaman: number | undefined): number {
  return perHalaman !== undefined &&
    (UKURAN_HALAMAN as readonly number[]).includes(perHalaman)
    ? perHalaman
    : PER_HALAMAN
}

/** Ascending or descending, as the `dir` param carries it. */
export type ArahUrut = 'asc' | 'desc'

/** A page of rows plus the counts the pager needs. The shape every list server fn returns. */
export interface HasilHalaman<T> {
  rows: T[]
  /** Rows matching the current filters. */
  total: number
  /** Rows in the whole table, ignoring the filters — for the "x dari y" footer. */
  totalSemua: number
  perHalaman: number
  halaman: number
}

/** Page count for `total` rows; never below 1, so an empty list is still "page 1 of 1". */
export function totalHalaman(total: number, perHalaman = PER_HALAMAN): number {
  return Math.max(1, Math.ceil(total / perHalaman))
}

/** `LIMIT`/`OFFSET` for a 1-based page number. */
export function bagianHalaman(
  halaman: number,
  perHalaman = PER_HALAMAN,
): { limit: number; offset: number } {
  return { limit: perHalaman, offset: (Math.max(1, halaman) - 1) * perHalaman }
}

/**
 * Clamp a requested page into range. A stale `?halaman=9` after the list shrank lands on
 * the last page instead of rendering an empty table under a pager that says otherwise.
 */
export function clampHalaman(
  halaman: number,
  total: number,
  perHalaman = PER_HALAMAN,
): number {
  return Math.min(Math.max(1, halaman), totalHalaman(total, perHalaman))
}
