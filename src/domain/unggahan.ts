/**
 * Uploads — the part of a file's handling that is the same wherever it is stored.
 *
 * Three paths write to the bucket (`letters/`, `photos/`, `returns/`) and each owns its own
 * MIME allowlist and size cap, because those genuinely differ: a letter may be a PDF and
 * runs to 8 MB, an item photo is a catalogue image capped at 2 MB. What they must not each
 * own is the MIME → extension mapping, which is what this module holds — three copies of a
 * nested ternary is three chances for the stored extension to disagree with the
 * `Content-Type` it was saved under.
 *
 * Pure, so it is unit-tested in Node like `lib/tabel.ts`.
 */

/**
 * The extension a stored object gets, from the MIME type it was accepted under.
 *
 * Every caller validates the type against its own allowlist *before* asking, so the `jpg`
 * fallback is unreachable in practice; it exists so the return type is a total function
 * rather than one that can hand back `undefined` for a key.
 */
export function ekstensiBerkas(type: string): string {
  switch (type) {
    case 'application/pdf':
      return 'pdf'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return 'jpg'
  }
}

/** The extension each accepted MIME type is stored under, for matching by file name. */
const EKSTENSI_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/**
 * Does a file match an `accept` list?
 *
 * The `accept` attribute only filters what the file manager offers, so a dragged file can
 * be anything at all. This is what stops a dropped PDF from being sent to a photo field and
 * coming back as a round-trip error.
 *
 * Entries are matched as MIME types, `type/*` wildcards, or `.ext` suffixes — the three
 * forms the attribute accepts. A file with no usable MIME type (some platforms hand one
 * over as an empty string on drag) falls back to its extension, compared against the
 * extension that MIME would be stored under, so `photo.jpeg` still matches `image/jpeg`.
 */
export function cocokTerima(
  accept: string,
  file: { name: string; type: string },
): boolean {
  const aturan = accept
    .split(',')
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
  const tipe = file.type.toLowerCase()
  const ext = (file.name.toLowerCase().split('.').pop() ?? '').replace(
    /^jpeg$/,
    'jpg',
  )

  return aturan.some((a) => {
    if (a.startsWith('.')) return ext === a.slice(1)
    if (a.endsWith('/*')) return tipe.startsWith(a.slice(0, -1))
    if (tipe === a) return true
    return tipe === '' && EKSTENSI_MIME[a] === ext
  })
}

/**
 * A file size as the UI states it: `9 KB`, `1,2 MB`.
 *
 * Indonesian formatting, so the decimal separator is a comma — the design writes `1,2 MB`
 * in its own upload list.
 */
export function ukuranBerkas(bytes: number): string {
  const angka = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 })
  return bytes >= 1024 * 1024
    ? `${angka.format(bytes / (1024 * 1024))} MB`
    : `${angka.format(bytes / 1024)} KB`
}
