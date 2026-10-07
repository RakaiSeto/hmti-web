/**
 * BR07 — the H-1 letter deadline and auto-cancel.
 *
 * The scheduled handler is a thin wrapper over `batalkanPengajuanBasi`, which is exported
 * and unit-tested. Keeping the logic out of the handler is what makes the rule testable
 * at all: a `scheduled` callback cannot be invoked in a unit test, but this can.
 */
import { env } from 'cloudflare:workers'

import { logAksi } from '#/domain/log'
import { perluDibatalkan } from '#/domain/status'
import type { StatusPengajuan } from '#/domain/status'
import { todayWib } from '#/lib/dates'

export interface KandidatBasi {
  id: string
  kode: string
  status: StatusPengajuan
  tglPinjam: string
  suratDiterima: boolean
}

export interface HasilSapu {
  hariIni: string
  diperiksa: number
  dibatalkan: string[]
}

/**
 * Cancel every request that is still awaiting its letter the day before checkout.
 *
 * BR02 uses letter *receipt* language, so `diterima` clears the rule and verification is
 * not required — a letter that arrived but has not been verified still counts as arrived.
 */
export async function batalkanPengajuanBasi(
  hariIni: string = todayWib(),
  db: D1Database = env.DB,
): Promise<HasilSapu> {
  const { results } = await db
    .prepare(
      `SELECT p.id, p.kode, p.status, p.tgl_pinjam,
              EXISTS (SELECT 1 FROM surat s WHERE s.pengajuan_id = p.id) AS ada_surat
       FROM pengajuan p
       WHERE p.status IN ('Diajukan', 'Disetujui')`,
    )
    .all<{
      id: string
      kode: string
      status: StatusPengajuan
      tgl_pinjam: string
      ada_surat: number
    }>()

  const kandidat = results
  const dibatalkan: string[] = []

  for (const r of kandidat) {
    const basi = perluDibatalkan(
      r.status,
      r.tgl_pinjam,
      r.ada_surat === 1,
      hariIni,
    )
    if (!basi) continue

    const res = await db
      .prepare(
        `UPDATE pengajuan SET status = 'Dibatalkan', updated_at = ?
         WHERE id = ? AND status IN ('Diajukan', 'Disetujui')`,
      )
      .bind(Math.floor(Date.now() / 1000), r.id)
      .run()

    // The WHERE re-asserts the precondition: if an admin approved it in the meantime,
    // zero rows change and nothing is wrongly cancelled.
    if (res.meta.changes === 1) {
      dibatalkan.push(r.kode)
      await logAksi({
        penggunaId: null,
        penggunaNama: 'Sistem',
        aksi: 'membatalkan',
        entitas: 'pengajuan',
        entitasId: r.id,
      })
    }
  }

  return { hariIni, diperiksa: kandidat.length, dibatalkan }
}
