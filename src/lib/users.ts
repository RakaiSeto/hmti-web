/**
 * Creating staff accounts outside the sign-up flow.
 *
 * `disableSignUp` is on (FR08: only an admin creates accounts), so there is no public
 * sign-up endpoint to reuse. Rather than enabling Better Auth's admin plugin — which
 * brings its own `role` field and would sit awkwardly beside the requirements' `peran` —
 * this writes the `user` + `account` rows directly, hashing with Better Auth's own
 * hasher. Login then verifies the password through the normal path, because it is the
 * same algorithm and the same stored format.
 */
import { env } from 'cloudflare:workers'
import { hashPassword } from 'better-auth/crypto'

import type { Peran } from '#/db/schema'
import { newId } from '#/lib/id'

export interface AkunBaru {
  nama: string
  email: string
  sandi: string
  peran: Peran
}

export async function buatAkun(
  akun: AkunBaru,
  db: D1Database = env.DB,
): Promise<{ ok: true; id: string } | { ok: false; pesan: string }> {
  const email = akun.email.trim().toLowerCase()
  const ada = await db
    .prepare(`SELECT id FROM user WHERE email = ?`)
    .bind(email)
    .first<{ id: string }>()
  if (ada) return { ok: false, pesan: 'Email sudah terdaftar.' }

  const id = newId()
  const now = Math.floor(Date.now() / 1000)
  const hash = await hashPassword(akun.sandi)

  // One batch: a user row without its credential row could never log in, and would look
  // like a working account in the list.
  await db.batch([
    db
      .prepare(
        `INSERT INTO user (id, name, email, email_verified, created_at, updated_at, peran)
         VALUES (?, ?, ?, 1, ?, ?, ?)`,
      )
      .bind(id, akun.nama.trim(), email, now, now, akun.peran),
    db
      .prepare(
        `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
         VALUES (?, ?, 'credential', ?, ?, ?, ?)`,
      )
      .bind(newId(), id, id, hash, now, now),
  ])

  return { ok: true, id }
}

/** Replace a user's password. Admin-driven (FR08) — there is no self-service reset. */
export async function aturUlangSandi(
  userId: string,
  sandiBaru: string,
  db: D1Database = env.DB,
): Promise<void> {
  const hash = await hashPassword(sandiBaru)
  await db
    .prepare(
      `UPDATE account SET password = ?, updated_at = ?
       WHERE user_id = ? AND provider_id = 'credential'`,
    )
    .bind(hash, Math.floor(Date.now() / 1000), userId)
    .run()
  // Revoke existing sessions so a reset actually ends the old login.
  await db.prepare(`DELETE FROM session WHERE user_id = ?`).bind(userId).run()
}
