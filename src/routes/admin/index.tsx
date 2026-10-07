import { createFileRoute, redirect } from '@tanstack/react-router'

/** `/admin` is a shell, not a page: send it to the dashboard. */
export const Route = createFileRoute('/admin/')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/dasbor' })
  },
})
