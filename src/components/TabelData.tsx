/**
 * The list table, driven by TanStack Table v8 in manual (server-side) mode.
 *
 * Every admin list is paginated, sorted and filtered in SQL — the route's params state is
 * the source of truth — so the table is told `manualPagination`/`manualSorting` and given
 * `rowCount`; it never re-sorts or re-slices the rows it is handed. What the library owns
 * here is the column model, the sort toggle cycle, and the page-index state.
 *
 * The whole list is one surface: the `toolbar` (search, filters) sits on top, the table in
 * the middle, and the pager — page size, a page-number field, prev/next — is the card's
 * footer.
 *
 * A column's `id` is its server sort key (e.g. `id: 'nama'` for `?sort=nama`). Columns
 * without an accessor are display-only and render no sort control — TanStack's
 * `getCanSort` requires an `accessorFn`, so a sortable column must carry one even though
 * the cell body reads `row.original` directly.
 */
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type {
  ColumnDef,
  PaginationState,
  SortingState,
  Updater,
} from '@tanstack/react-table'
import { useEffect, useState } from 'react'

import type { ArahUrut } from '../lib/tabel'
import { UKURAN_HALAMAN } from '../lib/tabel'
import { SEL_TABEL } from './ui'

export interface TabelDataProps<T> {
  columns: ColumnDef<T, unknown>[]
  data: T[]
  /** Total rows across every page, from the server's COUNT. */
  total: number
  /** Rows in the whole table, ignoring filters — the "y" in "x dari y". */
  totalSemua: number
  perHalaman: number
  /** 1-based page number, from the list params. */
  halaman: number
  sort?: string
  dir?: ArahUrut
  /** A header was clicked: the new sort key and direction, already toggled by the table. */
  onSort: (sort: string | undefined, dir: ArahUrut) => void
  /** The pager moved: the new 1-based page number. */
  onHalaman: (halaman: number) => void
  /** A new page size was picked. */
  onPerHalaman: (perHalaman: number) => void
  /** Search/filter controls, rendered inside the card above the table. */
  toolbar?: React.ReactNode
  /** Shown in place of the rows when there is nothing to render. */
  kosong?: { title: string; body: string }
  /** A refetch is in flight: dim the rows without unmounting them. */
  sibuk?: boolean
}

const TOMBOL =
  'min-w-9 rounded-md border border-neutral-soft px-2.5 py-1.5 text-sm font-semibold text-neutral-intense disabled:cursor-not-allowed disabled:opacity-40'

const PILIH =
  'rounded-md border border-neutral-soft bg-surface-container px-2 py-1 text-xs font-normal text-text outline-none focus:border-accent'

