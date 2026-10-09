import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { KONDISI_KEMBALI } from '../../../db/schema'
import { formatTanggal } from '../../../lib/dates'
import { detailPengajuan } from '../../../server/pengajuan'
import { catatPengembalian } from '../../../server/siklus'
import { StatusBadge } from '../../../components/StatusBadge'
import { UnggahBerkas } from '../../../components/UnggahBerkas'
import {
  BarisTabel,
  Card,
  DataTable,
  Field,
  PageHeader,
  Sel,
  TombolUtama,
  inputCls,
} from '../../../components/ui'

/** One line's return state, keyed by item id. */
interface BarisKembali {
  kondisi: (typeof KONDISI_KEMBALI)[number]
  jumlah: number
  catatan: string
}

/** The item fields the return form reads — a subset of what the loader hands over. */
interface BarangKembali {
  barang_id: string
  nama: string
  jumlah: number
}

interface BagianBaris {
  barang: BarangKembali
  nilai: BarisKembali
  onUbah: (patch: Partial<BarisKembali>) => void
}

/**
 * The three per-line controls, shared by the desktop table and the mobile cards so the
 * two layouts cannot drift. `w-full md:…` is what makes each one fill its card below `md`
 * and keep its table-sized width above.
 */
function InputJumlah({ barang, nilai, onUbah }: BagianBaris) {
  return (
    <input
      type="number"
      min={1}
      max={barang.jumlah}
      aria-label={`Jumlah kembali ${barang.nama}`}
      className={`${inputCls} w-full md:w-24`}
      value={nilai.jumlah}
      onChange={(e) =>
        onUbah({
          jumlah: Math.min(
            barang.jumlah,
            Math.max(1, Number(e.target.value) || 1),
          ),
        })
      }
    />
  )
}

function PilihKondisi({ barang, nilai, onUbah }: BagianBaris) {
  return (
    <select
      aria-label={`Kondisi ${barang.nama}`}
      className={`${inputCls} w-full md:w-auto`}
      value={nilai.kondisi}
      onChange={(e) =>
        onUbah({ kondisi: e.target.value as (typeof KONDISI_KEMBALI)[number] })
      }
    >
      {KONDISI_KEMBALI.map((k) => (
        <option key={k} value={k}>
          {k}
        </option>
      ))}
    </select>
  )
}

function InputCatatan({ barang, nilai, onUbah }: BagianBaris) {
  return (
    <input
      aria-label={`Catatan ${barang.nama}`}
      maxLength={300}
      className={`${inputCls} w-full`}
      placeholder="—"
      value={nilai.catatan}
      onChange={(e) => onUbah({ catatan: e.target.value })}
    />
  )
}

export const Route = createFileRoute('/admin/pengembalian/$kode')({
  loader: ({ params }) => detailPengajuan({ data: { kode: params.kode } }),
  component: Pengembalian,
})

/**
 * 13 · Pengembalian (FR16, BR05).
 *
 * The page states plainly that rusak/hilang reduces stock, because that consequence is
 * the entire point of BR05 — a return form that silently changed inventory would be the
 * worst version of this screen.
 */
