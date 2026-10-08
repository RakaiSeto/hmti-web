import { describe, expect, it } from 'vitest'

import { cocokTerima, ekstensiBerkas, ukuranBerkas } from './unggahan'

describe('ekstensiBerkas — MIME type to stored extension', () => {
  it('maps each accepted type to its extension', () => {
    expect(ekstensiBerkas('application/pdf')).toBe('pdf')
    expect(ekstensiBerkas('image/png')).toBe('png')
    expect(ekstensiBerkas('image/webp')).toBe('webp')
  })

  it('maps both JPEG spellings and anything else to jpg', () => {
    expect(ekstensiBerkas('image/jpeg')).toBe('jpg')
    // Some browsers send the legacy spelling; it is in every image allowlist.
    expect(ekstensiBerkas('image/jpg')).toBe('jpg')
    expect(ekstensiBerkas('application/octet-stream')).toBe('jpg')
  })

  it('never returns a path separator or an empty string', () => {
    // The key is built as `prefix/${kode}.${ext}`, so an extension carrying `/` or `..`
    // would let a MIME type steer the object's path. None of the accepted types can, but
    // the mapping is the last thing standing between a header and the bucket.
    for (const type of ['', '/', '..', 'image/svg+xml']) {
      const ext = ekstensiBerkas(type)
      expect(ext).not.toContain('/')
      expect(ext).not.toContain('.')
      expect(ext.length).toBeGreaterThan(0)
    }
  })
})

describe('cocokTerima — the drop-zone guard', () => {
  const FOTO = 'image/jpeg,image/png,image/webp'
  const SURAT = 'application/pdf,image/png,image/jpeg'

  it('accepts a MIME type that is on the list', () => {
    expect(cocokTerima(FOTO, { name: 'a.jpg', type: 'image/jpeg' })).toBe(true)
    expect(cocokTerima(FOTO, { name: 'a.webp', type: 'image/webp' })).toBe(true)
  })

  it('rejects a type that is not — the case the attribute cannot catch on drop', () => {
    expect(
      cocokTerima(FOTO, { name: 'catatan.pdf', type: 'application/pdf' }),
    ).toBe(false)
    expect(
      cocokTerima(SURAT, { name: 'x.exe', type: 'application/x-msdownload' }),
    ).toBe(false)
  })

  it('falls back to the extension when the platform hands over no MIME type', () => {
    expect(cocokTerima(FOTO, { name: 'foto.JPG', type: '' })).toBe(true)
    // `jpeg` is normalised to `jpg`, which is the extension the MIME maps to.
    expect(cocokTerima(FOTO, { name: 'foto.jpeg', type: '' })).toBe(true)
    expect(cocokTerima(FOTO, { name: 'catatan.pdf', type: '' })).toBe(false)
    // An empty type is not a licence to accept anything.
    expect(cocokTerima(FOTO, { name: 'tanpa-ekstensi', type: '' })).toBe(false)
  })

  it('understands wildcard and .ext entries', () => {
    expect(cocokTerima('image/*', { name: 'a.png', type: 'image/png' })).toBe(
      true,
    )
    expect(
      cocokTerima('image/*', { name: 'a.pdf', type: 'application/pdf' }),
    ).toBe(false)
    expect(cocokTerima('.pdf', { name: 'a.pdf', type: '' })).toBe(true)
  })

  it('ignores spacing and case in the list', () => {
    expect(
      cocokTerima(' image/JPEG , image/png ', {
        name: 'a.jpg',
        type: 'IMAGE/JPEG',
      }),
    ).toBe(true)
  })
})

describe('ukuranBerkas — the size shown next to a picked file', () => {
  it('states kilobytes below a megabyte and megabytes above', () => {
    expect(ukuranBerkas(9233)).toBe('9 KB')
    expect(ukuranBerkas(1024 * 1024)).toBe('1 MB')
  })

  it('uses an Indonesian decimal comma, as the design writes it', () => {
    expect(ukuranBerkas(1_258_291)).toBe('1,2 MB')
  })
})
