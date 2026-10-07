/**
 * Custom Worker entrypoint.
 *
 * The default TanStack Start entry exports only `fetch`, so a cron trigger has nowhere to
 * land. This adds `scheduled` while delegating everything else to the framework handler
 * unchanged.
 *
 * The cron fires at 17:00 UTC, which is 00:00 WIB — the "daily at WIB midnight" the plan
 * asks for. See wrangler.jsonc's `triggers`.
 */
import handler from '@tanstack/react-start/server-entry'

import { batalkanPengajuanBasi } from './domain/cron'

export default {
  fetch: handler.fetch,

  async scheduled(
    _controller: ScheduledController,
    _env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    // The runtime supplies its own `env`; the modules under src/ read the same bindings
    // through `cloudflare:workers`, so nothing has to be threaded through here.
    ctx.waitUntil(
      batalkanPengajuanBasi().then((hasil) => {
        console.log(
          `[cron] BR07 ${hasil.hariIni}: diperiksa ${hasil.diperiksa}, ` +
            `dibatalkan ${hasil.dibatalkan.length}` +
            (hasil.dibatalkan.length
              ? ` (${hasil.dibatalkan.join(', ')})`
              : ''),
        )
      }),
    )
  },
}
