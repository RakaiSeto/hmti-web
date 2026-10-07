import { Link } from '@tanstack/react-router'

import { BrandLockup } from './BrandLockup'

/**
 * The public topbar, shared by the borrower-facing pages.
 *
 * Values are the design's (frame 02 "Form Peminjaman", which is where the public chrome
 * is defined): 72px tall, 12px vertical and 32px horizontal padding, a 1px
 * `neutral.soft` bottom stroke, brand on the left and the nav on the right with a 16px
 * gap.
 *
 * The design renders all three nav items as plain 14px-medium links — only "Masuk admin"
 * carries colour (`secondary.mid`, the brand blue). There is no button in the topbar: the
 * loud call to action lives in the hero instead.
 */
export function PublicTopbar() {
  return (
    <header className="flex h-18 items-center justify-between border-b border-neutral-soft px-8">
      <Link to="/" className="no-underline">
        <BrandLockup />
      </Link>
      <nav className="flex items-center gap-4 text-sm font-medium">
        <Link to="/lacak" className="text-text-soft hover:text-text">
          Lacak
        </Link>
        <Link to="/ajukan" className="text-text-soft hover:text-text">
          Ajukan Peminjaman
        </Link>
        <Link to="/masuk" className="text-accent hover:text-accent-firm">
          Masuk admin
        </Link>
      </nav>
    </header>
  )
}
