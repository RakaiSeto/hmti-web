/**
 * The request status machine.
 *
 * One definition, consumed by every transition site, so an illegal transition is
 * refused in one place rather than four. The shape is overview §5:
 *
 *   Diajukan ──▶ Disetujui ──▶ Dipinjam ──▶ Selesai
 *       │             │
 *       │             └─▶ Ditolak        (alasan required, BR06)
 *       └─▶ Dibatalkan                    (BR07, and admin)
 *
 * `Terlambat` is deliberately absent: it is a *derived* read-time state, not a status
 * write, so an overdue loan can never be left stale in the table.
 */
import { STATUS_PENGAJUAN } from '#/db/schema'
import type { StatusPengajuan } from '#/db/schema'
import { todayWib } from '#/lib/dates'

export { STATUS_PENGAJUAN, type StatusPengajuan }

/** Who may perform a transition. `sistem` is the cron. */
export type Pelaku = 'admin' | 'pj_inventaris' | 'sistem'

interface Transisi {
  dari: StatusPengajuan
  ke: StatusPengajuan
  boleh: readonly Pelaku[]
  /** BR06: rejecting must carry a reason. */
  butuhAlasan?: boolean
  /** BR07: the H-1 auto-cancel. */
  keterangan: string
}

export const TRANSISI: readonly Transisi[] = [
  {
    dari: 'Diajukan',
    ke: 'Disetujui',
    boleh: ['admin'],
    keterangan: 'FR12 — hanya admin yang menyetujui',
  },
  {
    dari: 'Diajukan',
    ke: 'Ditolak',
    boleh: ['admin'],
    butuhAlasan: true,
    keterangan: 'BR06 — penolakan wajib menyertakan alasan',
  },
  {
    dari: 'Diajukan',
    ke: 'Dibatalkan',
    boleh: ['admin', 'sistem'],
    keterangan: 'BR07 — surat belum diterima di H-1',
  },
  {
    dari: 'Disetujui',
    ke: 'Dibatalkan',
    boleh: ['admin', 'sistem'],
    keterangan: 'BR07 — surat belum diterima di H-1',
  },
  {
    dari: 'Disetujui',
    ke: 'Dipinjam',
    boleh: ['admin', 'pj_inventaris'],
    keterangan: 'FR15 — serah terima',
  },
  {
    dari: 'Dipinjam',
    ke: 'Selesai',
    boleh: ['admin', 'pj_inventaris'],
    keterangan: 'FR16 — pengembalian',
  },
  {
    // overview §8: the admin keeps a re-approve action on a cancelled request.
    dari: 'Dibatalkan',
    ke: 'Disetujui',
    boleh: ['admin'],
    keterangan: 'Pemulihan pengajuan yang dibatalkan otomatis',
  },
]

export interface HasilTransisi {
  ok: boolean
  alasan?: string
}

/** May `pelaku` move `dari` → `ke`? Returns why not, for a readable error. */
export function bolehTransisi(
  dari: StatusPengajuan,
  ke: StatusPengajuan,
  pelaku: Pelaku,
): HasilTransisi {
  const t = TRANSISI.find((x) => x.dari === dari && x.ke === ke)
  if (!t) {
    return { ok: false, alasan: `Perpindahan ${dari} → ${ke} tidak sah.` }
  }
  if (!t.boleh.includes(pelaku)) {
    return {
      ok: false,
      alasan: `Peran ${pelaku} tidak berwenang: ${t.keterangan}.`,
    }
  }
  return { ok: true }
}

/** Every status reachable from `dari` by `pelaku` — drives which buttons render. */
export function transisiTersedia(
  dari: StatusPengajuan,
  pelaku: Pelaku,
): StatusPengajuan[] {
  return TRANSISI.filter(
    (t) => t.dari === dari && t.boleh.includes(pelaku),
  ).map((t) => t.ke)
}

/**
 * BR07's predicate, isolated so the cron is a thin wrapper: a request is stale when it
 * is still awaiting the letter (`Diajukan` or `Disetujui`) and its checkout day is
 * tomorrow. BR02 keys on letter *receipt*, so `diterima` clears it; verification does
 * not matter here.
 */
export function perluDibatalkan(
  status: StatusPengajuan,
  tglPinjam: string,
  suratDiterima: boolean,
  hariIni: string,
): boolean {
  if (status !== 'Diajukan' && status !== 'Disetujui') return false
  if (suratDiterima) return false
  // Checkout is tomorrow, i.e. today is H-1.
  const besok = new Date(`${hariIni}T00:00:00Z`)
  besok.setUTCDate(besok.getUTCDate() + 1)
  return tglPinjam === besok.toISOString().slice(0, 10)
}

/** `Dipinjam` past its return date. Derived, never stored. */
export function isTerlambat(
  status: StatusPengajuan,
  tglKembali: string,
  hariIni: string = todayWib(),
): boolean {
  return status === 'Dipinjam' && hariIni > tglKembali
}

/** The badge shown for a request: its status, or `Terlambat` when overdue. */
export function labelStatus(
  status: StatusPengajuan,
  tglKembali: string,
  hariIni: string = todayWib(),
): StatusPengajuan | 'Terlambat' {
  return isTerlambat(status, tglKembali, hariIni) ? 'Terlambat' : status
}

/** Indonesian labels. `Terlambat` is included because it renders as a badge. */
export const LABEL_STATUS: Record<StatusPengajuan | 'Terlambat', string> = {
  Diajukan: 'Diajukan',
  Disetujui: 'Disetujui',
  Ditolak: 'Ditolak',
  Dipinjam: 'Dipinjam',
  Selesai: 'Selesai',
  Dibatalkan: 'Dibatalkan',
  Terlambat: 'Terlambat',
}
