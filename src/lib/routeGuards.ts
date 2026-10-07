/**
 * Route-level guards.
 *
 * These are the *UX* half of role enforcement: they keep a PJ Inventaris off surfaces the
 * sidebar already hides from them. They are not the security boundary — every server
 * function under those surfaces calls `butuhAdmin()` for that, because a route guard is
 * skipped by anyone who calls the server function directly.
 *
 * Redirect rather than throw: a PJ who types an admin URL should land back on their own
 * dashboard, not on an error page.
 */
import { redirect } from '@tanstack/react-router'

import type { SesiPengguna } from '#/server/sesi'

export function hanyaAdmin({ context }: { context: { sesi: SesiPengguna } }) {
  if (context.sesi.peran !== 'admin') {
    throw redirect({ to: '/admin/dasbor' })
  }
}
