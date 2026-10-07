import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useRef, useState } from 'react'

import { labelAksi } from '../../../domain/labels'
import { transisiTersedia } from '../../../domain/status'
import { formatTanggal, formatWaktu } from '../../../lib/dates'
import {
  aktifkanKembali,
  detailPengajuan,
  putuskanPengajuan,
} from '../../../server/pengajuan'
import { unggahSurat, verifikasiSurat } from '../../../server/siklus'
import { StatusBadge } from '../../../components/StatusBadge'
import {
  BarisTabel,
  Card,
  DataTable,
  PageHeader,
  Peringatan,
  Sel,
  TombolBahaya,
  TombolSekunder,
  TombolUtama,
  inputCls,
} from '../../../components/ui'

export const Route = createFileRoute('/admin/permintaan/$kode')({
  loader: ({ params }) => detailPengajuan({ data: { kode: params.kode } }),
  component: DetailPermintaan,
})

/**
 * 11 · Detail Permintaan (FR11, FR12, FR13, BR03, BR06).
 *
 * The page the whole physical loop hangs off. It shows the *states*, not just the happy
 * path: the illegal transition is absent rather than disabled-but-clickable, the
 * unverified letter carries BR04's warning, and a PJ sees the decision card as a
 * read-only note because FR12 forbids them approving.
 */
