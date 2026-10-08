import { useRouterState } from '@tanstack/react-router'

import { Card, BARIS_TABEL } from '../ui'

/**
 * Loading skeletons for the admin pages (proposal: "Show a loading state while an admin
 * page changes").
 *
 * The shell's sidebar and topbar never unmount during a route change, so the skeleton only
 * has to stand in for the content area. Each shape mirrors the page it stands for — the
 * blocks sit where the real tiles, rows and fields land — because a skeleton whose layout
 * disagrees with the page makes the page jump when the data arrives.
 *
 * Four shapes cover the ten pages: the dashboard, a list with its toolbar and table, a
 * record reached from a row (detail or edit form), and Profil Saya's two columns.
 */

/** One placeholder block. Every size comes from the caller, so a shape reads as its layout. */
function Bar({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-denyut rounded-md bg-neutral-subtle ${className}`}
    />
  )
}

/** The `PageHeader` every admin page opens with: a title bar and a subtitle bar. */
function Header() {
  return (
    <div className="flex flex-col gap-2">
      <Bar className="h-6 w-40" />
      <Bar className="h-4 w-80" />
    </div>
  )
}

/** 05 · Dasbor: four tiles, the chart and the activity list, then the action row. */
export function SkeletonDasbor() {
  return (
    <div className="flex flex-col gap-6">
      <Header />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="flex flex-col gap-2">
            <Bar className="h-3 w-24" />
            <Bar className="h-7 w-14" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <Bar className="h-4 w-40" />
          <Bar className="h-40" />
        </Card>
        <Card className="flex flex-col gap-4">
          <Bar className="h-4 w-36" />
          {[0, 1, 2, 3].map((i) => (
            <Bar key={i} className="h-4" />
          ))}
        </Card>
      </div>
      <Card className="flex flex-wrap gap-3">
        <Bar className="h-10 w-36" />
        <Bar className="h-10 w-36" />
      </Card>
    </div>
  )
}

/**
 * A list page: the filter toolbar, then the table.
 *
 * The table is drawn rather than put in a `Card`, because `DataTable` is flush — its header
 * and rows carry their own padding — so a padded card would be a different height.
 */
export function SkeletonTabel({ baris = 6 }: { baris?: number }) {
  return (
    <div className="flex flex-col gap-6">
      <Header />
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Bar key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Bar className="h-10 min-w-48 flex-1" />
          <Bar className="h-10 w-24" />
        </div>
      </Card>
      <div className="overflow-hidden rounded-xl bg-surface shadow-card">
        <div className="flex gap-6 border-b border-neutral-soft px-4 py-3">
          <Bar className="h-3 w-16" />
          <Bar className="h-3 w-32" />
          <Bar className="h-3 w-24" />
          <Bar className="h-3 w-20" />
        </div>
        {Array.from({ length: baris }, (_, i) => (
          <div
            key={i}
            className={`flex items-center gap-6 border-b border-neutral-soft/60 px-4 py-3 last:border-0 ${BARIS_TABEL}`}
          >
            <Bar className="h-4 w-24" />
            <Bar className="h-4 flex-1" />
            <Bar className="h-4 w-28" />
            <Bar className="h-6 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** A record opened from a row: `permintaan/$kode`, `pengembalian/$kode`, `serah-terima/$kode`. */
export function SkeletonDetail() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Bar className="h-4 w-44" />
        <Header />
      </div>
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <Bar className="h-4 w-32" />
            <Bar className="h-6 w-56" />
            <Bar className="h-4 w-64" />
          </div>
          <Bar className="h-7 w-24" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Bar className="h-3 w-24" />
              <Bar className="h-4 w-32" />
            </div>
          ))}
        </div>
      </Card>
      <Card className="flex flex-col gap-4">
        <Bar className="h-4 w-24" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex justify-between gap-3">
            <Bar className="h-4 w-48" />
            <Bar className="h-4 w-10" />
          </div>
        ))}
      </Card>
    </div>
  )
}

/** `barang/$id`: the back link, the header, a card of fields, then its save button. */
export function SkeletonForm({ bidang = 4 }: { bidang?: number }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Bar className="h-4 w-44" />
        <Header />
      </div>
      <Card className="flex flex-col gap-4">
        <Bar className="h-4 w-32" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: bidang }, (_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Bar className="h-3 w-24" />
              <Bar className="h-10" />
            </div>
          ))}
        </div>
        <Bar className="h-10 w-36" />
      </Card>
    </div>
  )
}

/** 21 · Profil Saya: two columns, each card ending in its own save button. */
export function SkeletonProfil() {
  return (
    <div className="flex flex-col gap-6">
      <Header />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <Bar className="h-4 w-32" />
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Bar className="h-3 w-16" />
              <Bar className="h-10" />
            </div>
          ))}
          <Bar className="mt-2 h-10 w-32" />
        </Card>
        <Card className="flex flex-col gap-4">
          <Bar className="h-4 w-24" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Bar className="h-3 w-40" />
              <Bar className="h-10" />
            </div>
          ))}
          <Bar className="mt-2 h-10 w-36" />
        </Card>
      </div>
    </div>
  )
}

/**
 * The shape for a path, so the choice lives in one place rather than in fifteen route files.
 *
 * A path with a third segment is a single record — a detail page, or the edit form for an
 * item — and everything else under `/admin` is a list.
 */
export function skeletonUntuk(pathname: string) {
  const [, seksi, anak] = pathname.split('/').filter(Boolean)
  if (seksi === 'dasbor') return <SkeletonDasbor />
  if (seksi === 'profil') return <SkeletonProfil />
  if (anak) return seksi === 'barang' ? <SkeletonForm /> : <SkeletonDetail />
  return <SkeletonTabel />
}

/**
 * The router's `defaultPendingComponent`.
 *
 * It returns nothing outside `/admin` on purpose: the decision was to add the loading state
 * to the admin shell only, where the nav is and where a frozen screen reads as a dead link.
 * The public pages are short and mostly land under the 200 ms delay anyway.
 */
export function PendingKonten() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  if (!pathname.startsWith('/admin')) return null
  return skeletonUntuk(pathname)
}
