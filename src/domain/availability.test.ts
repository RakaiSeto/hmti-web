import { describe, expect, it } from 'vitest'

import { guardKetersediaan, statusDari } from './ketersediaan'

/**
 * These tests pin the D9 boundary rule and the shape of the generated guard SQL. They do
 * not need a database: the rule lives in two operators, and the guard is a string.
 *
 * The end-to-end proof that the rule survives a real D1 round trip is the integration
 * test in `availability.db.test.ts`, which runs against a live local database.
 */

describe('statusDari — the availability badge', () => {
  it('is Habis at zero', () => {
    expect(statusDari(0, 5)).toBe('Habis')
  })

  it('is Terbatas when some but not all units are free', () => {
    expect(statusDari(1, 5)).toBe('Terbatas')
    expect(statusDari(4, 5)).toBe('Terbatas')
  })

  it('is Tersedia when nothing is committed', () => {
    expect(statusDari(5, 5)).toBe('Tersedia')
  })

  it('treats a zero-stock item as Habis, not Tersedia', () => {
    expect(statusDari(0, 0)).toBe('Habis')
  })
})

describe('guardKetersediaan — the conditional-insert guard', () => {
  const mulai = '2026-10-01'
  const selesai = '2026-10-10'

  it('emits one NOT EXISTS clause per distinct item', () => {
    const { sql } = guardKetersediaan(
      [
        { barangId: 'A', jumlah: 1 },
        { barangId: 'B', jumlah: 2 },
      ],
      mulai,
      selesai,
    )
    expect(sql.match(/NOT EXISTS/g)).toHaveLength(2)
  })

  it('collapses repeated items into one clause carrying the summed demand', () => {
    // Two 2-unit lines against 3 units must be judged as a 4-unit demand, not as two
    // separately-satisfiable 2-unit ones.
    const { sql, params } = guardKetersediaan(
      [
        { barangId: 'A', jumlah: 2 },
        { barangId: 'A', jumlah: 2 },
      ],
      mulai,
      selesai,
    )
    expect(sql.match(/NOT EXISTS/g)).toHaveLength(1)
    // The summed demand is the parameter immediately before the trailing barang id.
    expect(params).toContain(4)
    expect(params).not.toContain(2)
  })

  it('uses strict comparisons on both date bounds — the D9 rule', () => {
    const { sql } = guardKetersediaan(
      [{ barangId: 'A', jumlah: 1 }],
      mulai,
      selesai,
    )
    // `tgl_pinjam < selesai` and `mulai < tgl_kembali`: both strict, so the return day
    // is free to the next borrower. A `<=` here would silently block it.
    expect(sql).toContain('p.tgl_pinjam < ?')
    expect(sql).toContain('? < p.tgl_kembali')
    expect(sql).not.toContain('p.tgl_pinjam <= ?')
    expect(sql).not.toContain('? <= p.tgl_kembali')
  })

  it('counts only the statuses that hold stock', () => {
    const { sql, params } = guardKetersediaan(
      [{ barangId: 'A', jumlah: 1 }],
      mulai,
      selesai,
    )
    expect(sql).toContain('p.status IN (?, ?)')
    expect(params).toContain('Disetujui')
    expect(params).toContain('Dipinjam')
    // A pending request must not reserve stock, and a finished one must not hold it.
    expect(params).not.toContain('Diajukan')
    expect(params).not.toContain('Selesai')
    expect(params).not.toContain('Ditolak')
    expect(params).not.toContain('Dibatalkan')
  })

  it('binds the window in (selesai, mulai) order to match the placeholders', () => {
    const { params } = guardKetersediaan(
      [{ barangId: 'A', jumlah: 3 }],
      mulai,
      selesai,
    )
    const selesaiAt = params.indexOf(selesai)
    const mulaiAt = params.indexOf(mulai)
    expect(selesaiAt).toBeGreaterThan(-1)
    expect(mulaiAt).toBeGreaterThan(selesaiAt)
  })

  it('produces no clause for an empty request', () => {
    expect(guardKetersediaan([], mulai, selesai).sql).toBe('')
  })
})
