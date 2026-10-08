import { createFileRoute } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'

import { STATUS_PENGAJUAN } from '../../../db/schema'
import { formatTanggal } from '../../../lib/dates'
import { keCsv } from '../../../lib/csv'
import {
  eksporPeminjaman,
  eksporStok,
  laporanPeminjaman,
  rekapStok,
} from '../../../server/admin'
import type { BarisLaporan, BarisStok } from '../../../server/admin'
import { daftarKategoriRef } from '../../../server/barang'
import { StatusBadge } from '../../../components/StatusBadge'
import { TabelData } from '../../../components/TabelData'
import {
  KotakCari,
  PageHeader,
  TombolSekunder,
  TombolUtama,
  inputCls,
} from '../../../components/ui'
import type { ArahUrut } from '../../../lib/tabel'
import { PER_HALAMAN } from '../../../lib/tabel'
import { useDaftar } from '../../../lib/useDaftar'

interface ParamsRiwayat {
  dari: string
  sampai: string
  status: string
  q: string
  sort: string
  dir: ArahUrut
  halaman: number
  perHalaman: number
}

interface ParamsStok {
  q: string
  kategoriId: string
  sort: string
  dir: ArahUrut
  halaman: number
  perHalaman: number
}

const AWAL_RIWAYAT: ParamsRiwayat = {
  dari: '',
  sampai: '',
  status: 'semua',
  q: '',
  sort: '',
  dir: 'asc',
  halaman: 1,
  perHalaman: PER_HALAMAN,
}

const AWAL_STOK: ParamsStok = {
  q: '',
  kategoriId: '',
  sort: '',
  dir: 'asc',
  halaman: 1,
  perHalaman: PER_HALAMAN,
}

export const Route = createFileRoute('/admin/laporan/')({
  loader: async () => ({
    riwayat: await laporanPeminjaman({ data: AWAL_RIWAYAT }),
    stok: await rekapStok({ data: AWAL_STOK }),
    kategori: await daftarKategoriRef(),
  }),
  component: Laporan,
})

/**
 * 15 · Laporan (FR18). Both roles.
 *
 * Export is CSV (UTF-8 with BOM) plus print-to-PDF, not XLSX: it needs no dependency, and
 * the BOM is what stops Excel mangling Indonesian characters (decisions.md D14). The
 * table shows one page; the export calls a separate unpaginated function so the file
 * always holds every filtered row.
 */
