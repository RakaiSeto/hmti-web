import { createFileRoute, redirect } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { AdminShell } from '../components/admin/AdminShell'
import { env } from 'cloudflare:workers'
import { ambilSesi } from '../server/sesi'

/** The sidebar's live badge count. */
const jumlahPermintaanBaru = createServerFn({ method: 'GET' }).handler(
  async (): Promise<number> => {
    const row = await env.DB.prepare(
      `SELECT COUNT(*) AS c FROM pengajuan WHERE status = 'Diajukan'`,
    ).first<{ c: number }>()
    return row?.c ?? 0
  },
)

export const Route = createFileRoute('/admin')({
  // Every staff route sits under this layout, so the auth check happens once here
  // rather than being repeated (and eventually forgotten) in each child route.
  beforeLoad: async () => {
    const sesi = await ambilSesi()
    if (!sesi) throw redirect({ to: '/masuk' })
    return { sesi }
  },
  loader: async () => ({ permintaanBaru: await jumlahPermintaanBaru() }),
  component: AdminLayout,
  errorComponent: AdminError,
})

/**
 * A refused guard is an expected outcome, not a crash.
 *
 * `butuhAdmin()` throws for a PJ who reaches an admin-only surface — by typing the URL,
 * since the sidebar does not link there. Rendering that as a 500 would be both alarming
 * and unhelpful, so it becomes a plain explanation with a way back.
 */
function AdminError({ error }: ErrorComponentProps) {
  const sesi = Route.useRouteContext().sesi
  // `error` is `unknown` from the router. The guard's refusal is identified by name, so a
  // genuine crash is never silently relabelled as a permissions problem.
  const pesan = error instanceof Error ? error.message : ''
  const nama = error instanceof Error ? error.name : ''
  const ditolak = nama === 'TidakBerwenang' || /berwenang|akses/i.test(pesan)

  return (
    <AdminShell peran={sesi.peran} nama={sesi.nama} jumlahPermintaanBaru={0}>
      <div className="flex flex-col items-start gap-3 rounded-xl bg-surface p-8 shadow-card">
        <h1 className="text-xl font-bold text-neutral-intense">
          {ditolak ? 'Tidak berwenang' : 'Terjadi kesalahan'}
        </h1>
        <p className="max-w-lg text-sm text-text-soft">
          {ditolak
            ? 'Halaman ini hanya untuk admin. Akun PJ Inventaris tidak memiliki akses ke pengelolaan barang, kategori, akun pengurus, dan log aktivitas.'
            : 'Halaman ini gagal dimuat. Coba muat ulang; jika masih gagal, hubungi admin.'}
        </p>
        <a
          href="/admin/dasbor"
          className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink no-underline"
        >
          Kembali ke dasbor
        </a>
      </div>
    </AdminShell>
  )
}

function AdminLayout() {
  const { sesi } = Route.useRouteContext()
  const { permintaanBaru } = Route.useLoaderData()

  return (
    <AdminShell
      peran={sesi.peran}
      nama={sesi.nama}
      jumlahPermintaanBaru={permintaanBaru}
    />
  )
}
