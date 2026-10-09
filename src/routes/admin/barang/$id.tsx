import { createFileRoute, useRouter } from '@tanstack/react-router'
import { hanyaAdmin } from '../../../lib/routeGuards'
import { useState } from 'react'

import { KONDISI } from '../../../db/schema'
import {
  ambilBarang,
  daftarKategoriRef,
  hapusBarang,
  simpanBarang,
  unggahFoto,
} from '../../../server/barang'
import { UnggahBerkas } from '../../../components/UnggahBerkas'
import {
  Card,
  Field,
  PageHeader,
  TombolBahaya,
  TombolSekunder,
  TombolUtama,
  inputCls,
} from '../../../components/ui'

export const Route = createFileRoute('/admin/barang/$id')({
  beforeLoad: hanyaAdmin,
  loader: async ({ params }) => ({
    barang:
      params.id === 'baru'
        ? null
        : await ambilBarang({ data: { id: params.id } }),
    kategori: await daftarKategoriRef(),
  }),
  component: FormBarang,
})

/**
 * 14 · Form Barang (FR09).
 *
 * The delete rule is shown rather than hidden: an item with borrowing history cannot be
 * deleted, and the refusal explains why and offers the alternative (set the count to 0).
 * A silently-missing delete button would leave the admin guessing.
 */
function FormBarang() {
  const { barang, kategori } = Route.useLoaderData()
  const router = useRouter()
  const [nama, setNama] = useState(barang?.nama ?? '')
  const [kategoriId, setKategoriId] = useState(
    barang ? barang.kategoriId : kategori.length > 0 ? kategori[0].id : '',
  )
  const [jumlah, setJumlah] = useState(barang?.jumlah ?? 0)
  const [kondisi, setKondisi] = useState(barang?.kondisi ?? 'baik')
  const [lokasi, setLokasi] = useState(barang?.lokasi ?? '')
  const [deskripsi, setDeskripsi] = useState(barang?.deskripsi ?? '')
  const [pesan, setPesan] = useState<string | null>(null)
  const [sibuk, setSibuk] = useState(false)
  const [fotoBaru, setFotoBaru] = useState<File | null>(null)

  const baru = !barang

  /**
   * An item photo is uploaded as soon as one is picked — there is no save button for it.
   *
   * The picked file stays in state after a successful upload on purpose: `/api/foto/{id}`
   * is served with an hour-long browser cache, so falling back to it right away would show
   * the previous photo back to the uploader.
   *
   * `finally` rather than a plain `setSibuk(false)` after the await: a rejected call would
   * otherwise leave the zone inert and reading "Mengunggah…" for good.
   */
  async function simpanFoto(f: File) {
    if (!barang) return
    setFotoBaru(f)
    setSibuk(true)
    setPesan(null)
    try {
      const fd = new FormData()
      fd.set('barangId', barang.id)
      fd.set('file', f)
      const hasil = await unggahFoto({ data: fd })
      if (!hasil.ok) {
        setPesan(hasil.pesan)
        setFotoBaru(null)
        return
      }
      await router.invalidate()
    } catch {
      setPesan('Foto gagal diunggah. Coba lagi.')
      setFotoBaru(null)
    } finally {
      setSibuk(false)
    }
  }

  async function simpan() {
    setSibuk(true)
    setPesan(null)
    try {
      const hasil = await simpanBarang({
        data: {
          id: barang?.id,
          nama,
          kategoriId,
          jumlah,
          kondisi: kondisi as (typeof KONDISI)[number],
          lokasi,
          deskripsi,
        },
      })
      if (!hasil.ok) {
        setPesan(hasil.pesan)
        return
      }
      await router.navigate({ to: '/admin/barang' })
    } catch {
      // A rejected call reports nothing through `hasil` — the validator refusing a field,
      // an expired session, a dropped connection. Without this the button reads
      // "Menyimpan…" for good.
      setPesan('Barang gagal disimpan. Coba lagi.')
    } finally {
      setSibuk(false)
    }
  }

  async function hapus() {
    if (!barang) return
    setSibuk(true)
    setPesan(null)
    try {
      const hasil = await hapusBarang({ data: { id: barang.id } })
      if (!hasil.ok) {
        setPesan(hasil.pesan)
        return
      }
      await router.navigate({ to: '/admin/barang' })
    } catch {
      setPesan('Barang gagal dihapus. Coba lagi.')
    } finally {
      setSibuk(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ to: '/admin/barang', label: 'Kembali ke inventaris' }}
        title={baru ? 'Barang Baru' : `Ubah ${barang.nama}`}
      />

      {pesan ? (
        <p
          role="alert"
          className="rounded-md bg-error-container px-4 py-3 text-sm font-semibold text-error"
        >
          {pesan}
        </p>
      ) : null}

      <Card className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama barang">
            <input
              maxLength={120}
              className={inputCls}
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
          </Field>
          <Field label="Kategori">
            <select
              className={inputCls}
              value={kategoriId}
              onChange={(e) => setKategoriId(e.target.value)}
            >
              {kategori.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Jumlah unit" hint="Jumlah total yang dimiliki HMTI.">
            <input
              type="number"
              min={0}
              max={9999}
              className={inputCls}
              value={jumlah}
              onChange={(e) =>
                setJumlah(Math.max(0, Number(e.target.value) || 0))
              }
            />
          </Field>
          <Field label="Kondisi">
            <select
              className={inputCls}
              value={kondisi}
              onChange={(e) => setKondisi(e.target.value)}
            >
              {KONDISI.map((k) => (
                <option key={k} value={k}>
                  {k.replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Lokasi penyimpanan">
            <input
              maxLength={120}
              className={inputCls}
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Deskripsi">
          <textarea
            maxLength={1000}
            className={`${inputCls} min-h-24`}
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
          />
        </Field>

        {!baru ? (
          <Field label="Foto barang">
            <UnggahBerkas
              accept="image/jpeg,image/png,image/webp"
              petunjuk="JPG, PNG, atau WebP, maksimal 2 MB."
              file={fotoBaru}
              onPilih={(f) => void simpanFoto(f)}
              sibuk={sibuk}
              gambarTersimpan={
                barang.fotoPath ? `/api/foto/${barang.id}` : null
              }
              kamera
            />
          </Field>
        ) : null}
      </Card>

      <div className="flex flex-wrap justify-between gap-2">
        <div>
          {!baru ? (
            <TombolBahaya disabled={sibuk} onClick={() => void hapus()}>
              Hapus barang
            </TombolBahaya>
          ) : null}
        </div>
        <div className="flex gap-2">
          <TombolSekunder
            onClick={() => void router.navigate({ to: '/admin/barang' })}
          >
            Batal
          </TombolSekunder>
          <TombolUtama
            disabled={sibuk || nama.trim().length < 2 || !kategoriId}
            onClick={() => void simpan()}
          >
            {sibuk ? 'Menyimpan…' : 'Simpan'}
          </TombolUtama>
        </div>
      </div>
    </div>
  )
}
