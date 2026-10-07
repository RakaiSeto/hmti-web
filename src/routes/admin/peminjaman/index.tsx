import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'

import { formatTanggal } from '../../../lib/dates'
import { daftarPeminjamanAktif } from '../../../server/siklus'
import { StatusBadge } from '../../../components/StatusBadge'
import {
  BarisTabel,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  Sel,
} from '../../../components/ui'

export const Route = createFileRoute('/admin/peminjaman/')({
  validateSearch: (s: Record<string, unknown>): { terlambat?: boolean } => ({
    terlambat: s.terlambat === '1' || s.terlambat === true ? true : undefined,
  }),
  loaderDeps: ({ search }) => ({ hanyaTerlambat: search.terlambat ?? false }),
  loader: ({ deps }) => daftarPeminjamanAktif({ data: deps }),
  component: PeminjamanAktif,
})

/**
 * 08 · Peminjaman Aktif (FR11, INV-21).
 *
 * `Terlambat` is derived, so this filter is a date comparison against today in WIB — not
 * a status lookup. That is why an overdue loan cannot be missed by a stale flag.
 */
function PeminjamanAktif() {
  const { rows, hariIni } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Peminjaman Aktif"
        subtitle="Barang yang sedang dipinjam dan belum dikembalikan."
      />

      <Card className="flex gap-2">
        {[
          { label: 'Semua aktif', value: false },
          { label: 'Terlambat', value: true },
        ].map((t) => (
          <button
            key={String(t.value)}
            type="button"
            onClick={() =>
              void navigate({ search: () => ({ terlambat: t.value }) })
            }
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
              search.terlambat === t.value
                ? 'border-accent bg-accent text-white'
                : 'border-neutral-soft bg-surface text-text-soft hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title={
            search.terlambat
              ? 'Tidak ada peminjaman terlambat'
              : 'Tidak ada peminjaman aktif'
          }
          body={
            search.terlambat
              ? 'Semua peminjaman masih dalam tenggat. Bagus.'
              : 'Belum ada barang yang sedang dipinjam.'
          }
        />
      ) : (
        <DataTable
          head={['Kode', 'Organisasi', 'Jatuh tempo', 'Barang', 'Status', '']}
        >
          {rows.map((r) => (
            <BarisTabel key={r.kode}>
              <Sel className="font-mono text-xs font-semibold">{r.kode}</Sel>
              <Sel>
                <span className="font-semibold text-neutral-intense">
                  {r.organisasi}
                </span>
                <span className="block text-xs text-text-soft">
                  {r.penanggungJawab} · {r.kontak}
                </span>
              </Sel>
              <Sel
                className={`whitespace-nowrap text-xs ${r.terlambat ? 'font-semibold text-error' : ''}`}
              >
                {formatTanggal(r.tglKembali)}
              </Sel>
              <Sel className="text-xs">
                {r.jumlahBaris} jenis · {r.totalUnit} unit
              </Sel>
              <Sel>
                <StatusBadge status={r.terlambat ? 'Terlambat' : 'Dipinjam'} />
              </Sel>
              <Sel className="whitespace-nowrap">
                <Link
                  to="/admin/pengembalian/$kode"
                  params={{ kode: r.kode }}
                  className="text-sm font-semibold text-accent no-underline hover:underline"
                >
                  Kembalikan
                </Link>
                <span className="mx-2 text-text-disabled">·</span>
                <Link
                  to="/admin/permintaan/$kode"
                  params={{ kode: r.kode }}
                  className="text-sm font-semibold text-accent no-underline hover:underline"
                >
                  Detail
                </Link>
              </Sel>
            </BarisTabel>
          ))}
        </DataTable>
      )}

      <p className="text-xs text-text-soft">
        Dihitung per {formatTanggal(hariIni)} (WIB).
      </p>
    </div>
  )
}
