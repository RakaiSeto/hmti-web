import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { STATUS_PENGAJUAN } from '../../../db/schema'
import { formatTanggal } from '../../../lib/dates'
import { keCsv } from '../../../lib/csv'
import { laporanPeminjaman, rekapStok } from '../../../server/admin'
import { StatusBadge } from '../../../components/StatusBadge'
import {
  BarisTabel,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  Sel,
  TombolSekunder,
  TombolUtama,
  inputCls,
} from '../../../components/ui'

export const Route = createFileRoute('/admin/laporan/')({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    dari?: string
    sampai?: string
    status?: string
    tab?: string
  } => ({
    dari: typeof s.dari === 'string' ? s.dari : undefined,
    sampai: typeof s.sampai === 'string' ? s.sampai : undefined,
    status: typeof s.status === 'string' ? s.status : undefined,
    tab: typeof s.tab === 'string' ? s.tab : undefined,
  }),
  loaderDeps: ({ search }) => ({
    dari: search.dari ?? '',
    sampai: search.sampai ?? '',
    status: search.status ?? 'semua',
    tab: search.tab ?? 'riwayat',
  }),
  loader: async ({ deps }) => ({
    riwayat: await laporanPeminjaman({
      data: { dari: deps.dari, sampai: deps.sampai, status: deps.status },
    }),
    stok: deps.tab === 'stok' ? await rekapStok() : [],
  }),
  component: Laporan,
})

/**
 * 15 · Laporan (FR18). Both roles.
 *
 * Export is CSV (UTF-8 with BOM) plus print-to-PDF, not XLSX: it needs no dependency, and
 * the BOM is what stops Excel mangling Indonesian characters (decisions.md D14).
 */
function Laporan() {
  const { riwayat, stok } = Route.useLoaderData()
  const search = Route.useSearch()
  const [dari, setDari] = useState(search.dari ?? '')
  const [sampai, setSampai] = useState(search.sampai ?? '')

  const tab = search.tab === 'stok' ? 'stok' : 'riwayat'

  function unduhRiwayat() {
    const csv = keCsv(
      [
        'Kode',
        'Organisasi',
        'Penanggung jawab',
        'Pinjam',
        'Kembali',
        'Keperluan',
        'Barang',
        'Status',
      ],
      riwayat.map((r) => [
        r.kode,
        r.organisasi,
        r.penanggungJawab,
        r.tglPinjam,
        r.tglKembali,
        r.keperluan,
        r.barang,
        r.status,
      ]),
    )
    unduh(csv, `laporan-peminjaman-${Date.now()}.csv`)
  }

  function unduhStok() {
    const csv = keCsv(
      [
        'Barang',
        'Kategori',
        'Jumlah',
        'Kondisi',
        'Sedang dipinjam',
        'Rusak/hilang',
      ],
      stok.map((s) => [
        s.nama,
        s.kategori,
        s.jumlah,
        s.kondisi,
        s.sedangDipinjam,
        s.rusakHilang,
      ]),
    )
    unduh(csv, `rekap-stok-${Date.now()}.csv`)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Laporan"
        subtitle="Riwayat peminjaman dan rekap stok."
        actions={
          <>
            <TombolSekunder onClick={() => window.print()}>
              Cetak PDF
            </TombolSekunder>
            <TombolUtama onClick={tab === 'stok' ? unduhStok : unduhRiwayat}>
              Unduh CSV
            </TombolUtama>
          </>
        }
      />

      <Card className="flex flex-wrap gap-2">
        <a
          href="/admin/laporan?tab=riwayat"
          className={`rounded-full border px-3 py-1.5 text-sm font-semibold no-underline ${
            tab === 'riwayat'
              ? 'border-accent bg-accent text-white'
              : 'border-neutral-soft bg-surface text-text-soft'
          }`}
        >
          Riwayat Peminjaman
        </a>
        <a
          href="/admin/laporan?tab=stok"
          className={`rounded-full border px-3 py-1.5 text-sm font-semibold no-underline ${
            tab === 'stok'
              ? 'border-accent bg-accent text-white'
              : 'border-neutral-soft bg-surface text-text-soft'
          }`}
        >
          Rekap Stok
        </a>
      </Card>

      {tab === 'riwayat' ? (
        <>
          <Card className="flex flex-wrap items-end gap-2">
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
              href={`/admin/laporan?tab=riwayat&dari=${dari}&sampai=${sampai}&status=${search.status}`}
              className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink no-underline"
            >
              Terapkan
            </a>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-neutral-bold">
              Status
              <select
                className={inputCls}
                value={search.status}
                onChange={(e) => {
                  window.location.href = `/admin/laporan?tab=riwayat&dari=${dari}&sampai=${sampai}&status=${e.target.value}`
                }}
              >
                <option value="semua">Semua</option>
                {STATUS_PENGAJUAN.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </Card>

          {riwayat.length === 0 ? (
            <EmptyState
              title="Tidak ada data"
              body="Tidak ada pengajuan pada rentang ini."
            />
          ) : (
            <DataTable
              head={['Kode', 'Organisasi', 'Periode', 'Barang', 'Status']}
            >
              {riwayat.map((r) => (
                <BarisTabel key={r.kode}>
                  <Sel className="font-mono text-xs font-semibold">
                    {r.kode}
                  </Sel>
                  <Sel>
                    <span className="font-semibold text-neutral-intense">
                      {r.organisasi}
                    </span>
                    <span className="block text-xs text-text-soft">
                      {r.penanggungJawab}
                    </span>
                  </Sel>
                  <Sel className="whitespace-nowrap text-xs">
                    {formatTanggal(r.tglPinjam)} → {formatTanggal(r.tglKembali)}
                  </Sel>
                  <Sel className="text-xs">{r.barang}</Sel>
                  <Sel>
                    <StatusBadge status={r.status as never} />
                  </Sel>
                </BarisTabel>
              ))}
            </DataTable>
          )}
          <p className="text-xs text-text-soft">
            {riwayat.length} baris. Diekspor sebagai CSV dengan pemisah titik
            koma.
          </p>
        </>
      ) : (
        <>
          <DataTable
            head={[
              'Barang',
              'Kategori',
              'Jumlah',
              'Kondisi',
              'Dipinjam',
              'Rusak/hilang',
            ]}
          >
            {stok.map((s) => (
              <BarisTabel key={s.id}>
                <Sel className="font-semibold text-neutral-intense">
                  {s.nama}
                </Sel>
                <Sel className="text-xs">{s.kategori}</Sel>
                <Sel>{s.jumlah}</Sel>
                <Sel className="text-xs">{s.kondisi.replace('_', ' ')}</Sel>
                <Sel>{s.sedangDipinjam}</Sel>
                <Sel
                  className={
                    s.rusakHilang > 0 ? 'font-semibold text-error' : ''
                  }
                >
                  {s.rusakHilang}
                </Sel>
              </BarisTabel>
            ))}
          </DataTable>
          <p className="text-xs text-text-soft">
            "Rusak/hilang" dihitung dari catatan pengembalian (BR05), bukan dari
            jumlah stok saat ini.
          </p>
        </>
      )}
    </div>
  )
}

/** Trigger a client-side download of a string as a file. */
function unduh(isi: string, nama: string) {
  // The BOM is what makes Excel read this as UTF-8 rather than the system codepage.
  const blob = new Blob(['\uFEFF' + isi], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nama
  a.click()
  URL.revokeObjectURL(url)
}
