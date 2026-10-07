import { describe, expect, it } from 'vitest'

import {
  bolehTransisi,
  isTerlambat,
  labelStatus,
  perluDibatalkan,
  transisiTersedia,
} from './status'
import type { StatusPengajuan } from './status'

describe('bolehTransisi — the status machine', () => {
  it('lets only an admin approve or reject', () => {
    expect(bolehTransisi('Diajukan', 'Disetujui', 'admin').ok).toBe(true)
    expect(bolehTransisi('Diajukan', 'Ditolak', 'admin').ok).toBe(true)

    // FR12: "PJ inventaris tidak bisa".
    expect(bolehTransisi('Diajukan', 'Disetujui', 'pj_inventaris').ok).toBe(
      false,
    )
    expect(bolehTransisi('Diajukan', 'Ditolak', 'pj_inventaris').ok).toBe(false)
  })

  it('lets either staff role record handover and return', () => {
    for (const pelaku of ['admin', 'pj_inventaris'] as const) {
      expect(bolehTransisi('Disetujui', 'Dipinjam', pelaku).ok).toBe(true)
      expect(bolehTransisi('Dipinjam', 'Selesai', pelaku).ok).toBe(true)
    }
  })

  it('refuses illegal transitions outright', () => {
    // Nothing jumps straight from submitted to borrowed, or back from finished.
    expect(bolehTransisi('Diajukan', 'Dipinjam', 'admin').ok).toBe(false)
    expect(bolehTransisi('Diajukan', 'Selesai', 'admin').ok).toBe(false)
    expect(bolehTransisi('Selesai', 'Dipinjam', 'admin').ok).toBe(false)
    expect(bolehTransisi('Ditolak', 'Disetujui', 'admin').ok).toBe(false)
    expect(bolehTransisi('Dipinjam', 'Dibatalkan', 'admin').ok).toBe(false)
  })

  it('rejects approving an already-decided request', () => {
    expect(bolehTransisi('Disetujui', 'Disetujui', 'admin').ok).toBe(false)
  })

  it('lets the system cancel at H-1 but not approve', () => {
    expect(bolehTransisi('Diajukan', 'Dibatalkan', 'sistem').ok).toBe(true)
    expect(bolehTransisi('Disetujui', 'Dibatalkan', 'sistem').ok).toBe(true)
    expect(bolehTransisi('Diajukan', 'Disetujui', 'sistem').ok).toBe(false)
  })

  it('lets an admin re-approve a cancelled request (overview §8)', () => {
    expect(bolehTransisi('Dibatalkan', 'Disetujui', 'admin').ok).toBe(true)
    expect(bolehTransisi('Dibatalkan', 'Disetujui', 'pj_inventaris').ok).toBe(
      false,
    )
  })

  it('marks rejection as needing a reason', () => {
    const t = transisiTersedia('Diajukan', 'admin')
    expect(t).toContain('Ditolak')
    expect(t).toContain('Disetujui')
    // A PJ sees no decision buttons on a pending request at all.
    expect(transisiTersedia('Diajukan', 'pj_inventaris')).not.toContain(
      'Ditolak',
    )
    expect(transisiTersedia('Diajukan', 'pj_inventaris')).not.toContain(
      'Disetujui',
    )
  })

  it('gives every status a readable refusal reason', () => {
    const r = bolehTransisi('Diajukan', 'Ditolak', 'pj_inventaris')
    expect(r.ok).toBe(false)
    expect(r.alasan).toMatch(/tidak berwenang/)
  })
})

describe('perluDibatalkan — BR07', () => {
  const hariIni = '2026-10-05'

  it('cancels a request still awaiting its letter the day before checkout', () => {
    expect(perluDibatalkan('Diajukan', '2026-10-06', false, hariIni)).toBe(true)
    expect(perluDibatalkan('Disetujui', '2026-10-06', false, hariIni)).toBe(
      true,
    )
  })

  it('spares a request whose letter has been received', () => {
    // BR02 keys on receipt, so `diterima` is enough — verification is not required.
    expect(perluDibatalkan('Disetujui', '2026-10-06', true, hariIni)).toBe(
      false,
    )
  })

  it('spares a request that is not due tomorrow', () => {
    expect(perluDibatalkan('Disetujui', '2026-10-07', false, hariIni)).toBe(
      false,
    )
    expect(perluDibatalkan('Disetujui', '2026-10-05', false, hariIni)).toBe(
      false,
    )
  })

  it('ignores requests that are already past the letter stage', () => {
    for (const s of [
      'Dipinjam',
      'Selesai',
      'Ditolak',
      'Dibatalkan',
    ] as StatusPengajuan[]) {
      expect(perluDibatalkan(s, '2026-10-06', false, hariIni)).toBe(false)
    }
  })
})

describe('isTerlambat / labelStatus — the derived overdue state', () => {
  it('is only ever true for an active loan past its return date', () => {
    expect(isTerlambat('Dipinjam', '2026-10-01', '2026-10-05')).toBe(true)
    expect(isTerlambat('Dipinjam', '2026-10-05', '2026-10-05')).toBe(false)
    expect(isTerlambat('Dipinjam', '2026-10-09', '2026-10-05')).toBe(false)
    // A finished loan is never late, however old.
    expect(isTerlambat('Selesai', '2020-01-01', '2026-10-05')).toBe(false)
  })

  it('replaces the badge label without touching the stored status', () => {
    expect(labelStatus('Dipinjam', '2026-10-01', '2026-10-05')).toBe(
      'Terlambat',
    )
    expect(labelStatus('Dipinjam', '2026-10-09', '2026-10-05')).toBe('Dipinjam')
  })
})
