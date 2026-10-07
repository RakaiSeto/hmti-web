import { createFileRoute, useRouter } from '@tanstack/react-router'
import { hanyaAdmin } from '../../../lib/routeGuards'
import { useState } from 'react'

import { PERAN } from '../../../db/schema'
import { formatWaktu } from '../../../lib/dates'
import {
  daftarPengguna,
  hapusPengguna,
  simpanPengguna,
} from '../../../server/admin'
import { LABEL_PERAN, labelPeran } from '../../../components/admin/nav'
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

export const Route = createFileRoute('/admin/pengguna/')({
  beforeLoad: hanyaAdmin,
  loader: () => daftarPengguna(),
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
  const rows = Route.useLoaderData()
  const router = useRouter()
  const [form, setForm] = useState<{
    id?: string
    nama: string
    email: string
    peran: string
    sandi: string
  } | null>(null)
  const [pesan, setPesan] = useState<string | null>(null)
  const [sibuk, setSibuk] = useState(false)

  async function simpan() {
    if (!form) return
    setSibuk(true)
    setPesan(null)
    const hasil = await simpanPengguna({
      data: {
        id: form.id,
        nama: form.nama,
        email: form.email,
        peran: form.peran as (typeof PERAN)[number],
        sandi: form.sandi || undefined,
      },
    })
    setSibuk(false)
    if (!hasil.ok) {
      setPesan(hasil.pesan)
      return
    }
    setForm(null)
    await router.invalidate()
  }

  async function hapus(id: string) {
    setSibuk(true)
    setPesan(null)
    const hasil = await hapusPengguna({ data: { id } })
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
            <TombolUtama disabled={sibuk} onClick={() => void simpan()}>
              {sibuk ? 'Menyimpan…' : 'Simpan'}
            </TombolUtama>
          </div>
        </Card>
      ) : null}

      <DataTable head={['Nama', 'Email', 'Peran', 'Dibuat', '']}>
        {rows.map((u) => (
          <BarisTabel key={u.id}>
            <Sel className="font-semibold text-neutral-intense">{u.nama}</Sel>
            <Sel className="text-xs">{u.email}</Sel>
            <Sel>
              <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-semibold text-text-soft">
                {labelPeran(u.peran)}
              </span>
            </Sel>
            <Sel className="text-xs text-text-soft">
              {formatWaktu(u.createdAt)}
            </Sel>
            <Sel className="whitespace-nowrap">
              <button
                type="button"
                className="text-sm font-semibold text-accent hover:underline"
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
              </button>
              <span className="mx-2 text-text-disabled">·</span>
              <button
                type="button"
                className="text-sm font-semibold text-error hover:underline"
                disabled={sibuk}
                onClick={() => void hapus(u.id)}
              >
                Hapus
              </button>
            </Sel>
          </BarisTabel>
        ))}
      </DataTable>

      <p className="text-xs text-text-soft">
        Akun admin pertama dibuat saat sistem dipasang. Anda tidak dapat
        menurunkan atau menghapus akun Anda sendiri, dan akun admin terakhir
        tidak dapat dihapus.
      </p>
    </div>
  )
}
