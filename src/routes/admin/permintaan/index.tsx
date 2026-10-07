import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import type { STATUS_PENGAJUAN } from '../../../db/schema'
import { formatTanggal } from '../../../lib/dates'
import { daftarPengajuan } from '../../../server/pengajuan'
import { StatusBadge } from '../../../components/StatusBadge'
import {
  BarisTabel,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  Sel,
  inputCls,
} from '../../../components/ui'

type FilterStatus = (typeof STATUS_PENGAJUAN)[number] | 'semua' | 'Terlambat'

export const Route = createFileRoute('/admin/permintaan/')({
  // Search params are optional so a plain <Link to="/admin/permintaan"> needs no
  // `search` prop; the loader applies the defaults.
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    status?: FilterStatus
    q?: string
    dari?: string
    sampai?: string
  } => ({
    status: s.status as FilterStatus | undefined,
    q: typeof s.q === 'string' ? s.q : undefined,
    dari: typeof s.dari === 'string' ? s.dari : undefined,
    sampai: typeof s.sampai === 'string' ? s.sampai : undefined,
  }),
  loaderDeps: ({ search }) => ({
    status: search.status ?? 'semua',
    q: search.q ?? '',
    dari: search.dari ?? '',
    sampai: search.sampai ?? '',
  }),
  loader: ({ deps }) => daftarPengajuan({ data: deps }),
  component: Permintaan,
})

/**
 * 06 · Permintaan (FR11). The admin inbox.
 *
 * Pending sorts first — the server orders by a status rank, not alphabetically, so the
 * rows that need a decision are always at the top regardless of dates.
 */
function Permintaan() {
  const rows = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [q, setQ] = useState(search.q ?? '')

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

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {tab.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() =>
                void navigate({ search: (p) => ({ ...p, status: t.value }) })
              }
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                search.status === t.value
                  ? 'border-accent bg-accent text-white'
                  : 'border-neutral-soft bg-surface text-text-soft hover:text-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void navigate({ search: (p) => ({ ...p, q }) })
          }}
        >
          <input
            className={`${inputCls} min-w-64 flex-1`}
            placeholder="Cari kode, organisasi, atau penanggung jawab…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <input
            type="date"
            aria-label="Dari tanggal"
            className={inputCls}
            value={search.dari ?? ''}
            onChange={(e) =>
              void navigate({ search: (p) => ({ ...p, dari: e.target.value }) })
            }
          />
          <input
            type="date"
            aria-label="Sampai tanggal"
            className={inputCls}
            value={search.sampai ?? ''}
            onChange={(e) =>
              void navigate({
                search: (p) => ({ ...p, sampai: e.target.value }),
              })
            }
          />
          <button
            type="submit"
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-ink"
          >
            Cari
          </button>
        </form>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="Tidak ada pengajuan"
          body="Tidak ada pengajuan yang cocok dengan filter ini. Coba ubah status atau kata kunci."
        />
      ) : (
        <DataTable
          head={['Kode', 'Organisasi', 'Tanggal', 'Barang', 'Status', '']}
        >
          {rows.map((r) => (
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
              <Sel className="whitespace-nowrap text-xs">
                {formatTanggal(r.tglPinjam)} → {formatTanggal(r.tglKembali)}
              </Sel>
              <Sel className="text-xs">
                {r.jumlahBaris} jenis · {r.totalUnit} unit
              </Sel>
              <Sel>
                <StatusBadge status={r.terlambat ? 'Terlambat' : r.status} />
              </Sel>
              <Sel>
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
    </div>
  )
}
