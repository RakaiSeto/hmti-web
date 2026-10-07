/**
 * Session and role guards.
 *
 * One guard per server function — never a scattered `if (user.peran === …)` inside a
 * handler. The reason is not tidiness: a check that lives in the component is a check an
 * attacker skips by calling the server function directly.
 *
 * `requireRole` throws a 403 rather than returning a flag, so a forgotten `await` cannot
 * silently continue as an authorised request.
 */
import type { Peran } from '#/db/schema'
import { ambilSesi } from '#/server/sesi'
import type { SesiPengguna } from '#/server/sesi'

/** Thrown by the guards; carries the status the route layer turns into a response. */
export class TidakBerwenang extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403,
  ) {
    super(message)
    this.name = 'TidakBerwenang'
  }
}

/** Any signed-in staff member, either role. */
export async function butuhSesi(): Promise<SesiPengguna> {
  const sesi = await ambilSesi()
  if (!sesi) throw new TidakBerwenang('Silakan masuk terlebih dahulu.', 401)
  return sesi
}

/**
 * A signed-in staff member holding one of `peran`.
 *
 * Admin is a superset in practice — every `requireRole('pj_inventaris')` site should be
 * read as "operational staff", and admin passes it.
 */
export async function butuhPeran(
  ...peran: readonly Peran[]
): Promise<SesiPengguna> {
  const sesi = await butuhSesi()
  if (!peran.includes(sesi.peran)) {
    throw new TidakBerwenang('Anda tidak memiliki akses ke tindakan ini.', 403)
  }
  return sesi
}

/** Admin-only surfaces: item and category management, accounts, the log (FR08, FR21). */
export function butuhAdmin(): Promise<SesiPengguna> {
  return butuhPeran('admin')
}
