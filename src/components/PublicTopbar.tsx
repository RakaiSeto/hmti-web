import { Link } from '@tanstack/react-router'

import { BrandLockup } from './BrandLockup'

/**
 * The public topbar, shared by the borrower-facing pages.
 *
 * Values are the design's (frame 02 "Form Peminjaman", which is where the public chrome
 * is defined): 72px tall, 12px vertical and 32px horizontal padding, a 1px
 * `neutral.soft` bottom stroke, brand on the left.
 *
 * The design's nav (Lacak / Ajukan Peminjaman / Masuk admin) is deliberately gone: the
 * borrower pages are single-purpose, each carries its own back link, and the loud call to
 * action lives on the landing hero. The lockup stays as the way back to the landing page,
 * which is where the staff login lives.
 */
export function PublicTopbar() {
  return (
    <header className="flex h-18 items-center border-b border-neutral-soft px-8">
      <Link to="/" className="no-underline">
        <BrandLockup />
      </Link>
    </header>
  )
}