function Pengembalian() {
  const p = Route.useLoaderData()
  const router = useRouter()
  const [catatan, setCatatan] = useState('')
  const [pesan, setPesan] = useState<string | null>(null)
  const [sibuk, setSibuk] = useState(false)
  const [bukti, setBukti] = useState<File | null>(null)
  const [baris, setBaris] = useState<Record<string, BarisKembali>>(
    Object.fromEntries(
      (p?.baris ?? []).map((b) => [
        b.barang_id,
        { kondisi: 'baik' as const, jumlah: b.jumlah, catatan: '' },
      ]),
    ),
  )

  /** Patch one line's state; both the table and the cards go through here. */
  const ubah = (id: string, patch: Partial<BarisKembali>) =>
    setBaris((s) => ({ ...s, [id]: { ...s[id], ...patch } }))

  if (!p) {
    return (
      <PageHeader
        title="Pengajuan tidak ditemukan"
        back={{ to: '/admin/pengembalian', label: 'Kembali' }}
      />
    )
  }

  const adaRusak = Object.values(baris).some((b) => b.kondisi !== 'baik')

  async function kirim() {
    // Checked here as well as on the server so the message lands next to the field the
    // operator is looking at, rather than coming back as a rejected round trip.
    if (!bukti) {
      setPesan('Foto bukti pengembalian wajib diunggah.')
      return
    }
    setSibuk(true)
    setPesan(null)
    // FormData, not an object: the photo cannot cross the server-function boundary as
    // JSON. `items` goes as a JSON string for the same reason it is not a plain field.
    const data = new FormData()
    data.set('kode', p!.kode)
    data.set('catatan', catatan)
    data.set('file', bukti)
    data.set(
      'items',
      JSON.stringify(
        p!.baris.map((b) => ({
          barangId: b.barang_id,
          kondisi: baris[b.barang_id].kondisi,
          jumlah: baris[b.barang_id].jumlah,
          catatan: baris[b.barang_id].catatan,
        })),
      ),
    )
    try {
      const hasil = await catatPengembalian({ data })
      if (!hasil.ok) {
        setPesan(hasil.pesan)
        return
      }
      await router.navigate({
        to: '/admin/permintaan/$kode',
        params: { kode: p!.kode },
      })
    } catch {
      // A rejected call (the validator, a dropped connection) reports nothing through
      // `hasil`; without this the form would just sit there looking busy.
      setPesan('Pengembalian gagal dicatat. Coba lagi.')
    } finally {
      setSibuk(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{
          to: '/admin/pengembalian',
          label: 'Kembali ke daftar pengembalian',
        }}
        title="Pengembalian"
        subtitle={`${p.kode} · ${p.organisasi}`}
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

      <Card className="flex flex-col gap-3">
        <h2 className="text-md font-semibold text-neutral-intense">
          Ringkasan
        </h2>
        <dl className="grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-text-soft">Organisasi</dt>
            <dd className="text-sm font-semibold">{p.organisasi}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-soft">Penanggung jawab</dt>
            <dd className="text-sm font-semibold">{p.penanggungJawab}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-soft">Jatuh tempo</dt>
            <dd
              className={`text-sm font-semibold ${p.terlambat ? 'text-error' : ''}`}
            >
              {formatTanggal(p.tglKembali)}
              {p.terlambat ? ' (terlambat)' : ''}
            </dd>
          </div>
        </dl>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-md font-semibold text-neutral-intense">
          Kondisi barang dikembalikan
        </h2>
        {/* Below `md` this is one card per line: four columns of form controls do not fit a
            phone, and a form you have to scroll sideways is the worst place for it. The
            table stays for `md` and up, sharing the same controls. */}
        <div className="flex flex-col divide-y divide-neutral-soft overflow-hidden rounded-xl bg-surface shadow-card md:hidden">
          {p.baris.map((b) => (
            <div key={b.barang_id} className="flex flex-col gap-3 p-4">
              <p className="min-w-0 text-sm font-semibold text-neutral-intense">
                {b.nama}
                <span className="block text-sm font-normal text-text-soft">
                  dipinjam ×{b.jumlah}
                </span>
              </p>
              <Field label="Jumlah kembali">
                <InputJumlah
                  barang={b}
                  nilai={baris[b.barang_id]}
                  onUbah={(patch) => ubah(b.barang_id, patch)}
                />
              </Field>
              <Field label="Kondisi">
                <PilihKondisi
                  barang={b}
                  nilai={baris[b.barang_id]}
                  onUbah={(patch) => ubah(b.barang_id, patch)}
                />
              </Field>
              <Field label="Catatan">
                <InputCatatan
                  barang={b}
                  nilai={baris[b.barang_id]}
                  onUbah={(patch) => ubah(b.barang_id, patch)}
                />
              </Field>
            </div>
          ))}
        </div>

        <div className="hidden md:block">
          <DataTable head={['Barang', 'Jumlah kembali', 'Kondisi', 'Catatan']}>
            {p.baris.map((b) => (
              <BarisTabel key={b.barang_id}>
                <Sel className="font-semibold">
                  {b.nama}
                  <span className="block text-sm font-normal text-text-soft">
                    dipinjam ×{b.jumlah}
                  </span>
                </Sel>
                <Sel>
                  <InputJumlah
                    barang={b}
                    nilai={baris[b.barang_id]}
                    onUbah={(patch) => ubah(b.barang_id, patch)}
                  />
                </Sel>
                <Sel>
                  <PilihKondisi
                    barang={b}
                    nilai={baris[b.barang_id]}
                    onUbah={(patch) => ubah(b.barang_id, patch)}
                  />
                </Sel>
                <Sel>
                  <InputCatatan
                    barang={b}
                    nilai={baris[b.barang_id]}
                    onUbah={(patch) => ubah(b.barang_id, patch)}
                  />
                </Sel>
              </BarisTabel>
            ))}
          </DataTable>
        </div>
      </div>

      <Card className="flex flex-col gap-3">
        <Field
          label="Foto bukti pengembalian"
          wajib
          hint="Wajib diunggah sebelum pengembalian dicatat."
        >
          <UnggahBerkas
            accept="image/jpeg,image/png,image/webp"
            petunjuk="JPG, PNG, atau WebP, maksimal 8 MB."
            file={bukti}
            onPilih={(f) => {
              setBukti(f)
              setPesan(null)
            }}
            kamera
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-3">
        <Field
          label="Catatan pengembalian"
          hint={
            adaRusak
              ? 'Wajib diisi karena ada barang rusak atau hilang.'
              : 'Opsional.'
          }
        >
          <textarea
            maxLength={500}
            className={`${inputCls} min-h-20`}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />
        </Field>
        {adaRusak ? (
          <p className="rounded-md bg-warning-container px-3 py-2 text-xs font-semibold text-warning">
            Barang rusak atau hilang akan mengurangi jumlah stok barang
            tersebut.
          </p>
        ) : null}
      </Card>

      <div className="flex justify-end gap-2">
        <Link
          to="/admin/pengembalian"
          className="rounded-md border border-neutral-soft px-4 py-2.5 text-sm font-semibold text-neutral-intense no-underline"
        >
          Batal
        </Link>
        <TombolUtama disabled={sibuk} onClick={() => void kirim()}>
          {sibuk ? 'Menyimpan…' : 'Catat pengembalian'}
        </TombolUtama>
      </div>
    </div>
  )
}
