/**
 * Drizzle client bound to the D1 database.
 *
 * `env` from `cloudflare:workers` is a live proxy, so reading it at module scope is
 * fine: the binding resolves per request. There is deliberately no connection pool to
 * manage — D1 is a binding, not a socket.
 */
import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'

import * as schema from './schema.ts'

export const db = drizzle(env.DB, { schema })

export { schema }
