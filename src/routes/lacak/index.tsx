import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { LABEL_STATUS } from '../../domain/status'
import { formatTanggal, formatWaktu } from '../../lib/dates'
import { lacakPengajuan } from '../../server/pengajuan'
import { PublicTopbar } from '../../components/PublicTopbar'
import { StatusBadge } from '../../components/StatusBadge'
import {
  Card,
  Field,
  PageHeader,
  TombolUtama,
  inputCls,
} from '../../components/ui'

export const Route = createFileRoute('/lacak/')({
  validateSearch: (s: Record<string, unknown>): { kode?: string } => ({
    kode: typeof s.kode === 'string' ? s.kode : undefined,
  }),
  loaderDeps: ({ search }) => ({ kode: search.kode ?? '' }),
  loader: async ({ deps }) =>
    deps.kode.trim().length >= 4
      ? {
          hasil: await lacakPengajuan({ data: { kode: deps.kode } }),
          kode: deps.kode,
        }
      : { hasil: null, kode: deps.kode },
  component: Lacak,
})

/**
 * 03 · Cek Status (FR06).
 *
 * The tracking code is the only credential, so this page reveals nothing beyond the
 * request it names. There is no email notification (settled decision: the borrower polls),
 * which is why the success screen tells them to keep the code.
 */
function Lacak() {
  const { hasil, kode } = Route.useLoaderData()
  const navigate = useNavigate({ from: Route.fullPath })
  const [input, setInput] = useState(kode)

  const sudahCari = kode.trim().length >= 4

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicTopbar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-8 py-6">
        <PageHeader
          back={{ to: '/', label: 'Kembali ke beranda' }}
          title="Cek Status Pengajuan"
          subtitle="Masukkan kode pelacakan yang Anda terima setelah mengajukan formulir."
        />

        <Card className="flex flex-col gap-3">
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault()
              void navigate({ search: { kode: input.trim() } })
            }}
          >
            <div className="flex-1">
              <Field label="Kode pengajuan">
                <input
                  className={`${inputCls} font-mono`}
                  placeholder="PINJ-202610-XXXX"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </Field>
            </div>
            <TombolUtama type="submit">Cek status</TombolUtama>
          </form>
        </Card>

        {sudahCari && !hasil ? (
          <Card>
            <p className="text-sm font-semibold text-error">
              Kode tidak ditemukan. Periksa kembali kode Anda.
            </p>
            <p className="mt-1 text-xs text-text-soft">
              Kode berbentuk PINJ-YYYYMM-XXXX dan peka terhadap huruf
              besar/kecil.
            </p>
          </Card>
        ) : null}

        {hasil ? (
          <>
            <Card className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold text-text-soft">
                    {hasil.kode}
                  </p>
                  <h2 className="text-lg font-bold text-neutral-intense">
                    {hasil.organisasi}
                  </h2>
                  <p className="text-sm text-text-soft">
                    {hasil.penanggungJawab} · diajukan{' '}
                    {formatWaktu(hasil.createdAt)}
                  </p>
                </div>
                <StatusBadge
                  status={hasil.terlambat ? 'Terlambat' : hasil.status}
                />
              </div>

              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-text-soft">Tanggal pinjam</dt>
                  <dd className="text-sm font-semibold">
                    {formatTanggal(hasil.tglPinjam)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-soft">Tanggal kembali</dt>
                  <dd className="text-sm font-semibold">
                    {formatTanggal(hasil.tglKembali)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-text-soft">Keperluan</dt>
                  <dd className="text-sm font-semibold">{hasil.keperluan}</dd>
                </div>
              </dl>

              {hasil.status === 'Ditolak' && hasil.alasanPenolakan ? (
                <div className="rounded-md bg-error-container px-4 py-3 text-sm text-error">
                  <p className="font-semibold">Alasan penolakan</p>
                  <p>{hasil.alasanPenolakan}</p>
                </div>
              ) : null}
            </Card>

            <Card className="flex flex-col gap-3">
              <h2 className="text-md font-semibold text-neutral-intense">
                Barang
              </h2>
              <ul className="flex flex-col gap-2">
                {hasil.baris.map((b, i) => (
                  <li key={i} className="flex justify-between gap-3 text-sm">
                    <span>{b.nama}</span>
                    <span className="font-semibold">×{b.jumlah}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="flex flex-col gap-4">
              <h2 className="text-md font-semibold text-neutral-intense">
                Riwayat status
              </h2>
              <ol className="flex flex-col gap-3">
                <Langkah
                  aktif
                  judul="Diajukan"
                  keterangan={formatWaktu(hasil.createdAt)}
                />
                {hasil.status === 'Ditolak' ? (
                  <Langkah
                    aktif
                    judul="Ditolak"
                    keterangan="Pengajuan tidak disetujui"
                  />
                ) : null}
                {hasil.status === 'Dibatalkan' ? (
                  <Langkah
                    aktif
                    judul="Dibatalkan"
                    keterangan="Surat peminjaman belum diterima sebelum tanggal pinjam"
                  />
                ) : null}
                {['Disetujui', 'Dipinjam', 'Selesai'].includes(hasil.status) ? (
                  <>
                    <Langkah
                      aktif
                      judul="Disetujui"
                      keterangan="Menunggu surat peminjaman"
                    />
                    <Langkah
                      aktif={Boolean(hasil.surat)}
                      judul="Surat diterima"
                      keterangan={
                        hasil.surat
                          ? formatWaktu(hasil.surat.waktu)
                          : 'Belum diserahkan ke sekretariat'
                      }
                    />
                    <Langkah
                      aktif={hasil.surat?.status === 'terverifikasi'}
                      judul="Surat terverifikasi"
                    />
                    <Langkah
                      aktif={
                        hasil.status === 'Dipinjam' ||
                        hasil.status === 'Selesai'
                      }
                      judul="Barang dipinjam"
                    />
                    <Langkah
                      aktif={hasil.status === 'Selesai'}
                      judul="Selesai"
                    />
                  </>
                ) : null}
              </ol>
              <p className="text-xs text-text-soft">
                Status saat ini:{' '}
                {LABEL_STATUS[hasil.terlambat ? 'Terlambat' : hasil.status]}.
                Ambil dan kembalikan barang di Sekretariat HMTI, Gedung TI Lt.
                2.
              </p>
            </Card>
          </>
        ) : null}
      </main>
    </div>
  )
}

function Langkah({
  aktif,
  judul,
  keterangan,
}: {
  aktif: boolean
  judul: string
  keterangan?: string
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className={`mt-1 size-3 shrink-0 rounded-full ${aktif ? 'bg-brand' : 'border border-neutral-soft bg-surface'}`}
      />
      <span className="flex flex-col">
        <span
          className={`text-sm font-semibold ${aktif ? 'text-neutral-intense' : 'text-text-disabled'}`}
        >
          {judul}
        </span>
        {keterangan ? (
          <span className="text-xs text-text-soft">{keterangan}</span>
        ) : null}
      </span>
    </li>
  )
}
