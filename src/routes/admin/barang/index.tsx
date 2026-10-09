import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { daftarBarang, daftarKategoriRef } from '../../../server/barang'
import type { BarangRingkas } from '../../../server/barang'
import { AvailabilityBadge } from '../../../components/StatusBadge'
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

interface ParamsBarang {
  q: string
  kategoriId: string
  sort: string
  dir: ArahUrut
  halaman: number
  perHalaman: number
}

const AWAL_BARANG: ParamsBarang = {
  q: '',
  kategoriId: '',
  sort: '',
  dir: 'asc',
  halaman: 1,
  perHalaman: PER_HALAMAN,
}

export const Route = createFileRoute('/admin/barang/')({
  // The first page is server-rendered; every change after that is fetched client-side, so
  // the URL stays bare (see lib/useDaftar.ts).
  loader: async () => ({
    hasil: await daftarBarang({ data: AWAL_BARANG }),
    kategori: await daftarKategoriRef(),
  }),
  component: DaftarBarang,
})

/**
 * 07 · Inventaris (FR09). Admin manages; a PJ inventaris sees the same table read-only,
 * because the role needs to look up stock but cannot change it (v2 role split).
 */
function DaftarBarang() {
  const awal = Route.useLoaderData()
  const { sesi } = Route.useRouteContext()
  const navigate = useNavigate()
  const { params, hasil, sibuk, muat } = useDaftar(
    daftarBarang,
    awal.hasil,
    AWAL_BARANG,
  )
  const admin = sesi.peran === 'admin'

  const columns: ColumnDef<BarangRingkas, unknown>[] = [
    {
      id: 'nama',
      accessorFn: (b) => b.nama,
      header: 'Barang',
      cell: ({ row }) => {
        const b = row.original
        return (
          <>
            <span className="font-semibold text-neutral-intense">{b.nama}</span>
            {b.lokasi ? (
              <span className="block text-sm font-medium text-text-soft">
                {b.lokasi}
              </span>
            ) : null}
          </>
        )
      },
    },
    {
      id: 'kategori',
      accessorFn: (b) => b.kategoriNama,
      header: 'Kategori',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.kategoriNama}</span>
      ),
    },
    {
      id: 'jumlah',
      accessorFn: (b) => b.jumlah,
      header: 'Jumlah',
      cell: ({ row }) => (
        <>
          {row.original.jumlah}
          <span className="block text-sm font-medium text-text-soft">
            {row.original.tersedia} tersedia
          </span>
        </>
      ),
    },
    {
      id: 'kondisi',
      accessorFn: (b) => b.kondisi,
      header: 'Kondisi',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.kondisi.replace('_', ' ')}
        </span>
      ),
    },
    {
      id: 'ketersediaan',
      header: 'Ketersediaan',
      enableSorting: false,
      cell: ({ row }) => (
        <AvailabilityBadge status={row.original.statusKetersediaan} />
      ),
    },
    {
      id: 'aksi',
      header: 'AKSI',
      enableSorting: false,
      cell: ({ row }) =>
        admin ? (
          <TombolAksi
            onClick={() =>
              void navigate({
                to: '/admin/barang/$id',
                params: { id: row.original.id },
              })
            }
          >
            Ubah
          </TombolAksi>
        ) : (
          <span className="text-sm text-text-disabled">—</span>
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={admin ? 'Inventaris' : 'Inventaris (hanya lihat)'}
        subtitle={
          admin
            ? 'Kelola barang, kategori, dan stok.'
            : 'Anda dapat melihat stok, tetapi hanya admin yang dapat mengubahnya.'
        }
        actions={
          admin ? (
            <Link
              to="/admin/barang/$id"
              params={{ id: 'baru' }}
              className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink no-underline"
            >
              Barang baru
            </Link>
          ) : null
        }
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
          title: 'Tidak ada barang',
          body: 'Tidak ada barang yang cocok dengan filter ini.',
        }}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <KotakCari
              nilai={params.q}
              onCari={(q) => muat({ ...params, q, halaman: 1 })}
              placeholder="Cari nama atau lokasi barang…"
              className="min-w-56 flex-1"
            />
            <select
              aria-label="Kategori"
              className={inputCls}
              value={params.kategoriId}
              onChange={(e) =>
                muat({ ...params, kategoriId: e.target.value, halaman: 1 })
              }
            >
              <option value="">Semua kategori</option>
              {awal.kategori.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
            {params.q || params.kategoriId || params.sort ? (
              <TombolSekunder onClick={() => muat(AWAL_BARANG)}>
                Reset
              </TombolSekunder>
            ) : null}
          </div>
        }
      />
    </div>
  )
}
