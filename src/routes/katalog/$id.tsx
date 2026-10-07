import { Link, createFileRoute } from '@tanstack/react-router'

import { statusDari } from '../../domain/ketersediaan'
import { formatTanggal, geserBulan, todayWib } from '../../lib/dates'
import { detailBarangKatalog } from '../../server/katalog'
import { PublicTopbar } from '../../components/PublicTopbar'
import { AvailabilityBadge } from '../../components/StatusBadge'
import { Card, PageHeader, TombolUtama } from '../../components/ui'

export const Route = createFileRoute('/katalog/$id')({
  validateSearch: (s: Record<string, unknown>): { bulan?: string } => ({
    bulan: typeof s.bulan === 'string' ? s.bulan : undefined,
  }),
  loaderDeps: ({ search }) => ({
    bulan: search.bulan ?? todayWib().slice(0, 7),
  }),
  loader: async ({ params, deps }) => {
    const d = await detailBarangKatalog({
      data: { id: params.id, bulan: deps.bulan },
    })
    return d ? { ...d, bulan: deps.bulan, hariIni: todayWib() } : null
  },
  component: DetailBarang,
})

/**
 * 10 · Detail Barang (FR01, FR02).
 *
 * The month availability calendar lives here and only here — it is the one place a
 * borrower needs to see which days are free, so a separate page for it would be a dead end.
 */
function DetailBarang() {
  const d = Route.useLoaderData()
  const { id } = Route.useParams()

  if (!d) {
    return (
      <div className="flex min-h-dvh flex-col">
        <PublicTopbar />
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-8 py-6">
          <PageHeader title="Barang tidak ditemukan" />
        </main>
      </div>
    )
  }

  const { barang, hari, bulan, hariIni, tersediaHariIni } = d
  const [tahun, bulanNum] = bulan.split('-').map(Number)
  const namaBulan = new Date(
    Date.UTC(tahun, bulanNum - 1, 1),
  ).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  // Grid starts on Monday, which is what an Indonesian calendar shows.
  const offsetAwal =
    (new Date(Date.UTC(tahun, bulanNum - 1, 1)).getUTCDay() + 6) % 7

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicTopbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-8 py-6">
        <PageHeader
          back={{ to: '/katalog', label: 'Kembali ke katalog' }}
          title={barang.nama}
          subtitle={`${barang.kategoriNama}${barang.lokasi ? ` · ${barang.lokasi}` : ''}`}
          actions={
            <AvailabilityBadge
              status={statusDari(tersediaHariIni, barang.jumlah)}
            />
          }
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Card className="flex h-64 items-center justify-center overflow-hidden bg-surface-container">
              <img
                src={`/api/foto/${barang.id}`}
                alt={`Foto ${barang.nama}`}
                className="h-full w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </Card>
            <Card className="flex flex-col gap-3">
              <h2 className="text-md font-semibold text-neutral-intense">
                Keterangan
              </h2>
              <p className="text-sm text-text-soft">
                {barang.deskripsi ?? 'Tidak ada deskripsi.'}
              </p>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-text-soft">Kondisi</dt>
                  <dd className="font-semibold">
                    {barang.kondisi.replace('_', ' ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-soft">Jumlah total</dt>
                  <dd className="font-semibold">{barang.jumlah} unit</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-soft">Lokasi</dt>
                  <dd className="font-semibold">{barang.lokasi ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-soft">Tersedia hari ini</dt>
                  <dd className="font-semibold">{tersediaHariIni} unit</dd>
                </div>
              </dl>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-md font-semibold text-neutral-intense">
                  Ketersediaan {namaBulan}
                </h2>
                <div className="flex gap-1">
                  <Link
                    to="/katalog/$id"
                    params={{ id }}
                    search={{ bulan: geserBulan(bulan, -1) }}
                    className="rounded-md border border-neutral-soft px-2 py-1 text-sm no-underline"
                  >
                    ←
                  </Link>
                  <Link
                    to="/katalog/$id"
                    params={{ id }}
                    search={{ bulan: geserBulan(bulan, 1) }}
                    className="rounded-md border border-neutral-soft px-2 py-1 text-sm no-underline"
                  >
                    →
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-text-soft">
                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((h) => (
                  <span key={h}>{h}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: offsetAwal }, (_, i) => (
                  <span key={`kosong-${i}`} />
                ))}
                {hari.map((h) => {
                  const lewat = h.tanggal < hariIni
                  const gaya = lewat
                    ? 'bg-surface-container text-text-disabled'
                    : h.status === 'Habis'
                      ? 'bg-error-container text-error'
                      : h.status === 'Terbatas'
                        ? 'bg-warning-container text-warning'
                        : 'bg-success-container text-success-text'
                  return (
                    <span
                      key={h.tanggal}
                      title={`${formatTanggal(h.tanggal)} · ${h.tersedia} tersedia`}
                      className={`flex aspect-square flex-col items-center justify-center rounded-md text-xs font-semibold ${gaya}`}
                    >
                      {Number(h.tanggal.slice(8))}
                      <span className="text-[10px] font-normal">
                        {lewat ? '—' : h.tersedia}
                      </span>
                    </span>
                  )
                })}
              </div>
              <p className="text-xs text-text-soft">
                Angka menunjukkan unit yang masih tersedia pada tanggal
                tersebut. Hari pengembalian sudah dihitung bebas untuk
                peminjaman berikutnya.
              </p>
            </Card>

            <Card className="flex flex-col gap-3">
              <h2 className="text-md font-semibold text-neutral-intense">
                Ajukan peminjaman
              </h2>
              <p className="text-sm text-text-soft">
                Tambahkan barang ini ke formulir peminjaman, lalu lengkapi data
                organisasi Anda.
              </p>
              <Link
                to="/ajukan"
                search={{ barang: barang.id }}
                className="no-underline"
              >
                <TombolUtama className="w-full">Ajukan Peminjaman</TombolUtama>
              </Link>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
