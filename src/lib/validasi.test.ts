import { describe, expect, it } from 'vitest'

import { kontakSah, normalkanKontak, tanggalSah } from './validasi'

describe('kontakSah — is this a phone number', () => {
  it('accepts the shapes people actually type', () => {
    expect(kontakSah('0812-3456-7890')).toBe(true)
    expect(kontakSah('08123456789')).toBe(true)
    expect(kontakSah('0812 3456 7890')).toBe(true)
    expect(kontakSah('+62 812-3456-7890')).toBe(true)
    expect(kontakSah('+6281234567890')).toBe(true)
    expect(kontakSah('(0341) 555-123')).toBe(true)
  })

  it('rejects letters and punctuation, which is the point', () => {
    expect(kontakSah('abcdefgh')).toBe(false)
    expect(kontakSah('0812-ABCD-7890')).toBe(false)
    expect(kontakSah('0812-3456-7890x')).toBe(false)
    expect(kontakSah('nomor saya 08123456789')).toBe(false)
    expect(kontakSah('!!!')).toBe(false)
    expect(kontakSah('0812+3456')).toBe(false)
  })

  it('rejects a bare + or a run of separators', () => {
    expect(kontakSah('+')).toBe(false)
    expect(kontakSah('   ')).toBe(false)
    expect(kontakSah('-------')).toBe(false)
    expect(kontakSah('')).toBe(false)
  })

  it('rejects too few and too many digits', () => {
    expect(kontakSah('0812345')).toBe(false)
    expect(kontakSah('0812345678901234567')).toBe(false)
  })

  it('tolerates surrounding whitespace', () => {
    expect(kontakSah('  0812-3456-7890  ')).toBe(true)
  })
})

describe('normalkanKontak — the digits behind the formatting', () => {
  it('strips every separator and keeps a leading +', () => {
    expect(normalkanKontak('0812-3456-7890')).toBe('081234567890')
    expect(normalkanKontak('+62 812 3456 7890')).toBe('+6281234567890')
    expect(normalkanKontak('(0341) 555-123')).toBe('0341555123')
  })

  it('returns null rather than a half-stripped string', () => {
    expect(normalkanKontak('0812-ABCD')).toBeNull()
    expect(normalkanKontak('')).toBeNull()
  })
})

describe('tanggalSah — a real calendar date', () => {
  it('accepts well-formed dates', () => {
    expect(tanggalSah('2026-10-09')).toBe(true)
    expect(tanggalSah('2026-02-28')).toBe(true)
    expect(tanggalSah('2024-02-29')).toBe(true)
  })

  it('rejects dates that match the shape but do not exist', () => {
    // These are what a shape-only regex lets through, and what the database then stores.
    expect(tanggalSah('2026-13-45')).toBe(false)
    expect(tanggalSah('2026-02-30')).toBe(false)
    expect(tanggalSah('2026-04-31')).toBe(false)
    expect(tanggalSah('2025-02-29')).toBe(false)
    expect(tanggalSah('2026-00-10')).toBe(false)
  })

  it('rejects anything that is not the expected shape', () => {
    expect(tanggalSah('09-10-2026')).toBe(false)
    expect(tanggalSah('2026-10-09T00:00:00Z')).toBe(false)
    expect(tanggalSah('')).toBe(false)
  })
})