function DetailPermintaan() {
  const p = Route.useLoaderData()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pesan, setPesan] = useState<string | null>(null)
  const [sibuk, setSibuk] = useState(false)
  const [dialog, setDialog] = useState<'setujui' | 'tolak' | null>(null)
  const [alasan, setAlasan] = useState('')

  if (!p) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Pengajuan tidak ditemukan"
          back={{
            to: '/admin/permintaan',
            label: 'Kembali ke daftar permintaan',
          }}
        />
      </div>
    )
  }

  const aksi = transisiTersedia(p.status, p.peran)
  const bolehSetujui = aksi.includes('Disetujui') && p.status !== 'Dibatalkan'
  const bolehTolak = aksi.includes('Ditolak')
  const bolehAktifkan = p.status === 'Dibatalkan' && p.peran === 'admin'
  const suratTerverifikasi = p.surat?.status === 'terverifikasi'

  async function jalankan(fn: () => Promise<{ ok: boolean; pesan?: string }>) {
    setSibuk(true)
    setPesan(null)
    const hasil = await fn()
    setSibuk(false)
    if (!hasil.ok) {
      setPesan(hasil.pesan ?? 'Terjadi kesalahan.')
      return
    }
    setDialog(null)
    setAlasan('')
    await router.invalidate()
  }

  async function kirimSurat(file: File) {
    const fd = new FormData()
    fd.set('kode', p!.kode)
    fd.set('file', file)
    await jalankan(() => unggahSurat({ data: fd }))
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{
          to: '/admin/permintaan',
          label: 'Kembali ke daftar permintaan',
        }}
        title={p.kode}
        subtitle={`Diajukan ${formatWaktu(p.createdAt)}`}
        actions={<StatusBadge status={p.terlambat ? 'Terlambat' : p.status} />}
      />

      {pesan ? (
        <p
          role="alert"
          className="rounded-md bg-error-container px-4 py-3 text-sm font-semibold text-error"
        >
          {pesan}
        </p>
      ) : null}

      {p.status === 'Ditolak' && p.alasanPenolakan ? (
        <Peringatan>Alasan penolakan: {p.alasanPenolakan}</Peringatan>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* --- left column ------------------------------------------------ */}
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-3">
            <h2 className="text-md font-semibold text-neutral-intense">
              Organisasi
            </h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ['Nama organisasi', p.organisasi],
                ['Penanggung jawab', p.penanggungJawab],
                ['Kontak', p.kontak],
                ['Keperluan', p.keperluan],
                ['Tanggal pinjam', formatTanggal(p.tglPinjam)],
                ['Tanggal kembali', formatTanggal(p.tglKembali)],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <dt className="text-xs text-text-soft">{k}</dt>
                  <dd className="text-sm font-semibold text-neutral-intense">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          <div className="flex flex-col gap-3">
            <h2 className="text-md font-semibold text-neutral-intense">
              Barang yang diminta
            </h2>
            <DataTable head={['Barang', 'Jumlah', 'Stok total']}>
              {p.baris.map((b) => (
                <BarisTabel key={b.barang_id}>
                  <Sel className="font-semibold">{b.nama}</Sel>
                  <Sel>×{b.jumlah}</Sel>
                  <Sel className="text-text-soft">{b.stok} unit</Sel>
                </BarisTabel>
              ))}
            </DataTable>
          </div>

          <Card className="flex flex-col gap-4">
            <h2 className="text-md font-semibold text-neutral-intense">
              Riwayat status
            </h2>
            <ol className="flex flex-col gap-3">
              <Langkah
                aktif
                judul="Diajukan"
                waktu={formatWaktu(p.createdAt)}
              />
              {p.status === 'Ditolak' ? (
                <Langkah
                  aktif
                  judul="Ditolak"
                  keterangan={p.alasanPenolakan ?? ''}
                />
              ) : null}
              {p.status === 'Dibatalkan' ? (
                <Langkah
                  aktif
                  judul="Dibatalkan"
                  keterangan="Surat belum diterima di H-1."
                />
              ) : null}
              {['Disetujui', 'Dipinjam', 'Selesai'].includes(p.status) ? (
                <>
                  <Langkah aktif judul="Disetujui" />
                  <Langkah
                    aktif={Boolean(p.surat)}
                    judul="Surat diterima"
                    keterangan={
                      p.surat ? formatWaktu(p.surat.waktu) : 'Belum diunggah'
                    }
                  />
                  <Langkah
                    aktif={suratTerverifikasi}
                    judul="Surat terverifikasi"
                    keterangan={
                      p.surat?.waktuVerifikasi
                        ? formatWaktu(p.surat.waktuVerifikasi)
                        : 'Belum diverifikasi'
                    }
                  />
                  <Langkah
                    aktif={p.status === 'Dipinjam' || p.status === 'Selesai'}
                    judul="Dipinjam"
                    keterangan={
                      p.serahTerima ? formatWaktu(p.serahTerima.waktu) : ''
                    }
                  />
                  <Langkah
                    aktif={p.status === 'Selesai'}
                    judul="Selesai"
                    keterangan={
                      p.pengembalian ? formatWaktu(p.pengembalian.waktu) : ''
                    }
                  />
                </>
              ) : null}
            </ol>
          </Card>

          {p.log.length > 0 ? (
            <Card className="flex flex-col gap-3">
              <h2 className="text-md font-semibold text-neutral-intense">
                Log pengajuan ini
              </h2>
              <ul className="flex flex-col gap-2 text-sm">
                {p.log.map((l, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>
                      <span className="font-semibold">{l.oleh}</span>{' '}
                      {labelAksi(l.aksi).toLowerCase()}
                    </span>
                    <span className="shrink-0 text-xs text-text-soft">
                      {formatWaktu(l.waktu)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        {/* --- right column ----------------------------------------------- */}
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-3">
            <h2 className="text-md font-semibold text-neutral-intense">
              Surat peminjaman
            </h2>
            {p.surat ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-neutral-intense">
                  {p.surat.namaFile ?? 'surat.pdf'}
                </p>
                <StatusBadge
                  status={
                    p.surat.status === 'terverifikasi' ? 'Selesai' : 'Diajukan'
                  }
                />
                <p className="text-xs text-text-soft">
                  {p.surat.status === 'terverifikasi'
                    ? `Terverifikasi ${formatWaktu(p.surat.waktuVerifikasi)}`
                    : 'Menunggu verifikasi'}
                </p>
                <a
                  href={`/api/surat/${p.kode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-accent no-underline hover:underline"
                >
                  Buka surat
                </a>
              </div>
            ) : (
              <p className="text-sm text-text-soft">Belum diunggah</p>
            )}

            <p className="text-xs text-text-soft">
              Admin dan PJ inventaris dapat mengunggah dan memverifikasi surat.
            </p>

            {!suratTerverifikasi ? (
              <Peringatan>
                Belum terverifikasi — status Dipinjam tetap dapat dipilih,
                dengan peringatan.
              </Peringatan>
            ) : null}

            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              className="text-xs text-text-soft"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void kirimSurat(f)
              }}
            />
            {p.surat && p.surat.status !== 'terverifikasi' ? (
              <TombolSekunder
                disabled={sibuk}
                onClick={() =>
                  void jalankan(() =>
                    verifikasiSurat({ data: { kode: p.kode } }),
                  )
                }
              >
                Tandai terverifikasi
              </TombolSekunder>
            ) : null}
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-md font-semibold text-neutral-intense">
              Tindakan
            </h2>
            {p.peran !== 'admin' ? (
              <p className="text-sm text-text-soft">
                Hanya admin yang dapat menyetujui atau menolak pengajuan.
              </p>
            ) : (
              <>
                {bolehSetujui ? (
                  <TombolUtama
                    disabled={sibuk}
                    onClick={() => setDialog('setujui')}
                  >
                    Setujui
                  </TombolUtama>
                ) : null}
                {bolehTolak ? (
                  <TombolBahaya
                    disabled={sibuk}
                    onClick={() => setDialog('tolak')}
                  >
                    Tolak
                  </TombolBahaya>
                ) : null}
                {bolehAktifkan ? (
                  <TombolUtama
                    disabled={sibuk}
                    onClick={() =>
                      void jalankan(() =>
                        aktifkanKembali({ data: { kode: p.kode } }),
                      )
                    }
                  >
                    Aktifkan kembali
                  </TombolUtama>
                ) : null}
                {!bolehSetujui && !bolehTolak && !bolehAktifkan ? (
                  <p className="text-sm text-text-soft">
                    Tidak ada tindakan yang tersedia untuk status ini.
                  </p>
                ) : null}
                <p className="text-xs text-text-soft">
                  Hanya admin yang dapat menyetujui atau menolak. Menolak wajib
                  menyertakan alasan.
                </p>
              </>
            )}
          </Card>

          {p.status === 'Disetujui' ? (
            <Card className="flex flex-col gap-3">
              <h2 className="text-md font-semibold text-neutral-intense">
                Serah terima
              </h2>
              <p className="text-sm text-text-soft">
                Catat penyerahan barang ke penerima.
              </p>
              <Link
                to="/admin/serah-terima/$kode"
                params={{ kode: p.kode }}
                className="rounded-md bg-brand px-4 py-2.5 text-center text-sm font-semibold text-brand-ink no-underline"
              >
                Catat serah terima
              </Link>
            </Card>
          ) : null}

          {p.status === 'Dipinjam' ? (
            <Card className="flex flex-col gap-3">
              <h2 className="text-md font-semibold text-neutral-intense">
                Pengembalian
              </h2>
              <p className="text-sm text-text-soft">
                Catat barang yang dikembalikan.
              </p>
              <Link
                to="/admin/pengembalian/$kode"
                params={{ kode: p.kode }}
                className="rounded-md bg-brand px-4 py-2.5 text-center text-sm font-semibold text-brand-ink no-underline"
              >
                Catat pengembalian
              </Link>
            </Card>
          ) : null}

          {p.serahTerima ? (
            <Card className="flex flex-col gap-2">
              <h2 className="text-md font-semibold text-neutral-intense">
                Serah terima tercatat
              </h2>
              <p className="text-sm">
                Diterima{' '}
                <span className="font-semibold">{p.serahTerima.penerima}</span>{' '}
                oleh {p.serahTerima.oleh} pada{' '}
                {formatWaktu(p.serahTerima.waktu)}.
              </p>
              {p.serahTerima.catatan ? (
                <p className="text-xs text-text-soft">
                  {p.serahTerima.catatan}
                </p>
              ) : null}
            </Card>
          ) : null}

          {p.pengembalian ? (
            <Card className="flex flex-col gap-2">
              <h2 className="text-md font-semibold text-neutral-intense">
                Pengembalian tercatat
              </h2>
              <ul className="flex flex-col gap-1 text-sm">
                {p.pengembalian.items.map((it, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>{it.nama}</span>
                    <span className="font-semibold">
                      {it.jumlah}× {it.kondisi}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-text-soft">
                Dicatat {p.pengembalian.oleh} pada{' '}
                {formatWaktu(p.pengembalian.waktu)}.
              </p>
            </Card>
          ) : null}
        </div>
      </div>

      {/* --- decision dialog ------------------------------------------------ */}
      {dialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-surface p-6 shadow-modal"
          >
            <h2 className="text-md font-semibold text-neutral-intense">
              {dialog === 'setujui' ? 'Setujui pengajuan?' : 'Tolak pengajuan?'}
            </h2>
            {dialog === 'tolak' ? (
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-neutral-bold">
                Alasan penolakan (wajib)
                <textarea
                  className={`${inputCls} min-h-24`}
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                />
              </label>
            ) : (
              <p className="text-sm text-text-soft">
                Pengajuan {p.kode} akan berstatus Disetujui. Barang langsung
                dihitung terpakai pada tanggal tersebut.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <TombolSekunder
                onClick={() => {
                  setDialog(null)
                  setAlasan('')
                }}
              >
                Batal
              </TombolSekunder>
              <TombolUtama
                disabled={sibuk}
                onClick={() =>
                  void jalankan(() =>
                    putuskanPengajuan({
                      data: {
                        kode: p.kode,
                        keputusan:
                          dialog === 'setujui' ? 'Disetujui' : 'Ditolak',
                        alasan,
                      },
                    }),
                  )
                }
              >
                {dialog === 'setujui' ? 'Setujui' : 'Tolak'}
              </TombolUtama>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Langkah({
  aktif,
  judul,
  waktu,
  keterangan,
}: {
  aktif: boolean
  judul: string
  waktu?: string
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
        {waktu || keterangan ? (
          <span className="text-xs text-text-soft">{waktu ?? keterangan}</span>
        ) : null}
      </span>
    </li>
  )
}