function Laporan() {
  const awal = Route.useLoaderData()
  const [tab, setTab] = useState<'riwayat' | 'stok'>('riwayat')
  const riwayat = useDaftar(laporanPeminjaman, awal.riwayat, AWAL_RIWAYAT)
  const stok = useDaftar(rekapStok, awal.stok, AWAL_STOK)

  async function unduhRiwayat() {
    const semua = await eksporPeminjaman({
      data: {
        dari: riwayat.params.dari,
        sampai: riwayat.params.sampai,
        status: riwayat.params.status,
        q: riwayat.params.q,
      },
    })
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
      semua.map((r) => [
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

  async function unduhStok() {
    const semua = await eksporStok({
      data: { q: stok.params.q, kategoriId: stok.params.kategoriId },
    })
    const csv = keCsv(
      [
        'Barang',
        'Kategori',
        'Jumlah',
        'Kondisi',
        'Sedang dipinjam',
        'Rusak/hilang',
      ],
      semua.map((s) => [
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

  const kolomRiwayat: ColumnDef<BarisLaporan, unknown>[] = [
    {
      id: 'kode',
      accessorFn: (r) => r.kode,
      header: 'Kode',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold whitespace-nowrap">
          {row.original.kode}
        </span>
      ),
    },
    {
      id: 'organisasi',
      accessorFn: (r) => r.organisasi,
      header: 'Organisasi',
      cell: ({ row }) => (
        <>
          <span className="font-semibold text-neutral-intense">
            {row.original.organisasi}
          </span>
          <span className="block text-sm font-medium text-text-soft">
            {row.original.penanggungJawab}
          </span>
        </>
      ),
    },
    {
      id: 'pinjam',
      accessorFn: (r) => r.tglPinjam,
      header: 'Periode',
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm">
          {formatTanggal(row.original.tglPinjam)} →{' '}
          {formatTanggal(row.original.tglKembali)}
        </span>
      ),
    },
    {
      id: 'barang',
      header: 'Barang',
      enableSorting: false,
      cell: ({ row }) => <span className="text-sm">{row.original.barang}</span>,
    },
    {
      id: 'status',
      accessorFn: (r) => r.status,
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status as never} />,
    },
  ]

  const kolomStok: ColumnDef<BarisStok, unknown>[] = [
    {
      id: 'nama',
      accessorFn: (s) => s.nama,
      header: 'Barang',
      cell: ({ row }) => (
        <span className="font-semibold text-neutral-intense">
          {row.original.nama}
        </span>
      ),
    },
    {
      id: 'kategori',
      accessorFn: (s) => s.kategori,
      header: 'Kategori',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.kategori}</span>
      ),
    },
    {
      id: 'jumlah',
      accessorFn: (s) => s.jumlah,
      header: 'Jumlah',
      cell: ({ row }) => row.original.jumlah,
    },
    {
      id: 'kondisi',
      accessorFn: (s) => s.kondisi,
      header: 'Kondisi',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.kondisi.replace('_', ' ')}
        </span>
      ),
    },
    {
      id: 'dipinjam',
      accessorFn: (s) => s.sedangDipinjam,
      header: 'Dipinjam',
      cell: ({ row }) => row.original.sedangDipinjam,
    },
    {
      id: 'rusak',
      accessorFn: (s) => s.rusakHilang,
      header: 'Rusak/hilang',
      cell: ({ row }) => (
        <span
          className={
            row.original.rusakHilang > 0 ? 'font-semibold text-error' : ''
          }
        >
          {row.original.rusakHilang}
        </span>
      ),
    },
  ]

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
            <TombolUtama
              onClick={() =>
                void (tab === 'stok' ? unduhStok() : unduhRiwayat())
              }
            >
              Unduh CSV
            </TombolUtama>
          </>
        }
      />

      {tab === 'riwayat' ? (
        <>
          <TabelData
            columns={kolomRiwayat}
            data={riwayat.hasil.rows}
            total={riwayat.hasil.total}
            totalSemua={riwayat.hasil.totalSemua}
            perHalaman={riwayat.hasil.perHalaman}
            halaman={riwayat.hasil.halaman}
            sort={riwayat.params.sort}
            dir={riwayat.params.dir}
            sibuk={riwayat.sibuk}
            onSort={(sort, dir) =>
              riwayat.muat({
                ...riwayat.params,
                sort: sort ?? '',
                dir,
                halaman: 1,
              })
            }
            onHalaman={(h) => riwayat.muat({ ...riwayat.params, halaman: h })}
            onPerHalaman={(n) =>
              riwayat.muat({
                ...riwayat.params,
                perHalaman: n,
                halaman: 1,
              })
            }
            kosong={{
              title: 'Tidak ada data',
              body: 'Tidak ada pengajuan pada filter ini.',
            }}
            toolbar={
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTab('riwayat')}
                    className="rounded-full border border-accent bg-accent px-3 py-1.5 text-sm font-semibold text-white"
                  >
                    Riwayat Peminjaman
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('stok')}
                    className="rounded-full border border-neutral-soft bg-surface px-3 py-1.5 text-sm font-semibold text-text-soft"
                  >
                    Rekap Stok
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <KotakCari
                    nilai={riwayat.params.q}
                    onCari={(q) =>
                      riwayat.muat({ ...riwayat.params, q, halaman: 1 })
                    }
                    placeholder="Cari kode, organisasi, atau penanggung jawab…"
                    className="min-w-56 flex-1"
                  />
                  <input
                    type="date"
                    aria-label="Dari tanggal"
                    className={inputCls}
                    value={riwayat.params.dari}
                    onChange={(e) =>
                      riwayat.muat({
                        ...riwayat.params,
                        dari: e.target.value,
                        halaman: 1,
                      })
                    }
                  />
                  <input
                    type="date"
                    aria-label="Sampai tanggal"
                    className={inputCls}
                    value={riwayat.params.sampai}
                    onChange={(e) =>
                      riwayat.muat({
                        ...riwayat.params,
                        sampai: e.target.value,
                        halaman: 1,
                      })
                    }
                  />
                  <select
                    aria-label="Status"
                    className={inputCls}
                    value={riwayat.params.status}
                    onChange={(e) =>
                      riwayat.muat({
                        ...riwayat.params,
                        status: e.target.value,
                        halaman: 1,
                      })
                    }
                  >
                    <option value="semua">Semua</option>
                    {STATUS_PENGAJUAN.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {riwayat.params.q ||
                  riwayat.params.dari ||
                  riwayat.params.sampai ||
                  riwayat.params.sort ? (
                    <TombolSekunder
                      onClick={() =>
                        riwayat.muat({
                          ...AWAL_RIWAYAT,
                          status: riwayat.params.status,
                        })
                      }
                    >
                      Reset
                    </TombolSekunder>
                  ) : null}
                </div>
              </div>
            }
          />
          <p className="text-xs text-text-soft">
            {riwayat.hasil.total} baris. Diekspor sebagai CSV dengan pemisah
            titik koma.
          </p>
        </>
      ) : (
        <>
          <TabelData
            columns={kolomStok}
            data={stok.hasil.rows}
            total={stok.hasil.total}
            totalSemua={stok.hasil.totalSemua}
            perHalaman={stok.hasil.perHalaman}
            halaman={stok.hasil.halaman}
            sort={stok.params.sort}
            dir={stok.params.dir}
            sibuk={stok.sibuk}
            onSort={(sort, dir) =>
              stok.muat({ ...stok.params, sort: sort ?? '', dir, halaman: 1 })
            }
            onHalaman={(h) => stok.muat({ ...stok.params, halaman: h })}
            onPerHalaman={(n) =>
              stok.muat({ ...stok.params, perHalaman: n, halaman: 1 })
            }
            kosong={{
              title: 'Tidak ada data',
              body: 'Tidak ada barang pada filter ini.',
            }}
            toolbar={
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTab('riwayat')}
                    className="rounded-full border border-neutral-soft bg-surface px-3 py-1.5 text-sm font-semibold text-text-soft"
                  >
                    Riwayat Peminjaman
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('stok')}
                    className="rounded-full border border-accent bg-accent px-3 py-1.5 text-sm font-semibold text-white"
                  >
                    Rekap Stok
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <KotakCari
                    nilai={stok.params.q}
                    onCari={(q) => stok.muat({ ...stok.params, q, halaman: 1 })}
                    placeholder="Cari nama barang atau kategori…"
                    className="min-w-56 flex-1"
                  />
                  <select
                    aria-label="Kategori"
                    className={inputCls}
                    value={stok.params.kategoriId}
                    onChange={(e) =>
                      stok.muat({
                        ...stok.params,
                        kategoriId: e.target.value,
                        halaman: 1,
                      })
                    }
                  >
                    <option value="">Semua kategori</option>
                    {awal.kategori.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                  {stok.params.q ||
                  stok.params.kategoriId ||
                  stok.params.sort ? (
                    <TombolSekunder onClick={() => stok.muat(AWAL_STOK)}>
                      Reset
                    </TombolSekunder>
                  ) : null}
                </div>
              </div>
            }
          />
          <p className="text-xs text-text-soft">
            &quot;Rusak/hilang&quot; dihitung dari catatan pengembalian (BR05),
            bukan dari jumlah stok saat ini.
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
