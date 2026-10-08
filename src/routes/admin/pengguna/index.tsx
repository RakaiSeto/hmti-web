import { createFileRoute } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { hanyaAdmin } from '../../../lib/routeGuards'
import { useState } from 'react'

import { PERAN } from '../../../db/schema'
import { formatWaktu } from '../../../lib/dates'
import {
  daftarPengguna,
  hapusPengguna,
  simpanPengguna,
} from '../../../server/admin'
import type { BarisPengguna } from '../../../server/admin'
import { LABEL_PERAN, labelPeran } from '../../../components/admin/nav'
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

interface ParamsPengguna {
  q: string
  peran: string
  sort: string
  dir: ArahUrut
  halaman: number
  perHalaman: number
}

const AWAL_PENGGUNA: ParamsPengguna = {
  q: '',
  peran: '',
  sort: '',
  dir: 'asc',
  halaman: 1,
  perHalaman: PER_HALAMAN,
}

export const Route = createFileRoute('/admin/pengguna/')({
  beforeLoad: hanyaAdmin,
  loader: () => daftarPengguna({ data: AWAL_PENGGUNA }),
  component: Pengguna,
})

/**
 * 18 · Akun PJ Inventaris (FR08). Admin only.
 *
 * The self-lockout guards are surfaced as visible refusals rather than a missing button:
 * an admin cannot demote or delete themselves, and cannot remove the last admin. Without
 * the last-admin rule a mis-click leaves the system unmanageable, and there is no
 * bootstrap path by design.
 */
function Pengguna() {
  const awal = Route.useLoaderData()
  const { params, hasil, sibuk, muat } = useDaftar(
    daftarPengguna,
    awal,
    AWAL_PENGGUNA,
  )
  const [form, setForm] = useState<{
    id?: string
    nama: string
    email: string
    peran: string
    sandi: string
  } | null>(null)
  const [pesan, setPesan] = useState<string | null>(null)
  const [sibukSimpan, setSibukSimpan] = useState(false)

  async function simpan() {
    if (!form) return
    setSibukSimpan(true)
    setPesan(null)
    const r = await simpanPengguna({
      data: {
        id: form.id,
        nama: form.nama,
        email: form.email,
        peran: form.peran as (typeof PERAN)[number],
        sandi: form.sandi || undefined,
      },
    })
    setSibukSimpan(false)
    if (!r.ok) {
      setPesan(r.pesan)
      return
    }
    setForm(null)
    muat(params)
  }

  async function hapus(id: string) {
    setSibukSimpan(true)
    setPesan(null)
    const r = await hapusPengguna({ data: { id } })
    setSibukSimpan(false)
    if (!r.ok) {
      setPesan(r.pesan)
      return
    }
    muat(params)
  }

  const columns: ColumnDef<BarisPengguna, unknown>[] = [
    {
      id: 'nama',
      accessorFn: (u) => u.nama,
      header: 'Nama',
      cell: ({ row }) => (
        <span className="font-semibold text-neutral-intense">
          {row.original.nama}
        </span>
      ),
    },
    {
      id: 'email',
      accessorFn: (u) => u.email,
      header: 'Email',
      cell: ({ row }) => <span className="text-sm">{row.original.email}</span>,
    },
    {
      id: 'peran',
      accessorFn: (u) => u.peran,
      header: 'Peran',
      cell: ({ row }) => (
        <span className="rounded-full bg-surface-container px-2.5 py-1 text-sm font-semibold text-text-soft">
          {labelPeran(row.original.peran)}
        </span>
      ),
    },
    {
      id: 'dibuat',
      accessorFn: (u) => u.createdAt.getTime(),
      header: 'Dibuat',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-text-soft">
          {formatWaktu(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'aksi',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const u = row.original
        return (
          <span className="flex items-center gap-2 whitespace-nowrap">
            <TombolAksi
              onClick={() =>
                setForm({
                  id: u.id,
                  nama: u.nama,
                  email: u.email,
                  peran: u.peran,
                  sandi: '',
                })
              }
            >
              Ubah
            </TombolAksi>
            <TombolAksi
              bahaya
              disabled={sibukSimpan}
              onClick={() => void hapus(u.id)}
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
        title="Akun PJ Inventaris"
        subtitle="Kelola akun pengurus yang dapat mengakses sistem."
        actions={
          <TombolUtama
            onClick={() =>
              setForm({
                nama: '',
                email: '',
                peran: 'pj_inventaris',
                sandi: '',
              })
            }
          >
            Akun baru
          </TombolUtama>
        }
      />

      {pesan ? (
        <p
          role="alert"
          className="rounded-md bg-error-container px-4 py-3 text-sm font-semibold text-error"
        >
          {pesan}
        </p>
      ) : null}

      {form ? (
        <Card className="flex flex-col gap-4">
          <h2 className="text-md font-semibold text-neutral-intense">
            {form.id ? 'Ubah akun' : 'Akun baru'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama">
              <input
                className={inputCls}
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className={inputCls}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Peran">
              <select
                className={inputCls}
                value={form.peran}
                onChange={(e) => setForm({ ...form, peran: e.target.value })}
              >
                {PERAN.map((p) => (
                  <option key={p} value={p}>
                    {LABEL_PERAN[p]}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label={form.id ? 'Kata sandi baru (opsional)' : 'Kata sandi'}
              hint="Minimal 8 karakter. Mengatur ulang sandi akan mengakhiri sesi akun tersebut."
            >
              <input
                type="password"
                autoComplete="new-password"
                className={inputCls}
                value={form.sandi}
                onChange={(e) => setForm({ ...form, sandi: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <TombolSekunder onClick={() => setForm(null)}>Batal</TombolSekunder>
            <TombolUtama disabled={sibukSimpan} onClick={() => void simpan()}>
              {sibukSimpan ? 'Menyimpan…' : 'Simpan'}
            </TombolUtama>
          </div>
        </Card>
      ) : null}

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
          title: 'Tidak ada akun',
          body: 'Tidak ada akun yang cocok dengan filter ini.',
        }}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <KotakCari
              nilai={params.q}
              onCari={(q) => muat({ ...params, q, halaman: 1 })}
              placeholder="Cari nama atau email…"
              className="min-w-56 flex-1"
            />
            <select
              aria-label="Peran"
              className={inputCls}
              value={params.peran}
              onChange={(e) =>
                muat({ ...params, peran: e.target.value, halaman: 1 })
              }
            >
              <option value="">Semua peran</option>
              {PERAN.map((p) => (
                <option key={p} value={p}>
                  {LABEL_PERAN[p]}
                </option>
              ))}
            </select>
            {params.q || params.peran || params.sort ? (
              <TombolSekunder onClick={() => muat(AWAL_PENGGUNA)}>
                Reset
              </TombolSekunder>
            ) : null}
          </div>
        }
      />

      <p className="text-xs text-text-soft">
        Akun admin pertama dibuat saat sistem dipasang. Anda tidak dapat
        menurunkan atau menghapus akun Anda sendiri, dan akun admin terakhir
        tidak dapat dihapus.
      </p>
    </div>
  )
}
