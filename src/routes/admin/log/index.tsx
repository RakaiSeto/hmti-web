import { createFileRoute } from '@tanstack/react-router'
import { hanyaAdmin } from '../../../lib/routeGuards'
import { useState } from 'react'

import { labelAksi, labelEntitas } from '../../../domain/labels'
import { formatWaktu } from '../../../lib/dates'
import { daftarLog, daftarPengguna } from '../../../server/admin'
import {
  BarisTabel,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  Sel,
  inputCls,
} from '../../../components/ui'

export const Route = createFileRoute('/admin/log/')({
  beforeLoad: hanyaAdmin,
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    pengguna?: string
    dari?: string
    sampai?: string
    halaman?: number
  } => ({
    pengguna: typeof s.pengguna === 'string' ? s.pengguna : undefined,
    dari: typeof s.dari === 'string' ? s.dari : undefined,
    sampai: typeof s.sampai === 'string' ? s.sampai : undefined,
    halaman: Number(s.halaman) > 0 ? Number(s.halaman) : undefined,
  }),
  loaderDeps: ({ search }) => ({
    penggunaId: search.pengguna ?? '',
    dari: search.dari ?? '',
    sampai: search.sampai ?? '',
    halaman: search.halaman ?? 1,
  }),
  loader: async ({ deps }) => ({
    log: await daftarLog({ data: deps }),
    pengguna: await daftarPengguna(),
  }),
  component: LogAktivitas,
})

/**
 * 17 · Log Aktivitas Pengguna (FR21). Admin only, read-only, paginated.
 *
 * There is no edit or delete affordance anywhere on this page, and no server function
 * exists that could provide one — the requirement is that the log cannot be changed from
 * the UI, so the absence is the feature.
 */
function LogAktivitas() {
  const { log, pengguna } = Route.useLoaderData()
  const search = Route.useSearch()
  const [dari, setDari] = useState(search.dari ?? '')
  const [sampai, setSampai] = useState(search.sampai ?? '')

  const totalHalaman = Math.max(1, Math.ceil(log.total / log.perHalaman))
  const qs = (over: Record<string, string | number>) => {
    const p = new URLSearchParams({
      pengguna: search.pengguna ?? '',
      dari,
      sampai,
      halaman: String(search.halaman ?? 1),
      ...Object.fromEntries(
        Object.entries(over).map(([k, v]) => [k, String(v)]),
      ),
    })
    return `/admin/log?${p}`
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Log Aktivitas Pengguna"
        subtitle="Catatan tindakan pengurus. Tidak dapat diubah atau dihapus."
      />

      <Card className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-neutral-bold">
          Pengguna
          <select
            className={inputCls}
            value={search.pengguna ?? ''}
            onChange={(e) => {
              window.location.href = qs({
                pengguna: e.target.value,
                halaman: 1,
              })
            }}
          >
            <option value="">Semua pengguna</option>
            {pengguna.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nama}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-neutral-bold">
          Dari tanggal
          <input
            type="date"
            className={inputCls}
            value={dari}
            onChange={(e) => setDari(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-neutral-bold">
          Sampai tanggal
          <input
            type="date"
            className={inputCls}
            value={sampai}
            onChange={(e) => setSampai(e.target.value)}
          />
        </label>
        <a
          href={qs({ dari, sampai, halaman: 1 })}
          className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink no-underline"
        >
          Terapkan
        </a>
      </Card>

      {log.rows.length === 0 ? (
        <EmptyState
          title="Belum ada aktivitas"
          body="Tidak ada catatan pada filter ini."
        />
      ) : (
        <DataTable head={['Waktu', 'Pengguna', 'Aksi', 'Entitas']}>
          {log.rows.map((r) => (
            <BarisTabel key={r.id}>
              <Sel className="whitespace-nowrap text-xs text-text-soft">
                {formatWaktu(r.waktu)}
              </Sel>
              <Sel className="font-semibold text-neutral-intense">
                {r.pengguna}
              </Sel>
              <Sel className="text-xs">{labelAksi(r.aksi)}</Sel>
              <Sel className="text-xs">
                {labelEntitas(r.entitas)}
                {r.entitasId ? (
                  <span className="ml-2 font-mono text-text-disabled">
                    {r.entitasId.slice(0, 8)}
                  </span>
                ) : null}
              </Sel>
            </BarisTabel>
          ))}
        </DataTable>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-text-soft">
          {log.total} catatan · halaman {log.halaman} dari {totalHalaman}
        </p>
        <div className="flex gap-2">
          {log.halaman > 1 ? (
            <a
              href={qs({ halaman: log.halaman - 1 })}
              className="rounded-md border border-neutral-soft px-3 py-2 text-sm font-semibold text-neutral-intense no-underline"
            >
              Sebelumnya
            </a>
          ) : null}
          {log.halaman < totalHalaman ? (
            <a
              href={qs({ halaman: log.halaman + 1 })}
              className="rounded-md border border-neutral-soft px-3 py-2 text-sm font-semibold text-neutral-intense no-underline"
            >
              Berikutnya
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}
