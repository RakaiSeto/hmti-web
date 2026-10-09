import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { KONDISI } from '../../../db/schema'
import { formatTanggal } from '../../../lib/dates'
import { detailPengajuan } from '../../../server/pengajuan'
import { catatSerahTerima } from '../../../server/siklus'
import { StatusBadge } from '../../../components/StatusBadge'
import { UnggahBerkas } from '../../../components/UnggahBerkas'
import {
  BarisTabel,
  Card,
  DataTable,
  Field,
  PageHeader,
  Peringatan,
  Sel,
  TombolSekunder,
  TombolUtama,
  inputCls,
} from '../../../components/ui'

export const Route = createFileRoute('/admin/serah-terima/$kode')({
  loader: ({ params }) => detailPengajuan({ data: { kode: params.kode } }),
  component: SerahTerima,
})

/**
 * 12 · Serah Terima (FR15, FR14, BR04).
 *
 * FR14/BR04 are soft gates in v2: an unverified letter shows a warning banner and the
 * form still submits. The banner is the requirement, not decoration — removing it would
 * silently turn the gate back into a hard block, which is the opposite failure.
 */
function SerahTerima() {
  const p = Route.useLoaderData()
  const router = useRouter()
  const [penerima, setPenerima] = useState(p?.penanggungJawab ?? '')
  const [catatan, setCatatan] = useState('')
  const [kondisi, setKondisi] = useState<Record<string, string>>(
    Object.fromEntries((p?.baris ?? []).map((b) => [b.barang_id, 'baik'])),
  )
  const [pesan, setPesan] = useState<string | null>(null)
  const [sibuk, setSibuk] = useState(false)
  const [bukti, setBukti] = useState<File | null>(null)

  if (!p) {
    return (
      <PageHeader
        title="Pengajuan tidak ditemukan"
        back={{ to: '/admin/peminjaman', label: 'Kembali' }}
      />
    )
  }

  const terverifikasi = p.surat?.status === 'terverifikasi'

  async function kirim() {
    if (!bukti) {
      setPesan('Foto bukti serah terima wajib diunggah.')
      return
    }
    setSibuk(true)
    setPesan(null)
    // FormData, not an object: the photo cannot cross the server-function boundary as
    // JSON. `items` goes as a JSON string, which FormData cannot carry natively.
    const data = new FormData()
    data.set('kode', p!.kode)
    data.set('penerima', penerima)
    data.set('catatan', catatan)
    data.set('file', bukti)
    data.set(
      'items',
      JSON.stringify(
        p!.baris.map((b) => ({
          barangId: b.barang_id,
          kondisi: kondisi[b.barang_id],
        })),
      ),
    )
    try {
      const hasil = await catatSerahTerima({ data })
      if (!hasil.ok) {
        setPesan(hasil.pesan)
        return
      }
      await router.navigate({
        to: '/admin/permintaan/$kode',
        params: { kode: p!.kode },
      })
    } catch {
      // A rejected call reports nothing through `hasil`; without this the form would sit
      // there looking busy for good.
      setPesan('Serah terima gagal dicatat. Coba lagi.')
    } finally {
      setSibuk(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{
          to: '/admin/permintaan/$kode',
          label: 'Kembali ke detail pengajuan',
        }}
        title="Serah Terima"
        subtitle={`${p.kode} · ${p.organisasi}`}
        actions={<StatusBadge status={p.status} />}
      />

      {pesan ? (
        <p
          role="alert"
          className="rounded-md bg-error-container px-4 py-3 text-sm font-semibold text-error"
        >
          {pesan}
        </p>
      ) : null}

      {!terverifikasi ? (
        <Peringatan>
          Surat belum terverifikasi. Serah terima tetap dapat dicatat, tetapi
          pastikan surat asli sudah diterima.
        </Peringatan>
      ) : null}

      <Card className="flex flex-col gap-4">
        <h2 className="text-md font-semibold text-neutral-intense">
          Data penerimaan
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama penerima" wajib>
            <input
              required
              maxLength={120}
              className={inputCls}
              value={penerima}
              onChange={(e) => setPenerima(e.target.value)}
            />
          </Field>
          <Field label="Periode pinjam">
            <input
              className={inputCls}
              disabled
              value={`${formatTanggal(p.tglPinjam)} → ${formatTanggal(p.tglKembali)}`}
            />
          </Field>
        </div>
        <Field label="Catatan (opsional)">
          <textarea
            maxLength={500}
            className={`${inputCls} min-h-20`}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />
        </Field>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-md font-semibold text-neutral-intense">
          Kondisi barang saat diserahkan
        </h2>
        <DataTable head={['Barang', 'Jumlah', 'Kondisi']}>
          {p.baris.map((b) => (
            <BarisTabel key={b.barang_id}>
              <Sel className="font-semibold">{b.nama}</Sel>
              <Sel>×{b.jumlah}</Sel>
              <Sel>
                <select
                  aria-label={`Kondisi ${b.nama}`}
                  className={inputCls}
                  value={kondisi[b.barang_id]}
                  onChange={(e) =>
                    setKondisi((k) => ({ ...k, [b.barang_id]: e.target.value }))
                  }
                >
                  {KONDISI.map((k) => (
                    <option key={k} value={k}>
                      {k.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </Sel>
            </BarisTabel>
          ))}
        </DataTable>
      </div>

      <Card className="flex flex-col gap-3">
        <Field
          label="Foto bukti serah terima"
          wajib
          hint="Wajib diunggah sebelum serah terima dicatat."
        >
          <UnggahBerkas
            accept="image/jpeg,image/png,image/webp"
            petunjuk="JPG, PNG, atau WebP, maksimal 8 MB."
            file={bukti}
            onPilih={(f) => {
              setBukti(f)
              setPesan(null)
            }}
            sibuk={sibuk}
          />
        </Field>
      </Card>

      <div className="flex justify-end gap-2">
        <TombolSekunder
          onClick={() =>
            void router.navigate({
              to: '/admin/permintaan/$kode',
              params: { kode: p.kode },
            })
          }
        >
          Batal
        </TombolSekunder>
        <TombolUtama
          disabled={sibuk || penerima.trim().length < 2}
          onClick={() => void kirim()}
        >
          {sibuk ? 'Menyimpan…' : 'Catat serah terima'}
        </TombolUtama>
      </div>
    </div>
  )
}
