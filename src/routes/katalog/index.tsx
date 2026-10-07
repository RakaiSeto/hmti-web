import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'

import { daftarKategoriPublik, katalogBarang } from '../../server/katalog'
import { AvailabilityBadge } from '../../components/StatusBadge'
import { PublicTopbar } from '../../components/PublicTopbar'
import { Card, EmptyState, PageHeader, inputCls } from '../../components/ui'

export const Route = createFileRoute('/katalog/')({
  validateSearch: (
    s: Record<string, unknown>,
  ): { q?: string; kategori?: string } => ({
    q: typeof s.q === 'string' ? s.q : undefined,
    kategori: typeof s.kategori === 'string' ? s.kategori : undefined,
  }),
  loaderDeps: ({ search }) => ({
    q: search.q ?? '',
    kategori: search.kategori ?? '',
  }),
  loader: async ({ deps }) => ({
    kategori: await daftarKategoriPublik(),
    rows: await katalogBarang({ data: { q: deps.q, kategori: deps.kategori } }),
  }),
  component: Katalog,
})

/**
 * 09 · Katalog Barang (FR01).
 *
 * Reachable from the request form and from the landing page, but deliberately NOT in the
 * public nav — the catalog is the surface you use while filling the form, which is the
 * correction design-pages-plan §9.2 records.
 */
function Katalog() {
  const { rows, kategori } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicTopbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-8 py-6">
        <PageHeader
          title="Katalog Barang"
          subtitle="Barang yang tersedia untuk dipinjam. Ketersediaan dihitung untuk hari ini."
        />

        <Card className="flex flex-wrap gap-2">
          <form
            className="flex flex-1 flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              void navigate({ search: (p) => ({ ...p, q: search.q }) })
            }}
          >
            <input
              className={`${inputCls} min-w-56 flex-1`}
              placeholder="Cari barang…"
              value={search.q ?? ''}
              onChange={(e) =>
                void navigate({
                  search: (p) => ({ ...p, q: e.target.value }),
                  replace: true,
                })
              }
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
          </form>
        </Card>

        {rows.length === 0 ? (
          <EmptyState
            title="Tidak ada barang"
            body="Tidak ada barang yang cocok dengan pencarian ini."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((b) => (
              <Link
                key={b.id}
                to="/katalog/$id"
                params={{ id: b.id }}
                className="flex flex-col gap-3 rounded-xl bg-surface p-4 no-underline shadow-card transition-shadow hover:shadow-modal"
              >
                <div className="flex h-32 items-center justify-center overflow-hidden rounded-md bg-surface-container">
                  <img
                    src={`/api/foto/${b.id}`}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // No photo uploaded: show the initial rather than a broken image.
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-neutral-intense">
                    {b.nama}
                  </span>
                  <AvailabilityBadge status={b.status} />
                </div>
                <span className="text-xs text-text-soft">
                  {b.kategoriNama}
                  {b.lokasi ? ` · ${b.lokasi}` : ''}
                </span>
                <span className="text-xs text-text-soft">
                  {b.tersedia} dari {b.jumlah} unit tersedia
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
