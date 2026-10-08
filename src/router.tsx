import { createRouter as createTanStackRouter } from '@tanstack/react-router'

import { PendingKonten } from './components/admin/Skeleton'
import { parseSearchParams, stringifySearchParams } from './lib/searchParams'
import { routeTree } from './routeTree.gen'

// Loads TanStack Start's router type augmentations. Without this import in the program,
// `server: { handlers: … }` on a file route is an unknown property — the augmentation
// lives in @tanstack/start-client-core and is only picked up when something imports the
// Start package. router.tsx is the natural home: it is the module that wires routing.
import type {} from '@tanstack/react-start'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    // Plain string search params instead of the default JSON encoding, so a numeric-looking
    // search stays `?q=5` rather than `?q=%225%22` (see lib/searchParams.ts).
    parseSearch: parseSearchParams,
    stringifySearch: stringifySearchParams,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    // A route change used to leave the old page frozen with no sign that anything was
    // happening. `PendingKonten` picks a skeleton from the path and returns nothing
    // outside `/admin`, so the public pages are unchanged.
    defaultPendingComponent: PendingKonten,
    // Show it only once a load is slow enough to notice, and keep it up long enough to
    // read, so a preloaded or cached route never flashes a skeleton for one frame.
    defaultPendingMs: 200,
    defaultPendingMinMs: 400,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
