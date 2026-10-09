import { Link, createFileRoute } from '@tanstack/react-router'

import { labelAksi, labelBulan } from '../../domain/labels'
import { formatWaktu } from '../../lib/dates'
import { ringkasanDasbor } from '../../server/admin'
import type { Tindakan } from '../../server/admin'
import { Card, PageHeader, StatTile } from '../../components/ui'

export const Route = createFileRoute('/admin/dasbor')({
  loader: () => ringkasanDasbor(),
  component: Dasbor,
})

/**
 * 05 · Dasbor Admin (FR17).
 *
 * Every count links into the filtered list it came from, and derives from the same
 * helpers those lists use — so a tile can never disagree with the page it points at.
 */
function Dasbor() {
  const d = Route.useLoaderData()
  const maks = Math.max(1, ...d.perBulan.map((b) => b.c))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dasbor" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Pengajuan baru"
          value={d.baru}
          tone={d.baru > 0 ? 'peringatan' : 'netral'}
        />
        <StatTile label="Sedang dipinjam" value={d.aktif} />
        <StatTile
          label="Terlambat"
          value={d.terlambat}
          tone={d.terlambat > 0 ? 'bahaya' : 'netral'}
        />
        <StatTile
          label="Unit dipinjam"
          value={`${d.unitDipinjam} / ${d.totalBarang}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-md font-semibold text-neutral-intense">
              Peminjaman per Bulan
            </h2>
            <p className="text-xs text-text-soft">
              6 bulan terakhir · Semua kategori
            </p>
          </div>
          <div className="flex h-40 items-end gap-3">
            {d.perBulan.map((b) => (
              <div
                key={b.bulan}
                tabIndex={0}
                aria-label={`${labelBulan(b.bulan)} ${b.bulan.slice(0, 4)}: ${b.c} pengajuan`}
                className="group relative flex h-full flex-1 cursor-default flex-col items-center justify-end gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="text-xs font-semibold text-text-soft">
                  {b.c}
                </span>
                <div
                  className="w-full rounded-t-md bg-accent transition-colors group-hover:bg-accent-firm group-focus-visible:bg-accent-firm"
                  style={{ height: `${Math.round((b.c / maks) * 110)}px` }}
                />

                {/* Who the bar is made of. Same population as the count above it, so the
                    names always add up to the number. The column's `aria-label` carries the
                    total for a screen reader; this panel is the detail behind it. */}
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-56 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-left shadow-modal group-hover:block group-focus-visible:block">
                  <p className="text-xs font-semibold text-neutral-hint">
                    {labelBulan(b.bulan)} {b.bulan.slice(0, 4)}
                  </p>
                  {b.peminjam.length === 0 ? (
                    <p className="mt-1 text-xs text-neutral-hint/70">
                      Belum ada pengajuan.
                    </p>
                  ) : (
                    <ul className="mt-1 flex flex-col gap-1">
                      {b.peminjam.slice(0, 5).map((p) => (
                        <li
                          key={p.organisasi}
                          className="flex items-baseline justify-between gap-3 text-xs text-neutral-hint/90"
                        >
                          <span className="truncate">{p.organisasi}</span>
                          <span className="shrink-0 font-semibold">×{p.c}</span>
                        </li>
                      ))}
                      {b.peminjam.length > 5 ? (
                        <li className="text-xs text-neutral-hint/70">
                          +{b.peminjam.length - 5} organisasi lain
                        </li>
                      ) : null}
                    </ul>
                  )}
                </div>

                <span className="text-xs text-text-soft">
                  {labelBulan(b.bulan)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-md font-semibold text-neutral-intense">
            Aktivitas Terkini
          </h2>
          {d.aktivitas.length === 0 ? (
            <p className="text-sm text-text-soft">Belum ada aktivitas.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {d.aktivitas.map((a, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-8 text-sm"
                >
                  <span className="text-text">
                    <span className="font-semibold">{a.oleh}</span>{' '}
                    {labelAksi(a.aksi).toLowerCase()}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-text-soft">
                    {formatWaktu(a.waktu)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-md font-semibold text-neutral-intense">
            Perlu tindakan
          </h2>
          {d.perluTindakan.length > 0 ? (
            <span className="rounded-full bg-warning-container px-2 py-0.5 text-xs font-semibold text-warning">
              {d.perluTindakan.length}
            </span>
          ) : null}
        </div>

        {d.perluTindakan.length === 0 ? (
          <p className="flex items-center gap-3 py-2 text-sm text-text-soft">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success-container font-bold text-success-text">
              ✓
            </span>
            Tidak ada yang menunggu. Semua pengajuan sudah ditinjau, tidak ada
            pinjaman lewat tenggat, dan tidak ada surat yang belum diverifikasi.
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-0.5">
              {d.perluTindakan.slice(0, 6).map((t) => (
                <li key={`${t.jenis}-${t.kode}`}>
                  <Link
                    to={
                      t.jenis === 'terlambat'
                        ? '/admin/pengembalian/$kode'
                        : '/admin/permintaan/$kode'
                    }
                    params={{ kode: t.kode }}
                    className="flex items-center gap-3 rounded-md px-2.5 py-2 no-underline hover:bg-neutral-subtle"
                  >
                    <span
                      className={`w-23 shrink-0 rounded-md py-0.5 text-center text-xs font-semibold ${GAYA_TINDAKAN[t.jenis]}`}
                    >
                      {LABEL_TINDAKAN[t.jenis]}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-semibold text-neutral-intense">
                        {t.organisasi}
                      </span>
                      <span className="text-xs text-text-soft">
                        {rincian(t)}
                      </span>
                    </span>
                    {/* The row navigates, it does not act: the verb lives on the page it opens.
                        Hidden on the narrowest screens, where the row is already the target and
                        the hint only squeezes the organisation name. */}
                    <span className="hidden shrink-0 text-xs font-semibold text-text-soft sm:inline">
                      Lihat Detail →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {d.perluTindakan.length > 6 ? (
              <p className="border-t border-line-soft px-2.5 pt-3 text-xs text-text-soft">
                +{d.perluTindakan.length - 6} lainnya · lihat semua di{' '}
                <Link
                  to="/admin/permintaan"
                  className="font-semibold text-accent no-underline hover:text-accent-firm"
                >
                  Permintaan
                </Link>
              </p>
            ) : null}
          </>
        )}
      </Card>
    </div>
  )
}

/** The card's three kinds, and the words and colours each one carries. */
const LABEL_TINDAKAN: Record<Tindakan['jenis'], string> = {
  terlambat: 'Terlambat',
  menunggu: 'Menunggu',
  surat: 'Surat',
}

const GAYA_TINDAKAN: Record<Tindakan['jenis'], string> = {
  terlambat: 'bg-error-container text-error',
  menunggu: 'bg-warning-container text-warning',
  surat: 'bg-accent-container text-accent',
}

/** Why the row is here, and for how long. `hari` is never 0 — the query sets the floor. */
function rincian(t: Tindakan): string {
  if (t.jenis === 'terlambat') {
    return `${t.penanggungJawab ?? '—'} · ${t.hari} hari lewat tenggat`
  }
  if (t.jenis === 'menunggu') {
    return `${t.penanggungJawab ?? '—'} · diajukan ${t.hari} hari lalu`
  }
  return `Surat diterima ${t.hari} hari lalu, belum diverifikasi`
}
