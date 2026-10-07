/**
 * Test stand-in for the `cloudflare:workers` module.
 *
 * Vitest runs unit tests in Node, where that module does not exist — the real one is
 * provided by workerd. Anything here that is actually *used* throws, deliberately: it
 * turns "this test silently depended on a Worker binding" into a loud failure rather
 * than a mysterious `undefined`.
 *
 * Tests that genuinely need D1 or R2 use the integration setup in
 * `src/test/db.ts`, which drives a real local database, not this file.
 */
export const env = new Proxy(
  {},
  {
    get(_target, prop) {
      throw new Error(
        `Test touched env.${String(prop)}. Unit tests must not use Worker bindings — ` +
          `use the integration harness in src/test/db.ts instead.`,
      )
    },
  },
) as Record<string, never>
