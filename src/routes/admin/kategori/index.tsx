import { createFileRoute, useRouter } from '@tanstack/react-router'
import { hanyaAdmin } from '../../../lib/routeGuards'
import { useState } from 'react'

import {
  daftarKategori,
  hapusKategori,
  simpanKategori,
} from '../../../server/barang'
import {
  BarisTabel,
  Card,
  DataTable,
  Field,
  PageHeader,
  Sel,
  TombolSekunder,
  TombolUtama,
  inputCls,
} from '../../../components/ui'

export const Route = createFileRoute('/admin/kategori/')({
  beforeLoad: hanyaAdmin,
  loader: () => daftarKategori(),
  component: Kategori,
})

/**
 * 16 · Kategori (FR10). Admin only.
 *
 * The delete rule is enforced server-side and surfaced here: a category still holding
 * items cannot be removed, and the message says how many items are in the way rather
 * than failing silently.
 */
function Kategori() {
  const rows = Route.useLoaderData()
  const router = useRouter()
  const [nama, setNama] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [pesan, setPesan] = useState<string | null>(null)
  const [sibuk, setSibuk] = useState(false)

  async function simpan() {
    setSibuk(true)
    setPesan(null)
    const hasil = await simpanKategori({
      data: { id: editId ?? undefined, nama },
    })
    setSibuk(false)
    if (!hasil.ok) {
      setPesan(hasil.pesan)
      return
    }
    setNama('')
    setEditId(null)
    await router.invalidate()
  }

  async function hapus(id: string) {
    setSibuk(true)
    setPesan(null)
    const hasil = await hapusKategori({ data: { id } })
    setSibuk(false)
    if (!hasil.ok) {
      setPesan(hasil.pesan)
      return
    }
    await router.invalidate()
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Kategori"
        subtitle="Kelompok barang di inventaris HMTI."
      />

      {pesan ? (
        <p
          role="alert"
          className="rounded-md bg-error-container px-4 py-3 text-sm font-semibold text-error"
        >
          {pesan}
        </p>
      ) : null}

      <Card className="flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <Field label={editId ? 'Ubah nama kategori' : 'Kategori baru'}>
            <input
              className={inputCls}
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="mis. Audio"
            />
          </Field>
        </div>
        <TombolUtama
          disabled={sibuk || nama.trim().length < 2}
          onClick={() => void simpan()}
        >
          {editId ? 'Simpan perubahan' : 'Tambah kategori'}
        </TombolUtama>
        {editId ? (
          <TombolSekunder
            onClick={() => {
              setEditId(null)
              setNama('')
            }}
          >
            Batal
          </TombolSekunder>
        ) : null}
      </Card>

      <DataTable head={['Kategori', 'Jumlah barang', '']}>
        {rows.map((k) => (
          <BarisTabel key={k.id}>
            <Sel className="font-semibold text-neutral-intense">{k.nama}</Sel>
            <Sel>{k.jumlah_barang} barang</Sel>
            <Sel className="whitespace-nowrap">
              <button
                type="button"
                className="text-sm font-semibold text-accent hover:underline"
                onClick={() => {
                  setEditId(k.id)
                  setNama(k.nama)
                }}
              >
                Ubah
              </button>
              <span className="mx-2 text-text-disabled">·</span>
              <button
                type="button"
                className="text-sm font-semibold text-error hover:underline"
                disabled={sibuk}
                onClick={() => void hapus(k.id)}
              >
                Hapus
              </button>
            </Sel>
          </BarisTabel>
        ))}
      </DataTable>

      <p className="text-xs text-text-soft">
        Kategori yang masih dipakai barang tidak dapat dihapus. Pindahkan
        barangnya ke kategori lain terlebih dahulu.
      </p>
    </div>
  )
}
