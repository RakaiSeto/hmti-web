import { Link, createFileRoute } from '@tanstack/react-router'

import { labelAksi, labelBulan } from '../../domain/labels'
import { formatWaktu } from '../../lib/dates'
import { ringkasanDasbor } from '../../server/admin'
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
  const { sesi } = Route.useRouteContext()
  const maks = Math.max(1, ...d.perBulan.map((b) => b.c))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dasbor"
        subtitle={
          d.baru > 0
            ? `${d.baru} pengajuan baru menunggu ditinjau.`
            : 'Tidak ada pengajuan baru.'
        }
      />

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

      {d.terlambat > 0 ? (
        <div className="rounded-md bg-error-container px-4 py-3 text-sm font-semibold text-error">
          {d.terlambat} peminjaman melewati tanggal kembali.{' '}
          <Link to="/admin/peminjaman" className="underline">
            Lihat daftar
          </Link>
        </div>
      ) : null}

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
                className="flex flex-1 flex-col items-center gap-2"
              >
                <span className="text-xs font-semibold text-text-soft">
                  {b.c}
                </span>
                <div
                  className="w-full rounded-t-md bg-accent"
                  style={{ height: `${Math.round((b.c / maks) * 110)}px` }}
                />
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
            <ul className="flex flex-col gap-3">
              {d.aktivitas.map((a, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <span className="text-text">
                    <span className="font-semibold">{a.oleh}</span>{' '}
                    {labelAksi(a.aksi).toLowerCase()}
                  </span>
                  <span className="shrink-0 text-xs text-text-soft">
                    {formatWaktu(a.waktu)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="flex flex-wrap gap-3">
        <Link
          to="/admin/permintaan"
          className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink no-underline"
        >
          Tinjau pengajuan
        </Link>
        <Link
          to="/admin/peminjaman"
          className="rounded-md border border-neutral-soft px-4 py-2.5 text-sm font-semibold text-neutral-intense no-underline"
        >
          Peminjaman aktif
        </Link>
        {sesi.peran === 'admin' ? (
          <Link
            to="/admin/barang"
            className="rounded-md border border-neutral-soft px-4 py-2.5 text-sm font-semibold text-neutral-intense no-underline"
          >
            Kelola barang
          </Link>
        ) : null}
      </Card>
    </div>
  )
}
