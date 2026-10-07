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

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
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
