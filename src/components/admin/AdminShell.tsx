import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import type { Peran } from '#/db/schema'
import { authClient } from '#/lib/auth-client'

import { BrandLockup } from '../BrandLockup'
import { IconChevronDown, IconLogout, IconMenu, IconProfil } from '../Icons'
import { LABEL_PERAN, navUntuk } from './nav'

/**
 * The admin shell: sidebar + topbar + content.
 *
 * Values are the design's (Kit sidebar master, as instanced in frames 05–08): a 252px
 * sidebar on `tertiary.mid` (#011638), a 62px topbar, 24px/32px content padding, 40px
 * nav rows with 6px radius.
 *
 * The active row is the brand yellow rather than the design's accent blue, with a strip
 * on the sidebar's far-left edge. The sidebar carries no horizontal padding for that
 * reason: the rows hold their own inset, so the strip can reach x=0 without the nav's
 * scroll container clipping it. The brand yellow is a fill, so the active row's label is
 * ink, and its badge inverts to stay legible on it.
 *
 * Profil and Keluar are not rows: they live in the topbar's account menu, which is why
 * the shell takes `nama`. The sidebar's own scrolling is separate from the content's, so
 * a long page does not carry the nav away.
 *
 * Below `lg` the sidebar is off-canvas: a 252px column leaves too little for the content
 * on a phone, and the tables need the width. The topbar then carries a hamburger that
 * slides it in over a backdrop. It is `fixed` there (out of flow, so `main` takes the full
 * width) and `lg:sticky` above (in flow, pinned). It closes on a nav tap, a backdrop tap,
 * Escape, and any route change; while it is open the page behind it does not scroll.
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
  const [menuTerbuka, setMenuTerbuka] = useState(false)
  const [navTerbuka, setNavTerbuka] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isActive = (to: string) =>
    pathname === to || (to !== '/admin/dasbor' && pathname.startsWith(`${to}/`))

  // A tap on a nav row navigates, and the drawer has done its job — it must not stay open
  // over the page it just opened. Watching the pathname also covers the browser's back
  // button, which a per-link click handler would miss.
  useEffect(() => {
    setNavTerbuka(false)
  }, [pathname])

  // Escape closes the drawer, and the page behind it stops scrolling while it is open.
  // Both are restored on unmount, so a route change mid-drawer cannot leave the body
  // locked.
  useEffect(() => {
    if (!navTerbuka) return
    const tombolEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavTerbuka(false)
    }
    const sebelumnya = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', tombolEsc)
    return () => {
      document.body.style.overflow = sebelumnya
      document.removeEventListener('keydown', tombolEsc)
    }
  }, [navTerbuka])

  // The account menu closes on an outside click and on Escape, the two ways a menu is
  // expected to dismiss. It is not a `<details>`: that element cannot close on an outside
  // click without the same listener anyway.
  useEffect(() => {
    if (!menuTerbuka) return
    const klikLuar = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuTerbuka(false)
    }
    const tombolEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuTerbuka(false)
    }
    document.addEventListener('mousedown', klikLuar)
    document.addEventListener('keydown', tombolEsc)
    return () => {
      document.removeEventListener('mousedown', klikLuar)
      document.removeEventListener('keydown', tombolEsc)
    }
  }, [menuTerbuka])

  return (
    <div className="flex min-h-dvh bg-surface-container">
      {/* --- sidebar ------------------------------------------------------- */}
      {/* The backdrop only exists while the drawer is open, and only below `lg`; above it
          the sidebar is in flow and there is nothing to dismiss. `aria-hidden` because
          the dismiss affordance is the button in the topbar, not this sheet. */}
      {navTerbuka ? (
        <div
          aria-hidden="true"
          onClick={() => setNavTerbuka(false)}
          className="fixed inset-0 z-30 bg-ink/60 lg:hidden"
        />
      ) : null}

      {/* `lg:sticky lg:top-0`: the sidebar is shorter than the content column, so without
          this a long page carries the nav off-screen. It has no horizontal padding for the
          strip's sake — the rows carry their own `mx-3`, which lets the active row's strip
          reach the sidebar's left edge without the nav's scroll container clipping it.
          Below `lg` it is `fixed` and off-screen until the hamburger slides it in; `fixed`
          takes it out of flow, so the content column gets the whole width. */}
      <aside
        className={`fixed top-0 left-0 z-40 flex h-dvh w-63 shrink-0 flex-col gap-1 bg-ink py-6 transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 ${
          navTerbuka ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 pb-4">
          <BrandLockup tone="dark" />
        </div>
        <div className="mx-3 mb-3 h-px bg-white/10" />

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {nav.groups.map((grup, i) => (
            <div
              key={grup.judul ?? `grup-${i}`}
              className="flex flex-col gap-1"
            >
              {grup.judul ? (
                <p className="px-6 pt-3 pb-1 text-xs font-semibold tracking-loose text-neutral-mid uppercase">
                  {grup.judul}
                </p>
              ) : null}
              {grup.items.map((item) => {
                const active = isActive(item.to)
                const Ikon = item.icon
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={`relative mx-3 flex h-10 items-center gap-2.5 rounded-md px-3 text-sm font-medium no-underline transition-colors ${
                      active
                        ? 'bg-brand text-ink'
                        : 'text-neutral-hint/80 hover:bg-white/10 hover:text-neutral-hint'
                    }`}
                  >
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="absolute top-0 -left-3 h-10 w-1 rounded-r-full bg-brand"
                      />
                    ) : null}
                    <Ikon size={17} className="shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          active ? 'bg-ink text-brand' : 'bg-brand text-ink'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* --- main ---------------------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-15.5 shrink-0 items-center gap-2 border-b border-neutral-soft bg-surface px-4 md:px-8">
          {/* The drawer's only opener. Hidden once the sidebar is back in flow at `lg`. */}
          <button
            type="button"
            aria-label="Buka menu navigasi"
            aria-expanded={navTerbuka}
            onClick={() => setNavTerbuka(true)}
            className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-intense transition-colors hover:bg-neutral-subtle lg:hidden"
          >
            <IconMenu />
          </button>

          {/* No notification affordance here: the dashboard's "Perlu tindakan" card is the
              one place that lists what needs attention, and the sidebar already counts new
              requests on the Permintaan row. */}
          <div className="relative ml-auto" ref={menuRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuTerbuka}
              onClick={() => setMenuTerbuka((v) => !v)}
              className="flex h-9 items-center gap-1.5 rounded-full border border-neutral-soft bg-surface px-3 text-sm font-semibold text-neutral-intense transition-colors hover:bg-neutral-subtle"
            >
              {LABEL_PERAN[peran]}
              <IconChevronDown
                size={14}
                className={`text-text-soft transition-transform ${
                  menuTerbuka ? 'rotate-180' : ''
                }`}
              />
            </button>

            {menuTerbuka ? (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl bg-surface py-1 shadow-modal"
              >
                <div className="border-b border-neutral-soft px-3 py-2">
                  <p className="truncate text-sm font-semibold text-neutral-intense">
                    {nama}
                  </p>
                  <p className="text-xs text-text-soft">{LABEL_PERAN[peran]}</p>
                </div>
                {/* A PJ has no self-service profile — an admin resets their password
                    (FR08) — so the row is admin-only, matching navAdmin. */}
                {peran === 'admin' ? (
                  <Link
                    to="/admin/profil"
                    role="menuitem"
                    onClick={() => setMenuTerbuka(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text no-underline hover:bg-neutral-subtle"
                  >
                    <IconProfil size={16} className="text-text-soft" />
                    Profil Saya
                  </Link>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    void authClient.signOut().then(() => {
                      window.location.href = '/masuk'
                    })
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-error hover:bg-error-container"
                >
                  <IconLogout size={16} />
                  Keluar
                </button>
              </div>
            ) : null}
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}
