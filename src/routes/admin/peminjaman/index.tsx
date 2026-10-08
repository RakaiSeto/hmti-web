import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { formatTanggal } from '../../../lib/dates'
import { daftarPeminjamanAktif } from '../../../server/siklus'
import type { BarisPinjamanAktif } from '../../../server/siklus'
import { StatusBadge } from '../../../components/StatusBadge'
import { TabelData } from '../../../components/TabelData'
import {
  KotakCari,
  PageHeader,
  TombolAksi,
  TombolSekunder,
} from '../../../components/ui'
import type { ArahUrut } from '../../../lib/tabel'
import { PER_HALAMAN } from '../../../lib/tabel'
import { useDaftar } from '../../../lib/useDaftar'

interface ParamsPeminjaman {
  hanyaTerlambat: boolean
  q: string
  sort: string
  dir: ArahUrut
  halaman: number
  perHalaman: number
}

const AWAL_PEMINJAMAN: ParamsPeminjaman = {
  hanyaTerlambat: false,
  q: '',
  sort: '',
  dir: 'asc',
  halaman: 1,
  perHalaman: PER_HALAMAN,
}

export const Route = createFileRoute('/admin/peminjaman/')({
  loader: () => daftarPeminjamanAktif({ data: AWAL_PEMINJAMAN }),
  component: PeminjamanAktif,
})

/**
 * 08 · Peminjaman Aktif (FR11, INV-21).
 *
 * `Terlambat` is derived, so this filter is a date comparison against today in WIB — not
 * a status lookup. That is why an overdue loan cannot be missed by a stale flag.
 */
function PeminjamanAktif() {
  const awal = Route.useLoaderData()
  const navigate = useNavigate()
  const { params, hasil, sibuk, muat } = useDaftar(
    daftarPeminjamanAktif,
    awal,
    AWAL_PEMINJAMAN,
  )

  const columns: ColumnDef<BarisPinjamanAktif, unknown>[] = [
    {
      id: 'kode',
      accessorFn: (r) => r.kode,
      header: 'Kode',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold whitespace-nowrap">
          {row.original.kode}
        </span>
      ),
    },
    {
      id: 'organisasi',
      accessorFn: (r) => r.organisasi,
      header: 'Organisasi',
      cell: ({ row }) => (
        <>
          <span className="font-semibold text-neutral-intense">
            {row.original.organisasi}
          </span>
          <span className="block text-sm font-medium text-text-soft">
            {row.original.penanggungJawab} · {row.original.kontak}
          </span>
        </>
      ),
    },
    {
      id: 'kembali',
      accessorFn: (r) => r.tglKembali,
      header: 'Jatuh tempo',
      cell: ({ row }) => (
        <span
          className={`whitespace-nowrap text-sm ${row.original.terlambat ? 'font-semibold text-error' : ''}`}
        >
          {formatTanggal(row.original.tglKembali)}
        </span>
      ),
    },
    {
      id: 'barang',
      header: 'Barang',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {row.original.jumlahBaris} jenis · {row.original.totalUnit} unit
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      enableSorting: false,
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.terlambat ? 'Terlambat' : 'Dipinjam'}
        />
      ),
    },
    {
      id: 'aksi',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <TombolAksi
            onClick={() =>
              void navigate({
                to: '/admin/pengembalian/$kode',
                params: { kode: row.original.kode },
              })
            }
          >
            Kembalikan
          </TombolAksi>
          <TombolAksi
            onClick={() =>
              void navigate({
                to: '/admin/permintaan/$kode',
                params: { kode: row.original.kode },
              })
            }
          >
            Detail
          </TombolAksi>
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Peminjaman Aktif"
        subtitle="Barang yang sedang dipinjam dan belum dikembalikan."
      />

      <TabelData
        columns={columns}
        data={hasil.rows}
        total={hasil.total}
        totalSemua={hasil.totalSemua}
        perHalaman={hasil.perHalaman}
        halaman={hasil.halaman}
        sort={params.sort}
        dir={params.dir}
        sibuk={sibuk}
        onSort={(sort, dir) =>
          muat({ ...params, sort: sort ?? '', dir, halaman: 1 })
        }
        onHalaman={(h) => muat({ ...params, halaman: h })}
        onPerHalaman={(n) => muat({ ...params, perHalaman: n, halaman: 1 })}
        kosong={{
          title: params.hanyaTerlambat
            ? 'Tidak ada peminjaman terlambat'
            : 'Tidak ada peminjaman aktif',
          body: params.hanyaTerlambat
            ? 'Semua peminjaman masih dalam tenggat. Bagus.'
            : 'Belum ada barang yang sedang dipinjam.',
        }}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Semua aktif', value: false },
              { label: 'Terlambat', value: true },
            ].map((t) => (
              <button
                key={String(t.value)}
                type="button"
                onClick={() =>
                  muat({ ...params, hanyaTerlambat: t.value, halaman: 1 })
                }
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  params.hanyaTerlambat === t.value
                    ? 'border-accent bg-accent text-white'
                    : 'border-neutral-soft bg-surface text-text-soft hover:text-text'
                }`}
              >
                {t.label}
              </button>
            ))}
            <KotakCari
              nilai={params.q}
              onCari={(q) => muat({ ...params, q, halaman: 1 })}
              placeholder="Cari kode, organisasi, atau penanggung jawab…"
              className="min-w-56 flex-1"
            />
            {params.q || params.sort ? (
              <TombolSekunder
                onClick={() =>
                  muat({
                    ...AWAL_PEMINJAMAN,
                    hanyaTerlambat: params.hanyaTerlambat,
                  })
                }
              >
                Reset
              </TombolSekunder>
            ) : null}
          </div>
        }
      />

      <p className="text-xs text-text-soft">
        Dihitung per {formatTanggal(hasil.hariIni)} (WIB).
      </p>
    </div>
  )
}
