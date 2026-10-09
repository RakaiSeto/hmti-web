import { createFileRoute } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { hanyaAdmin } from '../../../lib/routeGuards'

import { labelAksi, labelEntitas } from '../../../domain/labels'
import { formatWaktu } from '../../../lib/dates'
import { daftarLog, daftarPenggunaRef } from '../../../server/admin'
import { TabelData } from '../../../components/TabelData'
import {
  KotakCari,
  PageHeader,
  TombolSekunder,
  inputCls,
} from '../../../components/ui'
import type { ArahUrut } from '../../../lib/tabel'
import { PER_HALAMAN } from '../../../lib/tabel'
import { useDaftar } from '../../../lib/useDaftar'

interface ParamsLog {
  penggunaId: string
  dari: string
  sampai: string
  q: string
  sort: string
  dir: ArahUrut
  halaman: number
  perHalaman: number
}

const AWAL_LOG: ParamsLog = {
  penggunaId: '',
  dari: '',
  sampai: '',
  q: '',
  sort: '',
  dir: 'asc',
  halaman: 1,
  perHalaman: PER_HALAMAN,
}

export const Route = createFileRoute('/admin/log/')({
  beforeLoad: hanyaAdmin,
  loader: async () => ({
    log: await daftarLog({ data: AWAL_LOG }),
    pengguna: await daftarPenggunaRef(),
  }),
  component: LogAktivitas,
})

/**
 * 17 · Log Aktivitas Pengguna (FR21). Admin only, read-only, paginated.
 *
 * There is no edit or delete affordance anywhere on this page, and no server function
 * exists that could provide one — the requirement is that the log cannot be changed from
 * the UI, so the absence is the feature.
 */
function LogAktivitas() {
  const awal = Route.useLoaderData()
  const { params, hasil, sibuk, muat } = useDaftar(
    daftarLog,
    awal.log,
    AWAL_LOG,
  )

  const columns: ColumnDef<(typeof awal.log.rows)[number], unknown>[] = [
    {
      id: 'waktu',
      accessorFn: (r) => r.waktu.getTime(),
      header: 'Waktu',
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm font-medium text-text-soft">
          {formatWaktu(row.original.waktu)}
        </span>
      ),
    },
    {
      id: 'pengguna',
      accessorFn: (r) => r.pengguna,
      header: 'Pengguna',
      cell: ({ row }) => (
        <span className="font-semibold text-neutral-intense">
          {row.original.pengguna}
        </span>
      ),
    },
    {
      id: 'aksi',
      accessorFn: (r) => r.aksi,
      header: 'Aksi',
      cell: ({ row }) => (
        <span className="text-sm">{labelAksi(row.original.aksi)}</span>
      ),
    },
    {
      id: 'entitas',
      accessorFn: (r) => r.entitas,
      header: 'Entitas',
      cell: ({ row }) => (
        <span className="text-sm">
          {labelEntitas(row.original.entitas)}
          {row.original.entitasId ? (
            <span className="ml-2 font-mono text-text-disabled">
              {row.original.entitasId.slice(0, 8)}
            </span>
          ) : null}
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Log Aktivitas Pengguna"
        subtitle="Catatan tindakan pengurus. Tidak dapat diubah atau dihapus."
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
          title: 'Belum ada aktivitas',
          body: 'Tidak ada catatan pada filter ini.',
        }}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <KotakCari
              nilai={params.q}
              onCari={(q) => muat({ ...params, q, halaman: 1 })}
              placeholder="Cari pengguna, aksi, atau entitas…"
              className="min-w-56 flex-1"
            />
            <select
              aria-label="Pengguna"
              className={inputCls}
              value={params.penggunaId}
              onChange={(e) =>
                muat({ ...params, penggunaId: e.target.value, halaman: 1 })
              }
            >
              <option value="">Semua pengguna</option>
              {awal.pengguna.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nama}
                </option>
              ))}
            </select>
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
            {params.q || params.penggunaId || params.dari || params.sampai ? (
              <TombolSekunder onClick={() => muat(AWAL_LOG)}>
                Reset
              </TombolSekunder>
            ) : null}
          </div>
        }
      />
    </div>
  )
}
