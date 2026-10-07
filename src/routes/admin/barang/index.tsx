import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { daftarBarang, daftarKategoriRef } from '../../../server/barang'
import { AvailabilityBadge } from '../../../components/StatusBadge'
import {
  BarisTabel,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  Sel,
  TombolUtama,
  inputCls,
} from '../../../components/ui'

export const Route = createFileRoute('/admin/barang/')({
  validateSearch: (
    s: Record<string, unknown>,
  ): { q?: string; kategori?: string } => ({
    q: typeof s.q === 'string' ? s.q : undefined,
    kategori: typeof s.kategori === 'string' ? s.kategori : undefined,
  }),
  loaderDeps: ({ search }) => ({
    q: search.q ?? '',
    kategoriId: search.kategori ?? '',
  }),
  loader: async ({ deps }) => ({
    rows: await daftarBarang({ data: deps }),
    kategori: await daftarKategoriRef(),
  }),
  component: DaftarBarang,
})

/**
 * 07 · Inventaris (FR09). Admin manages; a PJ inventaris sees the same table read-only,
 * because the role needs to look up stock but cannot change it (v2 role split).
 */
function DaftarBarang() {
  const { rows, kategori } = Route.useLoaderData()
  const { sesi } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [q, setQ] = useState(search.q ?? '')
  const admin = sesi.peran === 'admin'

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

      <Card className="flex flex-wrap gap-2">
        <form
          className="flex flex-1 flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void navigate({ search: (p) => ({ ...p, q }) })
          }}
        >
          <input
            className={`${inputCls} min-w-56 flex-1`}
            placeholder="Cari nama atau lokasi barang…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            aria-label="Kategori"
            className={inputCls}
            value={search.kategori ?? ''}
            onChange={(e) =>
              void navigate({
                search: (p) => ({ ...p, kategori: e.target.value }),
              })
            }
          >
            <option value="">Semua kategori</option>
            {kategori.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
          <TombolUtama type="submit">Cari</TombolUtama>
        </form>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="Tidak ada barang"
          body="Tidak ada barang yang cocok dengan filter ini."
        />
      ) : (
        <DataTable
          head={['Barang', 'Kategori', 'Jumlah', 'Kondisi', 'Ketersediaan', '']}
        >
          {rows.map((b) => (
            <BarisTabel key={b.id}>
              <Sel>
                <span className="font-semibold text-neutral-intense">
                  {b.nama}
                </span>
                {b.lokasi ? (
                  <span className="block text-xs text-text-soft">
                    {b.lokasi}
                  </span>
                ) : null}
              </Sel>
              <Sel className="text-xs">{b.kategoriNama}</Sel>
              <Sel>
                {b.jumlah}
                <span className="block text-xs text-text-soft">
                  {b.tersedia} tersedia
                </span>
              </Sel>
              <Sel className="text-xs">{b.kondisi.replace('_', ' ')}</Sel>
              <Sel>
                <AvailabilityBadge status={b.statusKetersediaan} />
              </Sel>
              <Sel>
                {admin ? (
                  <Link
                    to="/admin/barang/$id"
                    params={{ id: b.id }}
                    className="text-sm font-semibold text-accent no-underline hover:underline"
                  >
                    Ubah
                  </Link>
                ) : (
                  <span className="text-xs text-text-disabled">—</span>
                )}
              </Sel>
            </BarisTabel>
          ))}
        </DataTable>
      )}
    </div>
  )
}
