import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { formatWaktu } from '../../../lib/dates'
import { daftarPengembalian } from '../../../server/siklus'
import type { BarisPengembalian } from '../../../server/siklus'
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

interface ParamsPengembalian {
  q: string
  dari: string
  sampai: string
  sort: string
  dir: ArahUrut
  halaman: number
  perHalaman: number
}

const AWAL_PENGEMBALIAN: ParamsPengembalian = {
  q: '',
  dari: '',
  sampai: '',
  sort: '',
  dir: 'desc',
  halaman: 1,
  perHalaman: PER_HALAMAN,
}

export const Route = createFileRoute('/admin/pengembalian/')({
  loader: () => daftarPengembalian({ data: AWAL_PENGEMBALIAN }),
  component: RiwayatPengembalian,
})

/**
 * The return history (FR16) — what has already come back, newest first.
 *
 * The active half of the loop is Peminjaman Aktif; this is the finished half. A return is
 * recorded from `/admin/pengembalian/$kode`, reached from a loan's "Kembalikan" action.
 */
function RiwayatPengembalian() {
  const awal = Route.useLoaderData()
  const navigate = useNavigate()
  const { params, hasil, sibuk, muat } = useDaftar(
    daftarPengembalian,
    awal,
    AWAL_PENGEMBALIAN,
  )

  const columns: ColumnDef<BarisPengembalian, unknown>[] = [
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
      id: 'waktu',
      accessorFn: (r) => r.waktu.getTime(),
      header: 'Dikembalikan',
      cell: ({ row }) => (
        <>
          <span className="whitespace-nowrap text-sm">
            {formatWaktu(row.original.waktu)}
          </span>
          <span className="block text-sm font-medium text-text-soft">
            oleh {row.original.oleh}
          </span>
        </>
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
      id: 'rusak',
      accessorFn: (r) => r.rusakHilang,
      header: 'Rusak/hilang',
      cell: ({ row }) => (
        <span
          className={
            row.original.rusakHilang > 0
              ? 'font-semibold text-error'
              : 'text-sm'
          }
        >
          {row.original.rusakHilang}
        </span>
      ),
    },
    {
      id: 'aksi',
      header: '',
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pengembalian"
        subtitle="Riwayat barang yang sudah dikembalikan."
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
          title: 'Belum ada pengembalian',
          body: 'Barang yang sudah dikembalikan akan muncul di sini.',
        }}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <KotakCari
              nilai={params.q}
              onCari={(q) => muat({ ...params, q, halaman: 1 })}
              placeholder="Cari kode, organisasi, atau penanggung jawab…"
              className="min-w-56 flex-1"
            />
            <input
              type="date"
              aria-label="Dari tanggal"
              className={inputCls}
              value={params.dari}
              onChange={(e) =>
                muat({ ...params, dari: e.target.value, halaman: 1 })
              }
            />
            <input
              type="date"
              aria-label="Sampai tanggal"
              className={inputCls}
              value={params.sampai}
              onChange={(e) =>
                muat({ ...params, sampai: e.target.value, halaman: 1 })
              }
            />
            {params.q || params.dari || params.sampai || params.sort ? (
              <TombolSekunder onClick={() => muat(AWAL_PENGEMBALIAN)}>
                Reset
              </TombolSekunder>
            ) : null}
          </div>
        }
      />
    </div>
  )
}
