/**
 * Identifier minting.
 *
 * A ULID-style string: 48-bit millisecond timestamp (base32) followed by randomness.
 * Chosen over an autoincrement because ids appear in URLs and the activity log — a
 * sequential integer would leak how much the org borrows and invite enumeration.
 *
 * Lexicographic order matches creation order, which makes `ORDER BY id` a usable
 * tiebreak in the log without a second column.
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ' // Crockford base32, no I/L/O/U

function encodeTime(ms: number, len: number): string {
  let out = ''
  for (let i = len - 1; i >= 0; i--) {
    out = ALPHABET[ms % 32] + out
    ms = Math.floor(ms / 32)
  }
  return out
}

function encodeRandom(len: number): string {
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % 32]
  return out
}

/** 26 characters: 10 of timestamp + 16 of randomness. */
export function newId(): string {
  return encodeTime(Date.now(), 10) + encodeRandom(16)
}

/**
 * A request tracking code (FR05): `PINJ-YYYYMM-XXXX`.
 *
 * The tail is random rather than sequential because the code is the *only* auth on
 * `/lacak` — a sequential suffix would let anyone enumerate other organisations'
 * requests, including their contact details and borrowing history.
 */
export function newKode(now = new Date()): string {
  const ym = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const tail = Array.from(bytes, (b) => ALPHABET[b % 32]).join('')
  return `PINJ-${ym}-${tail}`
}

/** Normalise a user-typed code: uppercase, trim, tolerate a lowercase paste. */
export function normaliseKode(raw: string): string {
  return raw.trim().toUpperCase()
}
