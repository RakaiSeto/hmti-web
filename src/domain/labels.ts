/**
 * Display labels for the activity log and the role list.
 *
 * Split from `log.ts` because that module writes to D1 through `cloudflare:workers`, and
 * a Worker-only import cannot reach the browser bundle. These are plain maps, safe to
 * import from a component.
 */

export type Aksi =
  | 'masuk'
  | 'keluar'
  | 'membuat'
  | 'mengubah'
  | 'menghapus'
  | 'menyetujui'
  | 'menolak'
  | 'membatalkan'
  | 'mencatat_serah_terima'
  | 'mencatat_pengembalian'
  | 'mengunggah_surat'
  | 'memverifikasi_surat'
  | 'mengatur_ulang_sandi'

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

/**
 * Short Indonesian month names, keyed by the `MM` half of a `YYYY-MM` month key.
 *
 * The dashboard chart's x-axis is a month key straight out of SQL, and `2026-10` is not
 * something to put under a bar. Same possibly-undefined typing as the maps above, for the
 * same reason: the value comes from the database.
 */
export const LABEL_BULAN: Record<string, string | undefined> = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Apr',
  '05': 'Mei',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Agu',
  '09': 'Sep',
  '10': 'Okt',
  '11': 'Nov',
  '12': 'Des',
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

/** The short month label for a `YYYY-MM` key, e.g. `2026-10` → `Okt`. */
export function labelBulan(bulan: string): string {
  return LABEL_BULAN[bulan.slice(5, 7)] ?? bulan
}
