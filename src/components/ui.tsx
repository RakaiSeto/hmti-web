import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

/**
 * Small shared pieces of the design's app kit, used across the staff pages. Kept in one
 * file because each is a few lines and splitting them would cost more in imports than it
 * saves in navigation.
 */

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  back?: { to: string; label: string }
}) {
  return (
    <div className="flex flex-col gap-4">
      {back ? (
        <Link
          to={back.to}
          className="flex items-center gap-1 text-sm font-semibold text-text-soft no-underline hover:text-accent"
        >
          <span aria-hidden="true">←</span>
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-neutral-intense">{title}</h1>
          {subtitle ? (
            <p className="text-sm text-text-soft">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-xl bg-surface p-4 shadow-card ${className}`}>
      {children}
    </div>
  )
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-md font-semibold text-neutral-intense">{children}</h2>
  )
}

/** The design's primary button: yellow fill, dark ink (never yellow text — 1.44:1). */
export function TombolUtama({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-firm disabled:cursor-not-allowed disabled:opacity-60 ${rest.className ?? ''}`}
    >
      {children}
    </button>
  )
}

export function TombolSekunder({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-md border border-neutral-soft bg-surface px-4 py-2.5 text-sm font-semibold text-neutral-intense transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60 ${rest.className ?? ''}`}
    >
      {children}
    </button>
  )
}

export function TombolBahaya({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-md border border-error bg-error-container px-4 py-2.5 text-sm font-semibold text-error transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 ${rest.className ?? ''}`}
    >
      {children}
    </button>
  )
}

export function Field({
  label,
  hint,
  error,
  wajib = false,
  children,
}: {
  label: string
  hint?: string
  error?: string
  /** Marks the field as mandatory. The input still needs `required` for assistive tech. */
  wajib?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-neutral-bold">
      <span>
        {label}
        {wajib ? (
          <span aria-hidden="true" className="text-error">
            {' *'}
          </span>
        ) : null}
      </span>
      {children}
      {hint && !error ? (
        <span className="text-xs font-normal text-text-soft">{hint}</span>
      ) : null}
      {error ? (
        <span className="text-xs font-semibold text-error">{error}</span>
      ) : null}
    </label>
  )
}

export const inputCls =
  'rounded-md border border-neutral-soft bg-surface-container px-3 py-2 text-sm font-normal text-text outline-none focus:border-accent disabled:opacity-60'

/**
 * A small filled action chip, sized like the design's `btn-sm` — a table row's action, or
 * a line's remove button. `bahaya` swaps to the destructive colour.
 */
const AKSI =
  'inline-flex items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1.5 text-sm font-semibold no-underline transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60'

const AKSI_NETRAL = `${AKSI} bg-neutral-subtle text-neutral-intense`

const AKSI_BAHAYA = `${AKSI} bg-error-container text-error`

export function TombolAksi({
  children,
  bahaya = false,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { bahaya?: boolean }) {
  return (
    <button
      {...rest}
      type={rest.type ?? 'button'}
      className={`${bahaya ? AKSI_BAHAYA : AKSI_NETRAL} ${rest.className ?? ''}`}
    >
      {children}
    </button>
  )
}

/**
 * The app kit's static data table: a surface card, a header row, and zebra-free body
 * rows. Used by the detail pages, whose tables are bounded by one record. The list pages
 * use `TabelData`, which is driven by TanStack Table.
 */
export function DataTable({
  head,
  children,
  kosong,
}: {
  head: string[]
  children: React.ReactNode
  kosong?: string
}) {
  const adaIsi = Array.isArray(children)
    ? children.length > 0
    : Boolean(children)
  return (
    <div className="overflow-hidden rounded-xl bg-surface shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-soft">
              {head.map((h, i) => (
                <th
                  key={`${h}-${i}`}
                  className="bg-neutral-subtle px-4 py-3 text-left text-xs font-bold tracking-loose text-text-soft uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {!adaIsi && kosong ? (
        <p className="px-4 py-10 text-center text-sm text-text-soft">
          {kosong}
        </p>
      ) : null}
    </div>
  )
}

/**
 * The minimum height every data row in the app shares — list rows in `TabelData` and detail
 * rows in `BarisTabel` both carry it on their cells.
 *
 * It is a floor rather than a fixed height: a one-line row lands on 68px so a table's
 * rhythm does not change with what happens to be in the columns, but a cell whose value
 * wraps grows the row past it. Every cell is `text-sm` (14px/20px), so the common case — a
 * primary line over a secondary one — is 40px, and `h-17` leaves 4px of slack around it.
 */
export const BARIS_TABEL = 'h-17'

/**
 * A body cell: the minimum row height and the shared padding.
 *
 * Cells wrap at every width, which is what keeps a long value from stretching its column
 * across the table. The default is `overflow-wrap: break-word` — text wraps at word
 * boundaries, and a word too long for the column is broken rather than pushing it wider.
 *
 * Below `md` it upgrades to `anywhere`, which also shrinks the cell's min-content. That is
 * what the detail pages' narrow tables need: a long unbreakable value (an email, an id)
 * wraps there instead of forcing the table to scroll. It is deliberately not the desktop
 * rule — with `anywhere` every column can shrink to one character, so the table layout
 * starves short columns and a status badge ends up split mid-word.
 */
export const SEL_TABEL = `px-4 py-3 align-middle text-text break-words max-md:wrap-anywhere ${BARIS_TABEL}`

export function BarisTabel({ children }: { children: React.ReactNode }) {
  return (
    <tr className="border-b border-neutral-soft/60 last:border-0 hover:bg-surface-container/50">
      {children}
    </tr>
  )
}

export function Sel({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <td className={`${SEL_TABEL} ${className}`}>{children}</td>
}

/**
 * A debounced search box, wired to the route's `q` param.
 *
 * `nilai` is the committed value from the list params. Typing updates local state and,
 * 300 ms after the last keystroke, calls `onCari` — unless the value came back from the
 * server, in which case there is nothing to search. Enter searches immediately.
 *
 * The `terkirim` ref is what keeps a slow round trip from clobbering the input: only a
 * value we did not send ourselves (Reset, or any change we did not originate) is adopted
 * into the field.
 */
export function KotakCari({
  nilai,
  onCari,
  placeholder,
  className = '',
}: {
  nilai: string
  onCari: (teks: string) => void
  placeholder?: string
  className?: string
}) {
  const [teks, setTeks] = useState(nilai)
  const cb = useRef(onCari)
  const terkirim = useRef(nilai)

  useEffect(() => {
    cb.current = onCari
  })

  useEffect(() => {
    if (nilai === terkirim.current) return
    terkirim.current = nilai
    setTeks(nilai)
  }, [nilai])

  useEffect(() => {
    if (teks === terkirim.current) return
    const t = setTimeout(() => {
      terkirim.current = teks
      cb.current(teks)
    }, 300)
    return () => clearTimeout(t)
  }, [teks])

  return (
    <input
      type="search"
      className={`${inputCls} ${className}`}
      placeholder={placeholder}
      value={teks}
      onChange={(e) => setTeks(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          terkirim.current = teks
          cb.current(teks)
        }
      }}
    />
  )
}

/** The honest empty state the plan asks for, rather than a blank region. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-surface px-6 py-12 text-center shadow-card">
      <p className="text-md font-semibold text-neutral-intense">{title}</p>
      <p className="max-w-md text-sm text-text-soft">{body}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

/** A stat tile, as the design's dashboards use. */
export function StatTile({
  label,
  value,
  tone = 'netral',
}: {
  label: string
  value: number | string
  tone?: 'netral' | 'peringatan' | 'bahaya' | 'sukses'
}) {
  const warna = {
    netral: 'text-neutral-intense',
    peringatan: 'text-warning',
    bahaya: 'text-error',
    sukses: 'text-success-text',
  }[tone]
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-surface p-4 shadow-card">
      <span className="text-xs font-semibold tracking-loose text-text-soft uppercase">
        {label}
      </span>
      <span className={`text-2xl font-bold ${warna}`}>{value}</span>
    </div>
  )
}

export function Peringatan({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-warning-container px-4 py-3 text-sm font-semibold text-warning">
      {children}
    </div>
  )
}
