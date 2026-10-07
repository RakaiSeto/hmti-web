import { Link, createFileRoute } from '@tanstack/react-router'

import { PublicTopbar } from '../components/PublicTopbar'

export const Route = createFileRoute('/')({ component: Landing })

/**
 * 01 · Landing — Phase 0 shell.
 *
 * The hero uses the design's own treatment: the 135° gradient from `tertiary.firm`
 * through `tertiary.mid` to `secondary.firm`, the yellow uppercase eyebrow, and the
 * heading at `font.size.4xl`. The guest card and the three-step how-it-works that the
 * design stacks below the hero are ported in the design-port phase.
 *
 * The footer matches frame 01: a centred 14px row, the copyright in `text.secondary` and
 * the staff link in the brand blue.
 */
function Landing() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicTopbar />

      <main className="flex flex-1 items-center justify-center bg-[linear-gradient(135deg,var(--color-ink-firm)_0%,var(--color-ink)_55%,var(--color-accent-firm)_100%)] px-8 py-8">
        <div className="max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold tracking-loose text-brand uppercase">
            Himpunan Mahasiswa Teknologi Informasi
          </p>
          <h1 className="mb-4 text-4xl leading-snug font-bold text-balance text-neutral-hint">
            Inventaris &amp; Peminjaman Barang
          </h1>
          <p className="mb-8 text-md text-accent-soft">
            Untuk UKM, HMJ, dan instansi — pinjam proyektor, kamera, audio, dan
            lainnya. Semua terpusat di sini.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/ajukan"
              className="rounded-md bg-brand px-6 py-3 text-sm font-semibold text-brand-ink hover:bg-brand-firm"
            >
              Isi Formulir Peminjaman
            </Link>
            <Link
              to="/lacak"
              className="rounded-md border border-accent-soft px-6 py-3 text-sm font-semibold text-neutral-hint hover:bg-ink-firm"
            >
              Cek status pengajuan
            </Link>
          </div>
        </div>
      </main>

      <footer className="flex flex-wrap items-center justify-center gap-2 px-8 py-6 text-sm">
        <span className="text-text-soft">© 2026 HMTI Polinema</span>
        <Link
          to="/masuk"
          className="font-semibold text-accent hover:text-accent-firm"
        >
          Pengurus? Masuk sebagai admin
        </Link>
      </footer>
    </div>
  )
}
