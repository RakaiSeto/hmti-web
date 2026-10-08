import { describe, expect, it } from 'vitest'

import {
  bagianHalaman,
  clampHalaman,
  PER_HALAMAN,
  totalHalaman,
  ukuranHalaman,
} from './tabel'

describe('PER_HALAMAN', () => {
  it('defaults to 10 rows per page', () => {
    expect(PER_HALAMAN).toBe(10)
  })
})

describe('totalHalaman', () => {
  it('rounds up and never drops below one page', () => {
    expect(totalHalaman(0)).toBe(1)
    expect(totalHalaman(1)).toBe(1)
    expect(totalHalaman(10)).toBe(1)
    expect(totalHalaman(11)).toBe(2)
  })

  it('uses the given page size', () => {
    expect(totalHalaman(25, 25)).toBe(1)
    expect(totalHalaman(26, 25)).toBe(2)
    expect(totalHalaman(101, 100)).toBe(2)
  })
})

describe('bagianHalaman', () => {
  it('maps a 1-based page to a LIMIT/OFFSET pair', () => {
    expect(bagianHalaman(1)).toEqual({ limit: 10, offset: 0 })
    expect(bagianHalaman(2)).toEqual({ limit: 10, offset: 10 })
    expect(bagianHalaman(3, 25)).toEqual({ limit: 25, offset: 50 })
  })

  it('treats a page below one as the first page', () => {
    expect(bagianHalaman(0).offset).toBe(0)
  })
})

describe('clampHalaman', () => {
  it('pins an out-of-range page to the last real page', () => {
    // 51 rows over 25/page is 3 pages; asking for 9 lands on 3, not an empty table.
    expect(clampHalaman(9, 51, 25)).toBe(3)
    expect(clampHalaman(0, 51, 25)).toBe(1)
    expect(clampHalaman(2, 51, 25)).toBe(2)
  })

  it('returns page 1 for an empty list', () => {
    expect(clampHalaman(4, 0)).toBe(1)
  })
})

describe('ukuranHalaman', () => {
  it('accepts only a whitelisted page size, defaulting otherwise', () => {
    expect(ukuranHalaman(undefined)).toBe(PER_HALAMAN)
    expect(ukuranHalaman(25)).toBe(25)
    expect(ukuranHalaman(100)).toBe(100)
    expect(ukuranHalaman(13)).toBe(PER_HALAMAN)
    expect(ukuranHalaman(0)).toBe(PER_HALAMAN)
  })
})