export function TabelData<T>({
  columns,
  data,
  total,
  totalSemua,
  perHalaman,
  halaman,
  sort,
  dir,
  onSort,
  onHalaman,
  onPerHalaman,
  toolbar,
  kosong,
  sibuk = false,
}: TabelDataProps<T>) {
  const sorting: SortingState = sort ? [{ id: sort, desc: dir === 'desc' }] : []
  const pagination: PaginationState = {
    pageIndex: Math.max(0, halaman - 1),
    pageSize: perHalaman,
  }

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    rowCount: total,
    // Clicking a sorted header must flip asc→desc→asc, never drop to unsorted, because
    // the server always needs a key to order by.
    enableSortingRemoval: false,
    onSortingChange: (updater: Updater<SortingState>) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      const aktif = next.at(0)
      onSort(aktif?.id, aktif?.desc ? 'desc' : 'asc')
    },
    onPaginationChange: (updater: Updater<PaginationState>) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater
      onHalaman(next.pageIndex + 1)
    },
  })

  const jumlahHalaman = Math.max(1, table.getPageCount())
  const halamanAktif = table.getState().pagination.pageIndex + 1

  // The page field is editable text; it follows the real page whenever that changes, so a
  // typed-but-unsubmitted value never sticks around after a navigation.
  const [teksHalaman, setTeksHalaman] = useState(String(halamanAktif))
  useEffect(() => {
    setTeksHalaman(String(halamanAktif))
  }, [halamanAktif])

  function kirimHalaman(e: React.FormEvent) {
    e.preventDefault()
    const n = Math.trunc(Number(teksHalaman))
    if (!Number.isFinite(n)) {
      setTeksHalaman(String(halamanAktif))
      return
    }
    const tujuan = Math.min(Math.max(1, n), jumlahHalaman)
    setTeksHalaman(String(tujuan))
    if (tujuan !== halamanAktif) table.setPageIndex(tujuan - 1)
  }

  return (
    <div className="overflow-hidden rounded-xl bg-surface shadow-card">
      {toolbar ? (
        <div className="border-b border-neutral-soft p-4">{toolbar}</div>
      ) : null}

      {data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <p className="text-md font-semibold text-neutral-intense">
            {kosong?.title ?? 'Tidak ada data'}
          </p>
          {kosong?.body ? (
            <p className="max-w-md text-sm text-text-soft">{kosong.body}</p>
          ) : null}
        </div>
      ) : (
        <div
          className={`overflow-x-auto transition-opacity ${sibuk ? 'opacity-50' : ''}`}
          aria-busy={sibuk}
        >
          <table className="w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map((grup) => (
                <tr key={grup.id} className="border-b border-neutral-soft">
                  {grup.headers.map((header) => {
                    const bisaUrut = header.column.getCanSort()
                    const arah = header.column.getIsSorted()
                    return (
                      <th
                        key={header.id}
                        aria-sort={
                          arah === 'desc'
                            ? 'descending'
                            : arah === 'asc'
                              ? 'ascending'
                              : 'none'
                        }
                        className="bg-neutral-subtle px-4 py-3 text-left text-xs font-bold tracking-loose text-text-soft uppercase whitespace-nowrap"
                      >
                        {header.isPlaceholder ? null : bisaUrut ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1 font-semibold uppercase tracking-loose hover:text-text"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            <span
                              aria-hidden="true"
                              className={
                                arah ? 'text-accent' : 'text-text-disabled'
                              }
                            >
                              {arah === 'desc'
                                ? '▼'
                                : arah === 'asc'
                                  ? '▲'
                                  : '↕'}
                            </span>
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-neutral-soft/60 last:border-0 hover:bg-surface-container/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={SEL_TABEL}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.length > 0 && total > 0 ? (
        <div className="flex flex-col gap-3 border-t border-neutral-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-xs text-text-soft">
              Menampilkan {total} dari {totalSemua} data
            </p>
            <label className="flex items-center gap-2 text-xs text-text-soft">
              Baris per halaman
              <select
                className={PILIH}
                value={perHalaman}
                onChange={(e) => onPerHalaman(Number(e.target.value))}
              >
                {UKURAN_HALAMAN.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <nav
            className="flex flex-wrap items-center gap-2"
            aria-label="Navigasi halaman"
          >
            <button
              type="button"
              className={TOMBOL}
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              Sebelumnya
            </button>

            <form
              className="flex items-center gap-1.5 text-xs text-text-soft"
              onSubmit={kirimHalaman}
              noValidate
            >
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={jumlahHalaman}
                aria-label="Nomor halaman"
                value={teksHalaman}
                onChange={(e) => setTeksHalaman(e.target.value)}
                onBlur={() => setTeksHalaman(String(halamanAktif))}
                className="w-14 rounded-md border border-neutral-soft bg-surface-container px-2 py-1 text-center text-sm font-semibold text-text outline-none focus:border-accent"
              />
              <span>dari {jumlahHalaman}</span>
            </form>

            <button
              type="button"
              className={TOMBOL}
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Berikutnya
            </button>
          </nav>
        </div>
      ) : null}
    </div>
  )
}
