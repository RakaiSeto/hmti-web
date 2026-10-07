import { Link } from '@tanstack/react-router'

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
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-neutral-bold">
      {label}
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

/** The app kit's data table: a surface card, a header row, and zebra-free body rows. */
export function DataTable({
  head,
  children,
  kosong,
  kolom,
}: {
  head: string[]
  children: React.ReactNode
  kosong?: string
  kolom?: number
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
              {head.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold tracking-loose text-text-soft uppercase"
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
      {!adaIsi && !kosong && kolom ? null : null}
    </div>
  )
}

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
  return (
    <td className={`px-4 py-3 align-middle text-text ${className}`}>
      {children}
    </td>
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
