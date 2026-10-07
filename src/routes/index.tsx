import { Link, createFileRoute } from '@tanstack/react-router'

import {
  IconArrowRight,
  IconCamera,
  IconPackage,
  IconProjector,
  IconSpeaker,
} from '../components/Icons'
import { Logo } from '../components/Logo'

export const Route = createFileRoute('/')({ component: Landing })

/**
 * 01 · Landing (frames 01, and the public entry point of the flow).
 *
 * The design's three bands, top to bottom:
 *
 *  - The hero, a 135° gradient from `tertiary.firm` through `tertiary.mid` to
 *    `secondary.firm`, holding the 72px logo, the yellow uppercase eyebrow, the heading,
 *    and a 560px sub-headline — all centred.
 *  - The guest card, 720px wide and pulled 32px up into the hero (the design's
 *    `overlap.2xl`), carrying the icon tile, the "BARANG TERSEDIA" chips, the one loud
 *    call to action, and the tracking-code row under a hairline divider.
 *  - "CARA KERJA", three numbered steps, and the footer.
 *
 * There is deliberately no topbar here: the design's landing is a single centred column,
 * and the public chrome lives on the borrower-facing pages behind the card's call to
 * action. Below `sm` the steps stack and their separators drop out, since the numbered
 * circles already carry the order.
 */
function Landing() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-container">
      <header className="flex flex-col items-center bg-[linear-gradient(135deg,var(--color-ink-firm)_0%,var(--color-ink)_55%,var(--color-accent-firm)_100%)] px-8 pt-[86px] pb-[86px] text-center">
        <Logo size={72} alt="" />
        <p className="mt-4 text-xs leading-base font-semibold tracking-loose text-brand uppercase">
          Himpunan Mahasiswa Teknologi Informasi
        </p>
        <h1 className="mt-1 text-2xl leading-base font-bold text-balance text-neutral-hint sm:text-4xl">
          Inventaris &amp; Peminjaman Barang
        </h1>
        <p className="mt-1 max-w-[560px] text-md leading-base text-brand-soft">
          Ajukan peminjaman peralatan HMTI Polinema — proyektor, kamera, audio,
          dan lainnya.
        </p>
      </header>

      <main className="flex flex-col items-center px-8 pb-6">
        <div className="-mt-8 flex w-full max-w-[720px] flex-col gap-4 rounded-xl bg-surface p-6 shadow-card sm:p-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand text-ink">
            <IconPackage />
          </span>

          <div className="flex flex-col gap-1">
            <h2 className="text-xl leading-base font-bold text-neutral-intense sm:text-2xl">
              Ajukan Peminjaman
            </h2>
            <p className="text-md leading-base text-neutral-mid">
              Untuk UKM, HMJ, dan instansi. Isi formulir, pilih barang, dan
              tunggu persetujuan admin.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs leading-base font-semibold tracking-loose text-accent uppercase">
              Barang Tersedia
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="flex h-[33px] items-center gap-2 rounded-full bg-brand-hint px-3 text-sm font-medium text-ink">
                <IconProjector />
                Proyektor
              </span>
              <span className="flex h-[33px] items-center gap-2 rounded-full bg-brand-hint px-3 text-sm font-medium text-ink">
                <IconCamera />
                Kamera
              </span>
              <span className="flex h-[33px] items-center gap-2 rounded-full bg-brand-hint px-3 text-sm font-medium text-ink">
                <IconSpeaker />
                Audio
              </span>
              <span className="flex h-[33px] items-center rounded-full border border-line px-3 text-sm font-medium text-text-soft">
                +12 lainnya
              </span>
            </div>
          </div>

          <Link
            to="/ajukan"
            className="flex h-13 items-center justify-center gap-2 rounded-md bg-brand px-4 text-md font-semibold whitespace-nowrap text-ink no-underline hover:bg-brand-firm sm:text-lg"
          >
            Isi Formulir Peminjaman
            <IconArrowRight />
          </Link>

          <div className="flex flex-col gap-2 border-t border-line-soft pt-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-base text-text-soft">
              Sudah mengajukan? Cek status dengan kode pelacakan
            </p>
            <Link
              to="/lacak"
              className="flex shrink-0 items-center gap-1 text-sm font-semibold text-accent no-underline hover:text-accent-firm"
            >
              Cek status
              <IconArrowRight size={14} />
            </Link>
          </div>
        </div>

        <section className="mt-22 flex flex-col items-center gap-4">
          <p className="text-xs font-semibold tracking-loose text-accent uppercase">
            Cara Kerja
          </p>
          <ol className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-center">
            {LANGKAH.map((langkah, i) => (
              <li key={langkah.judul} className="flex items-center gap-6">
                {i > 0 ? (
                  <IconArrowRight
                    className="hidden text-neutral-soft sm:block"
                    size={18}
                  />
                ) : null}
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-md font-bold text-ink">
                    {i + 1}
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="text-md font-semibold text-neutral-bold">
                      {langkah.judul}
                    </span>
                    <span className="text-sm text-text-soft">
                      {langkah.rinci}
                    </span>
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-22 flex flex-col items-center gap-2 text-sm sm:flex-row sm:gap-1">
          <span className="text-text-soft">© 2026 HMTI Polinema</span>
          <Link
            to="/masuk"
            className="flex items-center gap-1 font-semibold text-accent no-underline hover:text-accent-firm"
          >
            Pengurus? Masuk sebagai admin
            <IconArrowRight size={14} />
          </Link>
        </footer>
      </main>
    </div>
  )
}

/** The design's three steps, verbatim. */
const LANGKAH = [
  { judul: 'Isi formulir', rinci: 'Pilih barang & tanggal' },
  { judul: 'Admin menyetujui', rinci: 'Pantau via kode pelacakan' },
  { judul: 'Ambil barang', rinci: 'Sekretariat Gedung TI Lt. 2' },
] as const
