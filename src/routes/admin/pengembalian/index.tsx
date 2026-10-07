import { Link, createFileRoute } from '@tanstack/react-router'

import { formatTanggal } from '../../../lib/dates'
import { daftarPeminjamanAktif } from '../../../server/siklus'
import { StatusBadge } from '../../../components/StatusBadge'
import {
  BarisTabel,
  DataTable,
  EmptyState,
  PageHeader,
  Sel,
} from '../../../components/ui'

export const Route = createFileRoute('/admin/pengembalian/')({
  loader: () => daftarPeminjamanAktif({ data: { hanyaTerlambat: false } }),
  component: DaftarPengembalian,
})

/**
 * The return queue (FR16).
 *
 * Same rows as Peminjaman Aktif — a request awaiting return *is* an active loan. The two
 * nav entries exist because they are different jobs: one is "what is out", this is "what
 * came back". Overdue first, since that is the one that needs chasing.
 */
function DaftarPengembalian() {
  const { rows } = Route.useLoaderData()
  const urut = [...rows].sort((a, b) =>
    a.terlambat === b.terlambat
      ? a.tglKembali.localeCompare(b.tglKembali)
      : a.terlambat
        ? -1
        : 1,
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pengembalian"
        subtitle="Catat barang yang dikembalikan oleh organisasi peminjam."
      />

      {urut.length === 0 ? (
        <EmptyState
          title="Tidak ada yang perlu dikembalikan"
          body="Tidak ada peminjaman aktif saat ini."
        />
      ) : (
        <DataTable head={['Kode', 'Organisasi', 'Jatuh tempo', 'Status', '']}>
          {urut.map((r) => (
            <BarisTabel key={r.kode}>
              <Sel className="font-mono text-xs font-semibold">{r.kode}</Sel>
              <Sel>
                <span className="font-semibold text-neutral-intense">
                  {r.organisasi}
                </span>
                <span className="block text-xs text-text-soft">
                  {r.penanggungJawab}
                </span>
              </Sel>
              <Sel
                className={`whitespace-nowrap text-xs ${r.terlambat ? 'font-semibold text-error' : ''}`}
              >
                {formatTanggal(r.tglKembali)}
              </Sel>
              <Sel>
                <StatusBadge status={r.terlambat ? 'Terlambat' : 'Dipinjam'} />
              </Sel>
              <Sel>
                <Link
                  to="/admin/pengembalian/$kode"
                  params={{ kode: r.kode }}
                  className="text-sm font-semibold text-accent no-underline hover:underline"
                >
                  Catat pengembalian
                </Link>
              </Sel>
            </BarisTabel>
          ))}
        </DataTable>
      )}
    </div>
  )
}
