/**
 * Field-level input validation, shared by the browser and the server.
 *
 * The rules live here rather than inline at each call site because every one of them is
 * needed twice: once in the form, so the operator is told before a round trip, and once in
 * the server function's validator, which is the check that actually holds. Two copies of a
 * rule is one copy that drifts.
 *
 * Pure — no bindings, no framework — so it is unit-tested in Node like `lib/tabel.ts`.
 */

/**
 * What a person types between the digits of a phone number. None of it carries meaning, so
 * the check strips it before deciding; the value is stored as typed, which keeps the
 * formatting the operator chose.
 */
const PEMISAH_KONTAK = /[\s.\-()]/g

/** An optional country code, then 8–15 digits. Indonesian mobiles land well inside this. */
const KONTAK = /^\+?\d{8,15}$/

/**
 * A phone number reduced to what it means, or null when it is not one.
 *
 * `kontakSah` is the boolean form; this exists so a caller that ever needs to *store* the
 * digits — a `wa.me` link, an SMS gateway — has one definition of "the digits" to use.
 */
export function normalkanKontak(mentah: string): string | null {
  const bersih = mentah.trim().replace(PEMISAH_KONTAK, '')
  return KONTAK.test(bersih) ? bersih : null
}

/**
 * Is this a phone number at all?
 *
 * Rejects anything that is not digits and separators — the placeholder shows
 * `0812-3456-7890`, so that shape has to pass, and `abcdefgh` has to not.
 */
export function kontakSah(mentah: string): boolean {
  return normalkanKontak(mentah) !== null
}

/**
 * Is this a real calendar date in `YYYY-MM-DD`?
 *
 * A shape-only check (`\d{4}-\d{2}-\d{2}`) accepts `2026-13-45` and `2026-02-30`, which then
 * reach the database as strings that sort and compare against real dates while meaning
 * nothing. Round-tripping through `Date` is what rejects them: an impossible day rolls over,
 * so the formatted result no longer matches the input.
 */
export function tanggalSah(teks: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(teks)) return false
  const d = new Date(`${teks}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === teks
}

/** Shortest password the policy accepts. */
export const PANJANG_SANDI = 8

/** The rule in one sentence, so the form and the server say the same thing. */
export const PESAN_SANDI =
  'Kata sandi minimal 8 karakter, tanpa spasi, serta memuat huruf kecil, huruf besar, dan angka.'

/**
 * Does this password meet the policy?
 *
 * Eight characters, no whitespace, and at least one lowercase letter, one uppercase letter
 * and one digit. Deliberately not a "must contain a symbol" rule: the length floor and the
 * three character classes are what was asked for, and every rule beyond that is another
 * reason a legitimate password gets refused.
 *
 * The no-whitespace clause is what closes the case that prompted this — `z.string().min(8)`
 * accepted eight spaces, which is a password nobody can be told over the phone.
 */
export function sandiSah(sandi: string): boolean {
  return (
    sandi.length >= PANJANG_SANDI &&
    !/\s/.test(sandi) &&
    /[a-z]/.test(sandi) &&
    /[A-Z]/.test(sandi) &&
    /\d/.test(sandi)
  )
}
