import { createFileRoute } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { hanyaAdmin } from '../../../lib/routeGuards'
import { useState } from 'react'

import {
  daftarKategori,
  hapusKategori,
  simpanKategori,
} from '../../../server/barang'
import type { BarisKategori } from '../../../server/barang'
import { TabelData } from '../../../components/TabelData'
import {
  Card,
  Field,
  KotakCari,
  PageHeader,
  TombolAksi,
  TombolSekunder,
  TombolUtama,
  inputCls,
} from '../../../components/ui'
import type { ArahUrut } from '../../../lib/tabel'
import { PER_HALAMAN } from '../../../lib/tabel'
import { useDaftar } from '../../../lib/useDaftar'

interface ParamsKategori {
  q: string
  sort: string
  dir: ArahUrut
  halaman: number
  perHalaman: number
}

const AWAL_KATEGORI: ParamsKategori = {
  q: '',
  sort: '',
  dir: 'asc',
  halaman: 1,
  perHalaman: PER_HALAMAN,
}

export const Route = createFileRoute('/admin/kategori/')({
  beforeLoad: hanyaAdmin,
  loader: () => daftarKategori({ data: AWAL_KATEGORI }),
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
  const awal = Route.useLoaderData()
  const { params, hasil, sibuk, muat } = useDaftar(
    daftarKategori,
    awal,
    AWAL_KATEGORI,
  )
  const [nama, setNama] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [pesan, setPesan] = useState<string | null>(null)
  const [sibukSimpan, setSibukSimpan] = useState(false)

  async function simpan() {
    setSibukSimpan(true)
    setPesan(null)
    try {
      const r = await simpanKategori({
        data: { id: editId ?? undefined, nama },
      })
      if (!r.ok) {
        setPesan(r.pesan)
        return
      }
      setNama('')
      setEditId(null)
      muat(params)
    } catch {
      setPesan('Kategori gagal disimpan. Coba lagi.')
    } finally {
      setSibukSimpan(false)
    }
  }

  async function hapus(id: string) {
    setSibukSimpan(true)
    setPesan(null)
    try {
      const r = await hapusKategori({ data: { id } })
      if (!r.ok) {
        setPesan(r.pesan)
        return
      }
      muat(params)
    } catch {
      setPesan('Kategori gagal dihapus. Coba lagi.')
    } finally {
      setSibukSimpan(false)
    }
  }

  const columns: ColumnDef<BarisKategori, unknown>[] = [
    {
      id: 'nama',
      accessorFn: (k) => k.nama,
      header: 'Kategori',
      cell: ({ row }) => (
        <span className="font-semibold text-neutral-intense">
          {row.original.nama}
        </span>
      ),
    },
    {
      id: 'jumlah',
      accessorFn: (k) => k.jumlah_barang,
      header: 'Jumlah barang',
      cell: ({ row }) => `${row.original.jumlah_barang} barang`,
    },
    {
      id: 'aksi',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const k = row.original
        return (
          <span className="flex items-center gap-2 whitespace-nowrap">
            <TombolAksi
              onClick={() => {
                setEditId(k.id)
                setNama(k.nama)
              }}
            >
              Ubah
            </TombolAksi>
            <TombolAksi
              bahaya
              disabled={sibukSimpan}
              onClick={() => void hapus(k.id)}
            >
              Hapus
            </TombolAksi>
          </span>
        )
      },
    },
  ]

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
              maxLength={60}
              className={inputCls}
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="mis. Audio"
            />
          </Field>
        </div>
        <TombolUtama
          disabled={sibukSimpan || nama.trim().length < 2}
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

      <TabelData
        columns={columns}
        data={hasil.rows}
        total={hasil.total}
        totalSemua={hasil.totalSemua}
        perHalaman={hasil.perHalaman}
        halaman={hasil.halaman}
        sort={params.sort}
        dir={params.dir}
        sibuk={sibuk}
        onSort={(sort, dir) =>
          muat({ ...params, sort: sort ?? '', dir, halaman: 1 })
        }
        onHalaman={(h) => muat({ ...params, halaman: h })}
        onPerHalaman={(n) => muat({ ...params, perHalaman: n, halaman: 1 })}
        kosong={{
          title: 'Tidak ada kategori',
          body: 'Tidak ada kategori yang cocok dengan pencarian ini.',
        }}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <KotakCari
              nilai={params.q}
              onCari={(q) => muat({ ...params, q, halaman: 1 })}
              placeholder="Cari nama kategori…"
              className="min-w-56 flex-1"
            />
            {params.q || params.sort ? (
              <TombolSekunder onClick={() => muat(AWAL_KATEGORI)}>
                Reset
              </TombolSekunder>
            ) : null}
          </div>
        }
      />

      <p className="text-xs text-text-soft">
        Kategori yang masih dipakai barang tidak dapat dihapus. Pindahkan
        barangnya ke kategori lain terlebih dahulu.
      </p>
    </div>
  )
}
