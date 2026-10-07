/**
 * Availability — the one engine the calendar, the request form, the admin views and the
 * conflict check all read (BR01, BR08). Availability is always DERIVED; there is no
 * cached column to go stale.
 *
 * ---------------------------------------------------------------------------
 * THE OVERLAP RULE (decisions.md D9)
 *
 * A request's checkout day is inclusive and its return day is exclusive: an item
 * returned on the 10th is free to borrow again on the 10th.
 *
 * Two ranges overlap when
 *
 *     a.tgl_pinjam < b.tgl_kembali  AND  b.tgl_pinjam < a.tgl_kembali
 *
 * Both comparisons are strict, which is exactly the "return day is free" rule. Change
 * these two operators and you have silently switched to the other policy. Everything
 * else in this file derives from them.
 * ---------------------------------------------------------------------------
 *
 * Only `Disetujui` and `Dipinjam` consume stock. `Diajukan` does not reserve anything
 * (an un-reviewed request must not block a real one), and `Ditolak` / `Selesai` /
 * `Dibatalkan` release it. Note the two letter states live on `surat`, not here, so
 * they never appear in this list.
 */
import { env } from 'cloudflare:workers'

import { STATUS_MENAHAN, statusDari } from '#/domain/ketersediaan'
import type {
  BarisPermintaan,
  HariKetersediaan,
  Kekurangan,
  Ketersediaan,
} from '#/domain/ketersediaan'
import { tambahHari } from '#/lib/dates'

// Re-exported so server-side callers can import everything from one module. Client code
// must import the pure pieces from `ketersediaan.ts` directly — this file pulls in a
// Worker-only binding, which cannot reach the browser bundle.
export * from '#/domain/ketersediaan'

const STATUS_PLACEHOLDERS = STATUS_MENAHAN.map(() => '?').join(', ')

/**
 * Free quantity for one item over `[mulai, selesai)`.
 *
 * `mulai` and `selesai` are `YYYY-MM-DD`. An empty range (selesai <= mulai) is treated
 * as no commitment, which is what a one-day request degenerates to — and is why the
 * form refuses `selesai <= mulai` before it gets here.
 */
export async function ketersediaanBarang(
  barangId: string,
  mulai: string,
  selesai: string,
  db: D1Database = env.DB,
): Promise<Ketersediaan> {
  const row = await db
    .prepare(
      `SELECT b.jumlah AS jumlah_total,
              COALESCE((
                SELECT SUM(pb.jumlah)
                FROM pengajuan_barang pb
                JOIN pengajuan p ON p.id = pb.pengajuan_id
                WHERE pb.barang_id = b.id
                  AND p.status IN (${STATUS_PLACEHOLDERS})
                  AND p.tgl_pinjam < ?
                  AND ? < p.tgl_kembali
              ), 0) AS terpakai
       FROM barang b
       WHERE b.id = ?`,
    )
    .bind(...STATUS_MENAHAN, selesai, mulai, barangId)
    .first<{ jumlah_total: number; terpakai: number }>()

  if (!row) {
    throw new Error(`Barang ${barangId} tidak ditemukan`)
  }
  const terpakai = row.terpakai
  return {
    barangId,
    jumlahTotal: row.jumlah_total,
    terpakai,
    tersedia: Math.max(0, row.jumlah_total - terpakai),
  }
}

/**
 * Free quantity for many items at once — one query, not N. Used by the catalog list and
 * the form's item picker, where a per-item round trip would be the whole page's cost.
 */
export async function ketersediaanBanyak(
  barangIds: readonly string[],
  mulai: string,
  selesai: string,
  db: D1Database = env.DB,
): Promise<Map<string, Ketersediaan>> {
  const out = new Map<string, Ketersediaan>()
  if (barangIds.length === 0) return out

  const holes = barangIds.map(() => '?').join(', ')
  const { results } = await db
    .prepare(
      `SELECT b.id AS barang_id,
              b.jumlah AS jumlah_total,
              COALESCE((
                SELECT SUM(pb.jumlah)
                FROM pengajuan_barang pb
                JOIN pengajuan p ON p.id = pb.pengajuan_id
                WHERE pb.barang_id = b.id
                  AND p.status IN (${STATUS_PLACEHOLDERS})
                  AND p.tgl_pinjam < ?
                  AND ? < p.tgl_kembali
              ), 0) AS terpakai
       FROM barang b
       WHERE b.id IN (${holes})`,
    )
    .bind(...STATUS_MENAHAN, selesai, mulai, ...barangIds)
    .all<{ barang_id: string; jumlah_total: number; terpakai: number }>()

  for (const r of results) {
    const terpakai = r.terpakai
    out.set(r.barang_id, {
      barangId: r.barang_id,
      jumlahTotal: r.jumlah_total,
      terpakai,
      tersedia: Math.max(0, r.jumlah_total - terpakai),
    })
  }
  return out
}

/**
 * Free quantity per day for one item across `[mulai, selesai]` inclusive (FR02).
 *
 * Each day is a one-day window `[d, d+1)`, so a day where a loan *starts* is consumed
 * and a day where one *ends* is free — the same D9 rule, evaluated per day.
 *
 * This runs one query per day, which is fine for a month view (≤31 round trips against
 * a local D1 replica). If a month ever feels slow, this is the thing to collapse into a
 * single recursive-CTE query; do not add a cache column instead.
 */
export async function kalenderBulan(
  barangId: string,
  hariHari: readonly string[],
  db: D1Database = env.DB,
): Promise<HariKetersediaan[]> {
  const out: HariKetersediaan[] = []
  for (const tanggal of hariHari) {
    const k = await ketersediaanBarang(
      barangId,
      tanggal,
      tambahHari(tanggal, 1),
      db,
    )
    out.push({
      tanggal,
      tersedia: k.tersedia,
      jumlahTotal: k.jumlahTotal,
      status: statusDari(k.tersedia, k.jumlahTotal),
    })
  }
  return out
}

/**
 * Check every line of a proposed request. Returns the shortfalls; an empty array means
 * the whole request is satisfiable (FR04/BR08 — no partial approval).
 */
export async function periksaKetersediaan(
  baris: readonly BarisPermintaan[],
  mulai: string,
  selesai: string,
  db: D1Database = env.DB,
): Promise<Kekurangan[]> {
  if (baris.length === 0) return []
  const ids = [...new Set(baris.map((b) => b.barangId))]
  const map = await ketersediaanBanyak(ids, mulai, selesai, db)

  // A request may list the same item twice; the demand has to be summed before it is
  // compared, or two 2-unit lines against 3 units would each look satisfiable.
  const diminta = new Map<string, number>()
  for (const b of baris) {
    diminta.set(b.barangId, (diminta.get(b.barangId) ?? 0) + b.jumlah)
  }

  const { results } = await db
    .prepare(
      `SELECT id, nama FROM barang WHERE id IN (${ids.map(() => '?').join(', ')})`,
    )
    .bind(...ids)
    .all<{ id: string; nama: string }>()
  const nama = new Map(results.map((r) => [r.id, r.nama]))

  const kurang: Kekurangan[] = []
  for (const [barangId, jumlah] of diminta) {
    const k = map.get(barangId)
    const tersedia = k?.tersedia ?? 0
    if (jumlah > tersedia) {
      kurang.push({
        barangId,
        namaBarang: nama.get(barangId) ?? barangId,
        diminta: jumlah,
        tersedia,
      })
    }
  }
  return kurang
}
