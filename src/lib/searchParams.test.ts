import { describe, expect, it } from 'vitest'

import { parseSearchParams, stringifySearchParams } from './searchParams'

describe('parseSearchParams', () => {
  it('returns every param as a string, without JSON coercion', () => {
    expect(parseSearchParams('?q=5&halaman=2')).toEqual({
      q: '5',
      halaman: '2',
    })
    expect(parseSearchParams('q=5')).toEqual({ q: '5' })
    expect(parseSearchParams('')).toEqual({})
    expect(parseSearchParams('?')).toEqual({})
  })

  it('decodes percent-encoding and plus-as-space', () => {
    expect(parseSearchParams('?q=%225%22')).toEqual({ q: '"5"' })
    expect(parseSearchParams('?q=a+b')).toEqual({ q: 'a b' })
    expect(parseSearchParams('?q=a%2Bb')).toEqual({ q: 'a+b' })
  })
})

describe('stringifySearchParams', () => {
  it('leaves numeric-looking strings unquoted', () => {
    expect(stringifySearchParams({ q: '5' })).toBe('?q=5')
    expect(stringifySearchParams({ q: '2026' })).toBe('?q=2026')
  })

  it('drops undefined and null, and keeps empty strings', () => {
    expect(stringifySearchParams({ q: undefined, halaman: 2 })).toBe(
      '?halaman=2',
    )
    expect(stringifySearchParams({ q: null, halaman: 2 })).toBe('?halaman=2')
    expect(stringifySearchParams({})).toBe('')
  })

  it('serializes booleans as 1/0', () => {
    expect(stringifySearchParams({ aktif: true })).toBe('?aktif=1')
    expect(stringifySearchParams({ aktif: false })).toBe('?aktif=0')
  })

  it('round-trips through parse without changing types', () => {
    const awal = {
      q: '5',
      kategori: '01M4D7N64Y9DNHYBKNQ24QSGG8',
      halaman: '2',
    }
    expect(parseSearchParams(stringifySearchParams(awal))).toEqual(awal)
  })
})
