import { defineConfig } from 'drizzle-kit'

/**
 * Migrations are generated from src/db/schema.ts and applied with
 * `wrangler d1 migrations apply` — D1 owns the migration ledger (`d1_migrations`), and
 * the `migrations_dir` in wrangler.jsonc points at ./drizzle.
 *
 * No credentials here on purpose: generation is offline. Applying against remote D1
 * goes through wrangler, which already holds the Cloudflare auth.
 */
export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
})
