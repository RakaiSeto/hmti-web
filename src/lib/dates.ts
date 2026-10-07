/**
 * Dates.
 *
 * Two rules from decisions.md D10, and they are not interchangeable:
 *
 *   STORAGE  calendar dates are `YYYY-MM-DD` strings. They sort lexicographically,
 *            which is what makes `tgl_pinjam < ?` a valid range predicate in SQL.
 *            A `dd-mm-yyyy` string sorts `10-10-2026` before `09-11-2026`, which
 *            would silently corrupt every overlap query and the calendar.
 *
 *   DISPLAY  humans see `dd-mm-yyyy` in Asia/Jakarta. One helper does the
 *            conversion; no component formats a date itself.
 *
 * "Today" is always resolved in Asia/Jakarta. Workers run in UTC, so `new Date()`'s
 * local date is wrong for WIB between 17:00 and 24:00 UTC.
 */

export const ZONA = 'Asia/Jakarta'

/** `YYYY-MM-DD` in WIB for a given instant (default: now). */
export function todayWib(now: Date = new Date()): string {
  // en-CA gives ISO-style YYYY-MM-DD directly.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** Parse `YYYY-MM-DD` into a UTC-midnight Date, for arithmetic only. */
export function parseTanggal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

/** Format a `YYYY-MM-DD` string for display: `10-10-2026`. */
export function formatTanggal(iso: string | null | undefined): string {
  if (!iso) return '—'
  // A full timestamp in a date column is a data error, but showing the date part beats
  // showing a raw ISO string or crashing.
  iso = iso.slice(0, 10)
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}-${m}-${y}`
}

/**
 * Format an instant for display: `10-10-2026 14:32` in WIB.
 *
 * An invalid Date is reported as `—` rather than throwing. `Intl.format` raises a
 * RangeError on `Invalid Date`, which would take down an entire page over one malformed
 * row; a placeholder keeps the rest of the record readable.
 */
export function formatWaktu(waktu: Date | null | undefined): string {
  if (!waktu || Number.isNaN(waktu.getTime())) return '—'
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(waktu)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('day')}-${get('month')}-${get('year')} ${get('hour')}:${get('minute')}`
}

/** Whole days from `a` to `b`; negative when `b` precedes `a`. */
export function selisihHari(a: string, b: string): number {
  const MS = 86_400_000
  return Math.round(
    (parseTanggal(b).getTime() - parseTanggal(a).getTime()) / MS,
  )
}

/** Add days to a `YYYY-MM-DD` string. */
export function tambahHari(iso: string, days: number): string {
  const d = parseTanggal(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Every `YYYY-MM-DD` from `start` to `end`, inclusive. */
export function rentangTanggal(start: string, end: string): string[] {
  const out: string[] = []
  let cur = start
  while (cur <= end) {
    out.push(cur)
    cur = tambahHari(cur, 1)
  }
  return out
}

/** The first day of the month containing `iso`, and the last. */
export function bulanBounds(iso: string): { awal: string; akhir: string } {
  const [y, m] = iso.split('-').map(Number)
  const awal = `${y}-${String(m).padStart(2, '0')}-01`
  const akhir = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
  return { awal, akhir }
}

/** Shift a `YYYY-MM` month key by `delta` months. */
export function geserBulan(bulan: string, delta: number): string {
  const [y, m] = bulan.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
