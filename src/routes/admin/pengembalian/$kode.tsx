import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { KONDISI_KEMBALI } from '../../../db/schema'
import { formatTanggal } from '../../../lib/dates'
import { detailPengajuan } from '../../../server/pengajuan'
import { catatPengembalian } from '../../../server/siklus'
import { StatusBadge } from '../../../components/StatusBadge'
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
  const [baris, setBaris] = useState<Record<string, BarisKembali>>(
    Object.fromEntries(
      (p?.baris ?? []).map((b) => [
        b.barang_id,
        { kondisi: 'baik' as const, jumlah: b.jumlah, catatan: '' },
      ]),
    ),
  )

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
    setSibuk(true)
    setPesan(null)
    const hasil = await catatPengembalian({
      data: {
        kode: p!.kode,
        catatan,
        items: p!.baris.map((b) => ({
          barangId: b.barang_id,
          kondisi: baris[b.barang_id].kondisi,
          jumlah: baris[b.barang_id].jumlah,
          catatan: baris[b.barang_id].catatan,
        })),
      },
    })
    setSibuk(false)
    if (!hasil.ok) {
      setPesan(hasil.pesan)
      return
    }
    await router.navigate({
      to: '/admin/permintaan/$kode',
      params: { kode: p!.kode },
    })
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
        <DataTable head={['Barang', 'Jumlah kembali', 'Kondisi', 'Catatan']}>
          {p.baris.map((b) => (
            <BarisTabel key={b.barang_id}>
              <Sel className="font-semibold">
                {b.nama}
                <span className="block text-xs font-normal text-text-soft">
                  dipinjam ×{b.jumlah}
                </span>
              </Sel>
              <Sel>
                <input
                  type="number"
                  min={1}
                  max={b.jumlah}
                  aria-label={`Jumlah kembali ${b.nama}`}
                  className={`${inputCls} w-24`}
                  value={baris[b.barang_id].jumlah}
                  onChange={(e) =>
                    setBaris((s) => ({
                      ...s,
                      [b.barang_id]: {
                        ...s[b.barang_id],
                        jumlah: Math.min(
                          b.jumlah,
                          Math.max(1, Number(e.target.value) || 1),
                        ),
                      },
                    }))
                  }
                />
              </Sel>
              <Sel>
                <select
                  aria-label={`Kondisi ${b.nama}`}
                  className={inputCls}
                  value={baris[b.barang_id].kondisi}
                  onChange={(e) =>
                    setBaris((s) => ({
                      ...s,
                      [b.barang_id]: {
                        ...s[b.barang_id],
                        kondisi: e.target
                          .value as (typeof KONDISI_KEMBALI)[number],
                      },
                    }))
                  }
                >
                  {KONDISI_KEMBALI.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </Sel>
              <Sel>
                <input
                  aria-label={`Catatan ${b.nama}`}
                  className={`${inputCls} w-full`}
                  placeholder="—"
                  value={baris[b.barang_id].catatan}
                  onChange={(e) =>
                    setBaris((s) => ({
                      ...s,
                      [b.barang_id]: {
                        ...s[b.barang_id],
                        catatan: e.target.value,
                      },
                    }))
                  }
                />
              </Sel>
            </BarisTabel>
          ))}
        </DataTable>
      </div>

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
