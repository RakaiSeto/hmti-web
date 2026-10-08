import type { StatusPengajuan } from '#/db/schema'
import { LABEL_STATUS } from '#/domain/status'

/**
 * The status badge — the design's `StatusBadge` component set, which carries exactly the
 * v2 seven: `diajukan disetujui ditolak dipinjam selesai terlambat dibatalkan`.
 *
 * Note this is *not* the design system's `.st-*` classes in `design-system/app.css`;
 * those are the retired pre-v2 vocabulary (`draft`, `partial`, `overdue`…). The app maps
 * the v2 states onto the design's semantic colour tokens instead.
 *
 * The two closed states sit on `neutral-subtle`, not `surface-container`: a badge is drawn
 * on a card, which is already `surface`, and those two fills are one value apart (#F0F0F0
 * on #EFF0F2) — the badge came out as bare text. `text-text-disabled` was likewise 1.5:1
 * on it, so both closed states use `text-text-soft`.
 */
type Status = StatusPengajuan | 'Terlambat'

const GAYA: Record<Status, string> = {
  Diajukan: 'bg-warning-container text-warning',
  Disetujui: 'bg-accent-container text-accent',
  Ditolak: 'bg-error-container text-error',
  Dipinjam: 'bg-success-container text-success-text',
  Selesai: 'bg-neutral-subtle text-text-soft',
  Terlambat: 'bg-error-container text-error',
  Dibatalkan: 'bg-neutral-subtle text-text-soft',
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-2 py-1 text-xs font-semibold ${GAYA[status]}`}
    >
      {LABEL_STATUS[status]}
    </span>
  )
}

/** The item availability badge (FR01). */
export function AvailabilityBadge({
  status,
}: {
  status: 'Tersedia' | 'Terbatas' | 'Habis'
}) {
  const gaya = {
    Tersedia: 'bg-success-container text-success-text',
    Terbatas: 'bg-warning-container text-warning',
    Habis: 'bg-error-container text-error',
  }[status]
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-2 py-1 text-xs font-semibold ${gaya}`}
    >
      {status}
    </span>
  )
}
