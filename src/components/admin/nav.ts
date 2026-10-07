import type { Peran } from '#/db/schema'

/**
 * The admin sidebar, per decisions.md D16: built from the requirements, not copied from
 * the design. The design's nav carries a `Pengaturan` row with no page behind it and
 * omits `Profil Saya`; both are corrected here, and the design itself is left alone.
 *
 * `badge` is a live count rendered as the design's yellow pill (the `14` on Permintaan in
 * frame 06).
 */
export interface NavItem {
  label: string
  to: string
  badge?: number
}

export interface NavGroup {
  /** Uppercase section label; omitted for the first, ungrouped row. */
  judul?: string
  items: NavItem[]
}

export interface NavConfig {
  groups: NavGroup[]
}

export interface NavCounts {
  permintaanBaru: number
}

/** Admin: every destination (v2 `peran = admin`, Steering Committee). */
export function navAdmin(counts: NavCounts): NavConfig {
  return {
    groups: [
      { items: [{ label: 'Dasbor', to: '/admin/dasbor' }] },
      {
        judul: 'Inventaris',
        items: [
          { label: 'Barang', to: '/admin/barang' },
          { label: 'Kategori', to: '/admin/kategori' },
        ],
      },
      {
        judul: 'Peminjaman',
        items: [
          { label: 'Peminjaman Aktif', to: '/admin/peminjaman' },
          { label: 'Pengembalian', to: '/admin/pengembalian' },
          {
            label: 'Permintaan',
            to: '/admin/permintaan',
            badge: counts.permintaanBaru,
          },
        ],
      },
      { judul: 'Laporan', items: [{ label: 'Laporan', to: '/admin/laporan' }] },
      {
        judul: 'Sistem',
        items: [
          { label: 'Pengguna', to: '/admin/pengguna' },
          { label: 'Log Aktivitas', to: '/admin/log' },
          { label: 'Profil Saya', to: '/admin/profil' },
        ],
      },
    ],
  }
}

/**
 * PJ Inventaris: operational only (v2 `peran = pj_inventaris`, Organizing Committee).
 *
 * Cannot manage items or categories (FR09/FR10), cannot see the activity log (FR21), and
 * has no self-service profile — an admin resets a PJ's password (FR08). `Inventaris` is
 * kept as a read-only view because the role needs to look up stock, which is what the
 * design's `NAV_PJ` does too.
 */
export function navPj(counts: NavCounts): NavConfig {
  return {
    groups: [
      { items: [{ label: 'Dasbor', to: '/admin/dasbor' }] },
      {
        judul: 'Inventaris',
        items: [{ label: 'Inventaris', to: '/admin/barang' }],
      },
      {
        judul: 'Peminjaman',
        items: [
          { label: 'Peminjaman Aktif', to: '/admin/peminjaman' },
          { label: 'Pengembalian', to: '/admin/pengembalian' },
          {
            label: 'Permintaan',
            to: '/admin/permintaan',
            badge: counts.permintaanBaru,
          },
        ],
      },
      { judul: 'Laporan', items: [{ label: 'Laporan', to: '/admin/laporan' }] },
    ],
  }
}

export function navUntuk(peran: Peran, counts: NavCounts): NavConfig {
  return peran === 'admin' ? navAdmin(counts) : navPj(counts)
}

export const LABEL_PERAN: Record<Peran, string> = {
  admin: 'Admin',
  pj_inventaris: 'PJ Inventaris',
}

/**
 * Indexed by string, not `Peran`: `peran` is a free-text column, so a row could carry a
 * role this build has never heard of. The widening is the point, not an oversight.
 */
const LABEL_PERAN_BY_NAME: Record<string, string | undefined> = LABEL_PERAN

/** A role label, falling back to the stored value for an unrecognised role. */
export function labelPeran(peran: string): string {
  return LABEL_PERAN_BY_NAME[peran] ?? peran
}
