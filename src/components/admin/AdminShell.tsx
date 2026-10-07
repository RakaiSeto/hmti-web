import { Link, Outlet, useRouterState } from '@tanstack/react-router'

import type { Peran } from '#/db/schema'
import { authClient } from '#/lib/auth-client'

import { BrandLockup } from '../BrandLockup'
import { LABEL_PERAN, navUntuk } from './nav'

/**
 * The admin shell: sidebar + topbar + content.
 *
 * Values are the design's (Kit sidebar master, as instanced in frames 05–08): a 252px
 * sidebar on `tertiary.mid` (#011638), a 62px topbar, 24px/32px content padding, 40px
 * nav rows with 6px radius, and the active row on the accent fill.
 *
 * The sidebar's own scrolling is separate from the content's, so a long page does not
 * carry the nav away.
 */
export function AdminShell({
  peran,
  nama,
  jumlahPermintaanBaru,
  children,
}: {
  peran: Peran
  nama: string
  jumlahPermintaanBaru: number
  /** Rendered instead of the router's <Outlet />. Used by the error boundary. */
  children?: React.ReactNode
}) {
  const nav = navUntuk(peran, { permintaanBaru: jumlahPermintaanBaru })
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const isActive = (to: string) =>
    pathname === to || (to !== '/admin/dasbor' && pathname.startsWith(`${to}/`))

  return (
    <div className="flex min-h-dvh bg-surface-container">
      {/* --- sidebar ------------------------------------------------------- */}
      <aside className="flex w-63 shrink-0 flex-col gap-1 bg-ink px-3 py-6">
        <div className="px-2 pb-4">
          <BrandLockup tone="dark" />
        </div>
        <div className="mb-3 h-px bg-white/10" />

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {nav.groups.map((grup, i) => (
            <div
              key={grup.judul ?? `grup-${i}`}
              className="flex flex-col gap-1"
            >
              {grup.judul ? (
                <p className="px-3 pt-3 pb-1 text-xs font-semibold tracking-loose text-neutral-mid uppercase">
                  {grup.judul}
                </p>
              ) : null}
              {grup.items.map((item) => {
                const active = isActive(item.to)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={`flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium no-underline transition-colors ${
                      active
                        ? 'bg-accent text-white'
                        : 'text-neutral-hint/80 hover:bg-white/10 hover:text-neutral-hint'
                    }`}
                  >
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-brand-ink">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => {
            void authClient.signOut().then(() => {
              window.location.href = '/masuk'
            })
          }}
          className="mt-3 flex h-10 items-center rounded-md px-3 text-sm font-medium text-neutral-hint/80 hover:bg-white/10 hover:text-neutral-hint"
        >
          Keluar
        </button>
      </aside>

      {/* --- main ---------------------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-15.5 shrink-0 items-center justify-end gap-3 border-b border-neutral-soft bg-surface px-8">
          <span className="text-sm font-semibold text-neutral-intense">
            {nama}
          </span>
          <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-semibold text-text-soft">
            {LABEL_PERAN[peran]}
          </span>
        </header>
        <main className="flex-1 px-8 py-6">{children ?? <Outlet />}</main>
      </div>
    </div>
  )
}
