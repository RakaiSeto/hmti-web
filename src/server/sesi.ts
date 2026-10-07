/**
 * The session server function.
 *
 * Its own module because `lib/guards.ts` also exports the guard helpers, and a module
 * that mixes a server function with plain exports cannot be split — the client would get
 * the real module and, with it, `cloudflare:workers`.
 */
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import type { Peran } from '#/db/schema'
import { auth } from '#/lib/auth'

export interface SesiPengguna {
  id: string
  nama: string
  email: string
  peran: Peran
}

/** The signed-in staff member, or null. Safe to call from any route's beforeLoad. */
export const ambilSesi = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SesiPengguna | null> => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() })
    if (!session?.user) return null
    const u = session.user as typeof session.user & { peran?: Peran }
    return {
      id: u.id,
      nama: u.name,
      email: u.email,
      peran: u.peran ?? 'pj_inventaris',
    }
  },
)
