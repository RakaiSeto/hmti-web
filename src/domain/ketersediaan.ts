/**
 * Availability *policy* — the part with no database in it.
 *
 * Split from `availability.ts` deliberately. That module reads D1 through
 * `cloudflare:workers`, and a Worker-only import cannot reach the browser bundle. Client
 * components (the request form, the catalog) need `statusDari` and the badge thresholds,
 * so those live here where they are safe to import from anywhere.
 *
 * The overlap rule itself is documented in `availability.ts`, next to the queries that
 * implement it. This file holds the pieces that are pure functions of their arguments.
 */
import { tambahHari } from '#/lib/dates'

/** Statuses that hold stock. One list, cited by the queries and the tests. */
export const STATUS_MENAHAN = ['Disetujui', 'Dipinjam'] as const

export interface Ketersediaan {
  barangId: string
  jumlahTotal: number
  /** Units already committed over the window. */
  terpakai: number
  /** `jumlahTotal - terpakai`, floored at 0. */
  tersedia: number
}

export interface HariKetersediaan {
  tanggal: string
  tersedia: number
  jumlahTotal: number
  /** The badge the catalog and calendar show. */
  status: StatusKetersediaan
}

export type StatusKetersediaan = 'Tersedia' | 'Terbatas' | 'Habis'

/** The availability badge (FR01). The three states the design defines. */
export function statusDari(
  tersedia: number,
  jumlahTotal: number,
): StatusKetersediaan {
  if (tersedia <= 0) return 'Habis'
  if (jumlahTotal > 0 && tersedia < jumlahTotal) return 'Terbatas'
  return 'Tersedia'
}

/**
 * The window to check when a borrower has only picked a checkout day.
 *
 * A request's checkout day is inclusive and its return day exclusive (D9), so the
 * shortest request is one day: `[pinjam, pinjam + 1)`. The form shows availability as
 * soon as a checkout date is chosen, so until a return date is picked — or whenever the
 * one on screen is not after the checkout day — it checks that single day instead of
 * leaving the picker blank.
 *
 * Both inputs are `YYYY-MM-DD`; `tglKembali` may be empty, which is the "not chosen yet"
 * case. The result is always a valid non-empty range.
 */
export function jendelaKetersediaan(
  tglPinjam: string,
  tglKembali: string,
): { mulai: string; selesai: string } {
  const selesai =
    tglKembali && tglKembali > tglPinjam ? tglKembali : tambahHari(tglPinjam, 1)
  return { mulai: tglPinjam, selesai }
}

export interface BarisPermintaan {
  barangId: string
  jumlah: number
}

export interface Kekurangan {
  barangId: string
  namaBarang: string
  diminta: number
  tersedia: number
}

/**
 * The `NOT EXISTS` guard that makes a request insert conditional on availability.
 *
 * D1 has no interactive transactions (decisions.md §1a), so "read the free qty, decide,
 * then insert" is not expressible. The decision has to travel *inside* the statement that
 * writes. This builds one clause per distinct item:
 *
 *     NOT EXISTS (
 *       SELECT 1 FROM pengajuan_barang pb
 *       JOIN pengajuan p ON p.id = pb.pengajuan_id
 *       WHERE pb.barang_id = ?
 *         AND p.status IN (...)
 *         AND p.tgl_pinjam < ?     -- selesai
 *         AND ? < p.tgl_kembali    -- mulai
 *       GROUP BY pb.barang_id
 *       HAVING SUM(pb.jumlah) + ? > (SELECT jumlah FROM barang WHERE id = ?)
 *     )
 *
 * `true` means "no item is oversubscribed", so the insert proceeds. A concurrent request
 * cannot slip past: D1 serialises writes, and the line inserts share the same batch, so
 * the second request's guard sees the first request's lines.
 *
 * The two date comparisons are STRICT — that is the D9 rule (return day is free). A `<=`
 * here would silently switch to the other policy.
 */
export function guardKetersediaan(
  baris: readonly BarisPermintaan[],
  mulai: string,
  selesai: string,
): { sql: string; params: unknown[] } {
  const diminta = new Map<string, number>()
  for (const b of baris) {
    diminta.set(b.barangId, (diminta.get(b.barangId) ?? 0) + b.jumlah)
  }

  const tempat = STATUS_MENAHAN.map(() => '?').join(', ')
  const clauses: string[] = []
  const params: unknown[] = []

  for (const [barangId, jumlah] of diminta) {
    clauses.push(
      `NOT EXISTS (
         SELECT 1 FROM pengajuan_barang pb
         JOIN pengajuan p ON p.id = pb.pengajuan_id
         WHERE pb.barang_id = ?
           AND p.status IN (${tempat})
           AND p.tgl_pinjam < ?
           AND ? < p.tgl_kembali
         GROUP BY pb.barang_id
         HAVING SUM(pb.jumlah) + ? > (SELECT jumlah FROM barang WHERE id = ?)
       )`,
    )
    params.push(barangId, ...STATUS_MENAHAN, selesai, mulai, jumlah, barangId)
  }
  return { sql: clauses.join(' AND '), params }
}
