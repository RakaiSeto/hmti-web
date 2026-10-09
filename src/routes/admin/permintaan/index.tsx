import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import type { STATUS_PENGAJUAN } from '../../../db/schema'
import { formatTanggal } from '../../../lib/dates'
import { daftarPengajuan } from '../../../server/pengajuan'
import type { BarisPengajuan } from '../../../server/pengajuan'
import { StatusBadge } from '../../../components/StatusBadge'
import { TabelData } from '../../../components/TabelData'
import {
  KotakCari,
  PageHeader,
  TombolAksi,
  TombolSekunder,
  inputCls,
} from '../../../components/ui'
import type { ArahUrut } from '../../../lib/tabel'
import { PER_HALAMAN } from '../../../lib/tabel'
import { useDaftar } from '../../../lib/useDaftar'

type FilterStatus = (typeof STATUS_PENGAJUAN)[number] | 'semua' | 'Terlambat'

interface ParamsPermintaan {
  status: FilterStatus
  q: string
  dari: string
  sampai: string
  sort: string
  dir: ArahUrut
  halaman: number
  perHalaman: number
}

const AWAL_PERMINTAAN: ParamsPermintaan = {
  // The queue opens on the requests that need a decision (FR11), not the whole archive.
  status: 'Diajukan',
  q: '',
  dari: '',
  sampai: '',
  sort: '',
  dir: 'asc',
  halaman: 1,
  perHalaman: PER_HALAMAN,
}

export const Route = createFileRoute('/admin/permintaan/')({
  loader: () => daftarPengajuan({ data: AWAL_PERMINTAAN }),
  component: Permintaan,
})

/**
 * 06 · Permintaan (FR11). The admin inbox.
 *
 * Pending sorts first — the server orders by a status rank, not alphabetically, so the
 * rows that need a decision are always at the top regardless of dates.
 */
function Permintaan() {
  const awal = Route.useLoaderData()
  const navigate = useNavigate()
  const { params, hasil, sibuk, muat } = useDaftar(
    daftarPengajuan,
    awal,
    AWAL_PERMINTAAN,
  )

  const columns: ColumnDef<BarisPengajuan, unknown>[] = [
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
            {row.original.penanggungJawab}
          </span>
        </>
      ),
    },
    {
      id: 'pinjam',
      accessorFn: (r) => r.tglPinjam,
      header: 'Tanggal',
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm">
          {formatTanggal(row.original.tglPinjam)} →{' '}
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
      accessorFn: (r) => r.status,
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.terlambat ? 'Terlambat' : row.original.status}
        />
      ),
    },
    {
      id: 'aksi',
      header: 'AKSI',
      enableSorting: false,
      cell: ({ row }) => (
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
      ),
    },
  ]

  const tab: Array<{ label: string; value: FilterStatus }> = [
    { label: 'Semua', value: 'semua' },
    { label: 'Diajukan', value: 'Diajukan' },
    { label: 'Disetujui', value: 'Disetujui' },
    { label: 'Dipinjam', value: 'Dipinjam' },
    { label: 'Terlambat', value: 'Terlambat' },
    { label: 'Selesai', value: 'Selesai' },
    { label: 'Ditolak', value: 'Ditolak' },
    { label: 'Dibatalkan', value: 'Dibatalkan' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Permintaan"
        subtitle="Tinjau pengajuan peminjaman dari UKM, HMJ, dan instansi."
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
          title: 'Tidak ada pengajuan',
          body: 'Tidak ada pengajuan yang cocok dengan filter ini. Coba ubah status atau kata kunci.',
        }}
        toolbar={
          <div className="flex flex-col gap-4">
            {/* Eight statuses never fit one line on a phone. Below `sm` the row scrolls
                sideways rather than wrapping to three lines, so the toolbar keeps its
                height and the pills stay a single swipeable strip. */}
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 max-sm:flex-nowrap sm:flex-wrap">
              {tab.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() =>
                    muat({ ...params, status: t.value, halaman: 1 })
                  }
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                    params.status === t.value
                      ? 'border-accent bg-accent text-white'
                      : 'border-neutral-soft bg-surface text-text-soft hover:text-text'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <KotakCari
                nilai={params.q}
                onCari={(q) => muat({ ...params, q, halaman: 1 })}
                placeholder="Cari kode, organisasi, atau penanggung jawab…"
                className="min-w-64 flex-1"
              />
              <input
                type="date"
                aria-label="Dari tanggal"
                className={`${inputCls} max-sm:w-[calc(50%-0.25rem)]`}
                value={params.dari}
                onChange={(e) =>
                  muat({ ...params, dari: e.target.value, halaman: 1 })
                }
              />
              <input
                type="date"
                aria-label="Sampai tanggal"
                className={`${inputCls} max-sm:w-[calc(50%-0.25rem)]`}
                value={params.sampai}
                onChange={(e) =>
                  muat({ ...params, sampai: e.target.value, halaman: 1 })
                }
              />
              {params.q || params.dari || params.sampai || params.sort ? (
                <TombolSekunder
                  onClick={() =>
                    muat({ ...AWAL_PERMINTAAN, status: params.status })
                  }
                >
                  Reset
                </TombolSekunder>
              ) : null}
            </div>
          </div>
        }
      />
    </div>
  )
}
