import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

// Loads TanStack Start's router type augmentations. Without this import in the program,
// `server: { handlers: … }` on a file route is an unknown property — the augmentation
// lives in @tanstack/start-client-core and is only picked up when something imports the
// Start package. router.tsx is the natural home: it is the module that wires routing.
import type {} from '@tanstack/react-start'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
