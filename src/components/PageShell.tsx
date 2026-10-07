import { Link } from '@tanstack/react-router'

/**
 * The public pages' content column.
 *
 * Mirrors the design's "Scroll" block (frames 02 and 03): a column that fills the space
 * under the 72px topbar, 24px vertical and 32px horizontal padding, 24px between blocks,
 * and content flowing from the top — not centred in the viewport.
 */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col gap-6 px-8 py-6">{children}</main>
  )
}

/**
 * A page heading block: an optional "Kembali ke beranda" back link, a 24px bold title in
 * `neutral.intense`, and a 14px `text.secondary` subtitle. The design uses this shape on
 * both public pages.
 */
export function PageHeading({
  title,
  subtitle,
  back = true,
}: {
  title: string
  subtitle?: string
  back?: boolean
}) {
  return (
    <div className="flex flex-col gap-6">
      {back ? (
        <Link
          to="/"
          className="flex items-center gap-1 text-sm font-semibold text-neutral-intense hover:text-accent"
        >
          <span aria-hidden="true">←</span>
          Kembali ke beranda
        </Link>
      ) : null}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-neutral-intense">{title}</h1>
        {subtitle ? <p className="text-sm text-text-soft">{subtitle}</p> : null}
      </div>
    </div>
  )
}
