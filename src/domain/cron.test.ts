import { describe, expect, it, vi } from 'vitest'

/**
 * BR07's sweep, exercised against a stub D1.
 *
 * The point of these tests is the *re-assertion*: the UPDATE carries
 * `AND status IN ('Diajukan','Disetujui')`, so an admin who approved a request between
 * the read and the write wins the race. That is the one behaviour a plain
 * `perluDibatalkan` unit test cannot prove, so it is asserted here.
 *
 * `logAksi` is mocked because it writes through `cloudflare:workers`; the log's own
 * behaviour is not what this file is testing.
 */
vi.mock('#/domain/log', () => ({
  logAksi: vi.fn(async () => {}),
}))

const { batalkanPengajuanBasi } = await import('./cron')

interface Baris {
  id: string
  kode: string
  status: string
  tgl_pinjam: string
  ada_surat: number
}

/** A D1 stub: one SELECT for candidates, then one UPDATE per candidate. */
function fakeDb(
  kandidat: Baris[],
  /** Which ids the UPDATE actually affects. Anything else is a lost race. */
  diubah: Set<string>,
) {
  const updates: Array<{ sql: string; params: unknown[] }> = []
  const db = {
    prepare(sql: string) {
      const stmt = {
        _sql: sql,
        _params: [] as unknown[],
        bind(...p: unknown[]) {
          stmt._params = p
          return stmt
        },
        async all() {
          return { results: kandidat, success: true, meta: {} }
        },
        async run() {
          updates.push({ sql: stmt._sql, params: stmt._params })
          const id = String(stmt._params[1])
          return {
            results: [],
            success: true,
            meta: { changes: diubah.has(id) ? 1 : 0 },
          }
        },
      }
      return stmt
    },
  } as unknown as D1Database
  return { db, updates }
}

const HARI_INI = '2026-10-05'
const BESOK = '2026-10-06'

describe('batalkanPengajuanBasi — the H-1 sweep', () => {
  it('cancels a request awaiting its letter the day before checkout', async () => {
    const { db, updates } = fakeDb(
      [
        {
          id: 'A',
          kode: 'PINJ-202610-AAAA',
          status: 'Disetujui',
          tgl_pinjam: BESOK,
          ada_surat: 0,
        },
      ],
      new Set(['A']),
    )

    const hasil = await batalkanPengajuanBasi(HARI_INI, db)

    expect(hasil.dibatalkan).toEqual(['PINJ-202610-AAAA'])
    expect(updates).toHaveLength(1)
    expect(updates[0].sql).toContain("status = 'Dibatalkan'")
  })

  it('spares a request whose letter has arrived', async () => {
    const { db, updates } = fakeDb(
      [
        {
          id: 'A',
          kode: 'PINJ-202610-AAAA',
          status: 'Disetujui',
          tgl_pinjam: BESOK,
          ada_surat: 1,
        },
      ],
      new Set(['A']),
    )

    const hasil = await batalkanPengajuanBasi(HARI_INI, db)

    expect(hasil.dibatalkan).toEqual([])
    expect(updates).toHaveLength(0)
  })

  it('leaves a request that is not due tomorrow alone', async () => {
    const { db } = fakeDb(
      [
        {
          id: 'A',
          kode: 'PINJ-202610-AAAA',
          status: 'Diajukan',
          tgl_pinjam: '2026-10-20',
          ada_surat: 0,
        },
      ],
      new Set(['A']),
    )

    expect((await batalkanPengajuanBasi(HARI_INI, db)).dibatalkan).toEqual([])
  })

  it('reports nothing cancelled when it loses the race to an admin', async () => {
    // The request was approved between the SELECT and the UPDATE, so the guarded UPDATE
    // changes zero rows. It must not be reported as cancelled.
    const { db, updates } = fakeDb(
      [
        {
          id: 'A',
          kode: 'PINJ-202610-AAAA',
          status: 'Diajukan',
          tgl_pinjam: BESOK,
          ada_surat: 0,
        },
      ],
      new Set(), // nothing actually changes
    )

    const hasil = await batalkanPengajuanBasi(HARI_INI, db)

    expect(hasil.dibatalkan).toEqual([])
    expect(hasil.diperiksa).toBe(1)
    // The guard is what makes this safe, so assert the guard is really in the statement.
    expect(updates[0].sql).toContain("status IN ('Diajukan', 'Disetujui')")
  })

  it('handles a sweep with nothing to do', async () => {
    const { db } = fakeDb([], new Set())
    const hasil = await batalkanPengajuanBasi(HARI_INI, db)
    expect(hasil).toMatchObject({
      hariIni: HARI_INI,
      diperiksa: 0,
      dibatalkan: [],
    })
  })
})
