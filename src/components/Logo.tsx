/**
 * The HMTI Polinema logo.
 *
 * Imported from `assets/brand/` — the repo's canonical brand directory — rather than
 * copied into `src/`, so there is one file and no chance of the app's copy drifting from
 * the design system's. Vite hashes it at build time.
 *
 * `hmti-logo-256.webp` is 256×260 and already circular; the transparent corners are the
 * only padding. The 1705×1732 PNG beside it is the 1.8 MB master, too heavy to ship.
 * There is no vector original: no SVG has ever been served by the site
 * (docs/research/01-hmti-polinema-brand-research.md §3).
 */
import logoUrl from '../../assets/brand/logo/hmti-logo-256.webp'

export function Logo({
  size = 36,
  alt = 'Logo HMTI Polinema',
}: {
  /** Rendered size in px. The design uses 36 in the topbar, 64 on the login page. */
  size?: number
  /** Pass "" where adjacent text already names the organisation, to avoid repetition. */
  alt?: string
}) {
  return (
    <img
      src={logoUrl}
      alt={alt}
      className="shrink-0 rounded-full"
      style={{ width: size, height: size }}
    />
  )
}

export { logoUrl }
