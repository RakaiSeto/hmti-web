import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import { logoUrl } from '../components/Logo'
import appCss from '../styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Inventaris & Peminjaman — HMTI Polinema' },
      {
        name: 'description',
        content:
          'Inventaris dan peminjaman barang HMTI Polinema untuk UKM, HMJ, dan instansi.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      // The org's own favicon is the logo re-served, so this is the real asset rather
      // than a derived one. Vite hashes the URL, so it cache-busts on every build.
      { rel: 'icon', href: logoUrl, type: 'image/webp' },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-bold text-ink">Halaman tidak ditemukan</h1>
      <p className="text-sm text-text-soft">
        Tautan yang Anda buka tidak ada atau sudah dipindahkan.
      </p>
      <a
        href="/"
        className="mt-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-ink"
      >
        Kembali ke beranda
      </a>
    </main>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  // Light-only for now, per overview §3. The design carries dark and high-contrast
  // values (see tokens.css); enabling them is setting data-theme, not a re-design.
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-surface-container text-text antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
