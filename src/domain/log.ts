/**
 * The activity log (FR21).
 *
 * One call at every mutation site. The log is append-only: there is no update or delete
 * function in this module, and there should never be one. The requirement is that the
 * log cannot be changed from the UI, so the guarantee lives here rather than in a policy.
 *
 * Two deliberate choices:
 *   - `penggunaNama` is denormalised. Deleting an account must not erase the record of
 *     what it did; the FK nulls out and the name survives.
 *   - A failed log write must not fail the action it describes. The audit trail is not
 *     worth losing a saved request over, so failures are swallowed and reported to the
 *     server log instead.
 */
import { env } from 'cloudflare:workers'

import type { Aksi } from '#/domain/labels'
import { newId } from '#/lib/id'

// Re-exported so server-side callers have one import. Client code must import these
// from `labels.ts` — this module pulls in a Worker-only binding.
export * from '#/domain/labels'

export interface EntriLog {
  penggunaId: string | null
  penggunaNama: string | null
  aksi: Aksi
  entitas: string
  entitasId?: string | null
}

export async function logAksi(
  entri: EntriLog,
  db: D1Database = env.DB,
): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO log_aktivitas (id, pengguna_id, pengguna_nama, aksi, entitas, entitas_id, waktu)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        newId(),
        entri.penggunaId,
        entri.penggunaNama,
        entri.aksi,
        entri.entitas,
        entri.entitasId ?? null,
        Math.floor(Date.now() / 1000),
      )
      .run()
  } catch (err) {
    // Never let the audit trail break the thing it is auditing.
    console.error('[logAksi] gagal menulis log:', err)
  }
}

/**
 * Indonesian labels for the log's `aksi` column.
 *
 * Typed as possibly-undefined on purpose: the column is free text in the database, so a
 * row written by an older build (or by hand) may carry a key this table has never heard
 * of. `labelAksi` is the only sanctioned way to read it.
 */
export const LABEL_AKSI: Record<string, string | undefined> = {
  masuk: 'Masuk',
  keluar: 'Keluar',
  membuat: 'Membuat',
  mengubah: 'Mengubah',
  menghapus: 'Menghapus',
  menyetujui: 'Menyetujui',
  menolak: 'Menolak',
  membatalkan: 'Membatalkan',
  mencatat_serah_terima: 'Mencatat serah terima',
  mencatat_pengembalian: 'Mencatat pengembalian',
  mengunggah_surat: 'Mengunggah surat',
  memverifikasi_surat: 'Memverifikasi surat',
  mengatur_ulang_sandi: 'Mengatur ulang sandi',
}

export const LABEL_ENTITAS: Record<string, string | undefined> = {
  pengajuan: 'Pengajuan',
  barang: 'Barang',
  kategori: 'Kategori',
  pengguna: 'Pengguna',
  surat: 'Surat',
  sesi: 'Sesi',
}

/** The `aksi` label, falling back to the raw value rather than printing `undefined`. */
export function labelAksi(aksi: string): string {
  return LABEL_AKSI[aksi] ?? aksi
}

/** The `entitas` label, with the same fallback. */
export function labelEntitas(entitas: string): string {
  return LABEL_ENTITAS[entitas] ?? entitas
}
