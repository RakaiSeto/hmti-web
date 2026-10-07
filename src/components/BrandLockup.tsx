import { Logo } from './Logo'

/**
 * The organisation lockup: logo, name, and the "INVENTARIS" tag.
 *
 * Values are the design's (Brilliant Kit master "Brand", as instanced in frame 02):
 * a 36px logo, an 8px gap, "HMTI Polinema" at 14px bold in neutral.intense, and
 * "INVENTARIS" at 12px semibold in primary.firm with 1.2px tracking.
 *
 * `tone` picks between the design's two variants, which differ only in colour:
 * on a light surface the name is `#292929` and the tag `#AE8C00`; on the navy sidebar
 * the name is `#EFF0F2` and the tag the brighter brand yellow `#EEC643`. Both come from
 * the same tokens — see the design's `neutral.intense` and `primary.mid` pairs.
 */
export function BrandLockup({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <span className="flex items-center gap-2">
      {/* The name below already says the organisation, so the logo is decorative. */}
      <Logo size={36} alt="" />
      <span className="flex flex-col leading-none">
        <span
          className={`text-sm font-bold leading-base ${
            tone === 'light' ? 'text-neutral-intense' : 'text-neutral-hint'
          }`}
        >
          HMTI Polinema
        </span>
        <span
          className={`mt-0.5 text-xs font-semibold tracking-loose ${
            tone === 'light' ? 'text-brand-firm' : 'text-brand'
          }`}
        >
          INVENTARIS
        </span>
      </span>
    </span>
  )
}
