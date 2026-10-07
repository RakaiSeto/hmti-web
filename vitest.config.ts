import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Deliberately separate from vite.config.ts.
 *
 * The app's Vite config loads the Cloudflare plugin, which makes Vitest run tests inside
 * `workerd` — that pool fails to start for plain unit tests ("require_react is not a
 * function"). Unit tests here cover pure logic (the availability rule, the status
 * machine, role guards, date formatting), so they run in Node.
 *
 * `cloudflare:workers` does not exist in Node, so it is aliased to a stub that throws if
 * touched. That keeps pure tests pure and makes an accidental binding dependency loud.
 *
 * Browser-level verification is Playwright's job (decisions.md D15), not Vitest's.
 */
export default defineConfig({
  resolve: {
    alias: {
      'cloudflare:workers': fileURLToPath(
        new URL('./src/test/cloudflare-workers-stub.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tools/**/*.test.ts'],
  },
})
