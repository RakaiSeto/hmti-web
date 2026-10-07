/**
 * Better Auth configuration.
 *
 * Replaces the hand-rolled sessions + scrypt approach the original plan specified:
 * that was written when argon2 on Workers looked impractical, and it is not the reason
 * to own this code any more. See decisions.md D4.
 *
 * Two settings encode requirements rather than defaults:
 *   - `disableSignUp` — FR08 says only an admin creates accounts. There is no public
 *     sign-up route. The first admin comes from the seed script (INV-02).
 *   - `peran.input: false` — a client must never be able to set its own role.
 */
import { env } from 'cloudflare:workers'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import { db } from '#/db'
import * as schema from '#/db/schema'
import { hostDiizinkan } from '#/lib/origins'

export const auth = betterAuth({
  // Resolved per request rather than pinned to one string, so the same build serves every
  // host it is reached on: the real domain, localhost, and the orb's portal proxy. A
  // pinned base URL rejects the portal with INVALID_ORIGIN and breaks sign-in there —
  // see lib/origins.ts for what is allowed and why.
  baseURL: {
    allowedHosts: hostDiizinkan(
      env.BETTER_AUTH_URL,
      env.BETTER_AUTH_ALLOWED_HOSTS,
    ),
    protocol: 'auto',
    fallback: env.BETTER_AUTH_URL,
  },
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  emailAndPassword: {
    enabled: true,
    // FR08: accounts are created by an admin, never by the account holder.
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      peran: {
        type: 'string',
        required: false,
        defaultValue: 'pj_inventaris',
        // Not writable from the client.
        input: false,
      },
    },
  },
  // Must stay last in the array.
  plugins: [tanstackStartCookies()],
})
