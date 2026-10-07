/**
 * Worker secrets.
 *
 * Bindings (DB, BUCKET) are generated from wrangler.jsonc by `bun run cf-typegen` into
 * worker-configuration.d.ts — run that after a fresh clone or a wrangler.jsonc change.
 * Secrets are never in wrangler.jsonc, so their types are declared here.
 *
 * The `Cloudflare` namespace is the one `env` from `cloudflare:workers` is typed as, so
 * the declaration has to land there to merge with the generated one.
 */
declare namespace Cloudflare {
  interface Env {
    /** Better Auth signing secret. `wrangler secret put BETTER_AUTH_SECRET`. */
    BETTER_AUTH_SECRET: string
    /** Public origin, e.g. https://hmti.rakaiseto.com. */
    BETTER_AUTH_URL: string
  }
}

/**
 * The cron's `scheduled` handler signature. `ScheduledController` and `ExecutionContext`
 * come from the generated worker types; this declaration exists so `src/server.ts`
 * typechecks before `wrangler types` runs on a fresh clone.
 */
