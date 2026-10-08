/**
 * The app's inline icon set.
 *
 * There is no icon dependency and no sprite: the design draws every glyph as a raw path,
 * and the ones the frames this app ports actually use are reproduced here. Each `viewBox`
 * is the glyph's tight bounding box taken from the design, so the height follows the
 * glyph's own aspect ratio and a caller only ever states a width.
 *
 * Two kinds of glyph live here, and the difference is deliberate:
 *
 *  - `package`, `projector`, `camera`, `speaker`, `arrow-right` and `arrow-left` are the
 *    design's paths verbatim, only translated so their coordinates start at 0 (the arrow
 *    is mirrored for `arrow-left`). They are fill-only paths drawn with `fill-rule`
 *    `evenodd`, which is how the design gets an outline out of a single path.
 *  - `envelope`, `lock`, `eye` and `eye-off` are drawn in the same visual language — a
 *    ~1.2px outline, which is the design's own small-icon weight (its `projector` glyph is
 *    1.14px) — because the login card is the only frame that uses them and the design ships
 *    them as named icons rather than inline paths.
 *
 * Every icon paints with `currentColor`, so colour comes from the surrounding `text-*`
 * utility. That is how the design pairs them: `neutral.mid` inside a field, `tertiary.mid`
 * on a brand-yellow button, `primary.soft` on the navy login background.
 */

/** Width in px. The design states a size per placement; omit it to use the glyph's own. */
export type IconProps = {
  size?: number
  className?: string
}

function px(width: number, viewBoxHeight: number, viewBoxWidth: number) {
  return Math.round(((width * viewBoxHeight) / viewBoxWidth) * 100) / 100
}

/* -------------------------------------------------------------------------- */
/* The design's own paths                                                      */
/* -------------------------------------------------------------------------- */

/** The guest card's icon-tile glyph: a 26×28.16 box, open at the top corner. */
export function IconPackage({ size = 26, className }: IconProps) {
  return (
    <svg
      viewBox="15 13.92 26 28.16"
      width={size}
      height={px(size, 28.16, 26)}
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M28.96,14.25 L39.96,20.27 C40.6,20.62 41,21.29 41,22.02 L41,33.98 C41,34.71 40.6,35.38 39.96,35.73 L28.96,41.75 C28.36,42.08 27.64,42.08 27.04,41.75 L16.04,35.73 C15.4,35.38 15,34.71 15,33.98 L15,22.02 C15,21.29 15.4,20.62 16.04,20.27 L27.04,14.25 C27.64,13.92 28.36,13.92 28.96,14.25 Z M28,16 L38.05,21.5 L34.32,23.54 L24.28,18.04 L28,16 Z M28,27 L17.95,21.5 L22.19,19.18 L32.24,24.68 L28,27 Z M17,23.25 L27,28.72 L27,39.45 L17,33.98 L17,23.25 Z M39,33.98 L29,39.45 L29,28.73 L33,26.54 L33,31 C33,31.55 33.45,32 34,32 C34.55,32 35,31.55 35,31 L35,25.44 L39,23.25 L39,33.97 L39,33.98 Z"
      />
    </svg>
  )
}

/** "Proyektor" chip: a 14.86×16 projector body on its foot. */
export function IconProjector({ size = 14.86, className }: IconProps) {
  return (
    <svg
      viewBox="12 8.5 14.86 16"
      width={size}
      height={px(size, 16, 14.86)}
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M26.86,9.65 L26.86,10.79 C26.86,11.42 26.35,11.93 25.72,11.93 L25.72,18.79 L26.29,18.79 C26.61,18.79 26.86,19.04 26.86,19.36 C26.86,19.68 26.61,19.93 26.29,19.93 L20,19.93 L20,21.17 C20.79,21.45 21.26,22.26 21.12,23.08 C20.98,23.9 20.26,24.5 19.43,24.5 C18.6,24.5 17.88,23.9 17.74,23.08 C17.6,22.26 18.07,21.45 18.86,21.17 L18.86,19.93 L12.57,19.93 C12.25,19.93 12,19.68 12,19.36 C12,19.04 12.25,18.79 12.57,18.79 L13.14,18.79 L13.14,11.93 C12.51,11.93 12,11.42 12,10.79 L12,9.65 C12,9.02 12.51,8.5 13.14,8.5 L25.72,8.5 C26.35,8.5 26.86,9.02 26.86,9.65 Z M19.43,23.36 C19.11,23.36 18.86,23.11 18.86,22.79 C18.86,22.47 19.11,22.22 19.43,22.22 C19.75,22.22 20,22.47 20,22.79 C20,23.11 19.75,23.36 19.43,23.36 Z M13.14,9.65 L25.72,9.65 L25.72,10.79 L13.14,10.79 L13.14,9.65 Z M24.57,18.79 L14.29,18.79 L14.29,11.93 L24.57,11.93 L24.57,18.79 Z"
      />
    </svg>
  )
}

/** "Kamera" chip: a 16×14.16 camera body with its lens. */
export function IconCamera({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="12 9.42 16 14.16"
      width={size}
      height={px(size, 14.16, 16)}
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M24.02,11.27 L26.15,11.27 C27.17,11.27 28,12.1 28,13.12 L28,21.73 C28,22.75 27.17,23.58 26.15,23.58 L13.85,23.58 C12.83,23.58 12,22.75 12,21.73 L12,13.12 C12,12.1 12.83,11.27 13.85,11.27 L15.98,11.27 L17.03,9.7 C17.14,9.53 17.33,9.42 17.54,9.42 L22.46,9.42 C22.67,9.42 22.86,9.53 22.97,9.7 L24.02,11.27 Z M26.77,21.73 C26.77,22.07 26.49,22.35 26.15,22.35 L13.85,22.35 C13.51,22.35 13.23,22.07 13.23,21.73 L13.23,13.12 C13.23,12.78 13.51,12.5 13.85,12.5 L16.31,12.5 C16.52,12.5 16.71,12.4 16.82,12.23 L17.87,10.65 L22.13,10.65 L23.18,12.23 C23.29,12.4 23.48,12.5 23.69,12.5 L26.15,12.5 C26.49,12.5 26.77,12.78 26.77,13.12 L26.77,21.73 Z"
      />
      <path
        fillRule="evenodd"
        d="M16.62,17.12 C16.62,15.25 18.13,13.73 20,13.73 C21.87,13.73 23.38,15.25 23.38,17.12 C23.38,18.99 21.87,20.5 20,20.5 C18.13,20.5 16.62,18.99 16.62,17.12 Z M20,19.27 C18.81,19.27 17.85,18.31 17.85,17.12 C17.85,15.93 18.81,14.96 20,14.96 C21.19,14.96 22.15,15.93 22.15,17.12 C22.15,18.31 21.19,19.27 20,19.27 Z"
      />
    </svg>
  )
}

/** "Audio" chip: a 16×14.41 speaker cone with two sound waves. */
export function IconSpeaker({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="12 9.29 16 14.41"
      width={size}
      height={px(size, 14.41, 16)}
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M21.04,9.44 C21.21,9.31 21.43,9.29 21.62,9.38 C21.81,9.47 21.93,9.66 21.93,9.87 L21.93,23.12 C21.93,23.33 21.81,23.52 21.62,23.61 C21.43,23.7 21.21,23.68 21.04,23.55 L16.22,19.81 L13.1,19.81 C12.49,19.81 12,19.31 12,18.7 L12,14.29 C12,13.68 12.49,13.18 13.1,13.18 L16.22,13.18 L21.04,9.44 Z M13.1,14.29 L15.86,14.29 L15.86,18.7 L13.1,18.7 L13.1,14.29 Z M20.83,21.99 L16.97,18.98 L16.97,14.01 L20.83,11 L20.83,21.99 Z"
      />
      <path d="M24.55,14.67 C25.47,15.71 25.47,17.28 24.55,18.32 C24.35,18.54 24.01,18.56 23.78,18.36 C23.55,18.16 23.52,17.82 23.72,17.59 C24.27,16.96 24.27,16.03 23.72,15.4 C23.52,15.17 23.55,14.83 23.78,14.63 C24.01,14.43 24.35,14.45 24.55,14.67 Z" />
      <path d="M28,16.5 C28,17.86 27.51,19.16 26.6,20.17 C26.4,20.39 26.04,20.41 25.82,20.21 C25.6,20.01 25.57,19.67 25.77,19.44 C27.27,17.76 27.27,15.23 25.77,13.55 C25.63,13.4 25.59,13.2 25.65,13.01 C25.71,12.82 25.87,12.68 26.07,12.64 C26.27,12.6 26.47,12.67 26.6,12.82 C27.51,13.83 28,15.14 28,16.5 Z" />
    </svg>
  )
}

/**
 * The design's arrow: an 18×15.14 glyph used on every call to action, on the
 * how-it-works separators, and in the footer. Coordinates are the design's own, shifted
 * so the glyph starts at 0.
 */
export function IconArrowRight({ size = 18, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 18 15.14"
      width={size}
      height={px(size, 15.14, 18)}
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.78,8.1 L11.04,14.85 C10.75,15.14 10.26,15.14 9.97,14.85 C9.68,14.56 9.68,14.08 9.97,13.79 L15.44,8.32 L0.75,8.32 C0.34,8.32 0,7.98 0,7.57 C0,7.16 0.34,6.82 0.75,6.82 L15.44,6.82 L9.97,1.35 C9.68,1.06 9.68,0.58 9.97,0.29 C10.26,0 10.75,0 11.04,0.29 L17.78,7.04 C17.92,7.18 18,7.37 18,7.57 C18,7.77 17.92,7.96 17.78,8.1 Z" />
    </svg>
  )
}

/** The same glyph mirrored, for the login card's "Kembali ke beranda" link. */
export function IconArrowLeft({ size = 18, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 18 15.14"
      width={size}
      height={px(size, 15.14, 18)}
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M0.22,8.1 L6.96,14.85 C7.25,15.14 7.74,15.14 8.03,14.85 C8.32,14.56 8.32,14.08 8.03,13.79 L2.56,8.32 L17.25,8.32 C17.66,8.32 18,7.98 18,7.57 C18,7.16 17.66,6.82 17.25,6.82 L2.56,6.82 L8.03,1.35 C8.32,1.06 8.32,0.58 8.03,0.29 C7.74,0 7.25,0 6.96,0.29 L0.22,7.04 C0.08,7.18 0,7.37 0,7.57 C0,7.77 0.08,7.96 0.22,8.1 Z" />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/* Outline glyphs                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A 1.2px outline, the weight the design uses for its small icons.
 *
 * `strokeLinecap`/`strokeLinejoin` are left at `round` throughout, which is what keeps a
 * 1.2px stroke legible at 14–16px — a mitred corner at this weight is a smudge.
 */
const outline = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** "Email Pengurus": a 16×12.3 envelope. */
export function IconEnvelope({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 12.3"
      width={size}
      height={px(size, 12.3, 16)}
      aria-hidden="true"
      className={className}
    >
      <rect x="0.6" y="0.6" width="14.8" height="11.1" rx="1.1" {...outline} />
      <path d="M1.6 2.3 L8 6.35 L14.4 2.3" {...outline} />
    </svg>
  )
}

/** "Kata Sandi": a 14.22×16 padlock. */
export function IconLock({ size = 14.22, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 14.22 16"
      width={size}
      height={px(size, 16, 14.22)}
      aria-hidden="true"
      className={className}
    >
      <path d="M4.1 6.6 V3.6 A3.01 3.01 0 0 1 10.12 3.6 V6.6" {...outline} />
      <rect x="0.6" y="6.6" width="13.02" height="8.8" rx="1.6" {...outline} />
    </svg>
  )
}

/** The password field's reveal toggle, in its "hidden" state: a 16×10.66 eye. */
export function IconEye({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 10.66"
      width={size}
      height={px(size, 10.66, 16)}
      aria-hidden="true"
      className={className}
    >
      <path
        d="M0.6 5.33 C2.6 1.9 5.2 0.6 8 0.6 C10.8 0.6 13.4 1.9 15.4 5.33 C13.4 8.76 10.8 10.06 8 10.06 C5.2 10.06 2.6 8.76 0.6 5.33 Z"
        {...outline}
      />
      <circle cx="8" cy="5.33" r="2.35" {...outline} />
    </svg>
  )
}

/** The reveal toggle in its "shown" state: the eye struck through. */
export function IconEyeOff({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 10.66"
      width={size}
      height={px(size, 10.66, 16)}
      aria-hidden="true"
      className={className}
    >
      <path
        d="M0.6 5.33 C2.6 1.9 5.2 0.6 8 0.6 C10.8 0.6 13.4 1.9 15.4 5.33 C13.4 8.76 10.8 10.06 8 10.06 C5.2 10.06 2.6 8.76 0.6 5.33 Z"
        {...outline}
      />
      <circle cx="8" cy="5.33" r="2.35" {...outline} />
      <path d="M2.1 0.7 L13.9 9.96" {...outline} />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/* Sidebar and topbar glyphs                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The admin shell's row and chrome glyphs.
 *
 * The design's sidebar draws one glyph per row and names each in the Kit; the app has no
 * icon dependency, so they are drawn here in the same visual language as the login card's
 * glyphs — a 1.2px outline on a 16px box, `currentColor` throughout so a row's active
 * state colours the glyph along with its label.
 */

/** "Dasbor": a 2×2 tile grid. */
export function IconDasbor({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <rect x="0.6" y="0.6" width="6.1" height="6.1" rx="1.4" {...outline} />
      <rect x="9.3" y="0.6" width="6.1" height="6.1" rx="1.4" {...outline} />
      <rect x="0.6" y="9.3" width="6.1" height="6.1" rx="1.4" {...outline} />
      <rect x="9.3" y="9.3" width="6.1" height="6.1" rx="1.4" {...outline} />
    </svg>
  )
}

/** "Barang": a crate, seen straight on. */
export function IconBarang({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <rect x="0.6" y="2.9" width="14.8" height="12.5" rx="1.4" {...outline} />
      <path d="M0.6 6.6 H15.4" {...outline} />
      <path d="M8 6.6 V15.4" {...outline} />
    </svg>
  )
}

/** "Kategori": stacked layers. */
export function IconKategori({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <path d="M8 1.5 L14.9 5.1 L8 8.7 L1.1 5.1 Z" {...outline} />
      <path d="M2.2 8.1 L8 11 L13.8 8.1" {...outline} />
      <path d="M2.2 11.2 L8 14.1 L13.8 11.2" {...outline} />
    </svg>
  )
}

/** "Peminjaman Aktif": a unit leaving the shelf. */
export function IconPeminjaman({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <rect x="0.6" y="4.1" width="6.6" height="7.8" rx="1.4" {...outline} />
      <path d="M9.6 8 H14.5" {...outline} />
      <path d="M12.3 5.8 L14.5 8 L12.3 10.2" {...outline} />
    </svg>
  )
}

/** "Pengembalian": a unit coming back. */
export function IconPengembalian({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <path d="M2.4 4.6 H9.4 A4.2 4.2 0 0 1 9.4 13" {...outline} />
      <path d="M5.4 1.6 L2.4 4.6 L5.4 7.6" {...outline} />
    </svg>
  )
}

/** "Permintaan": an inbox tray. */
export function IconPermintaan({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <path
        d="M1.4 9.1 L3.7 2.9 A1.4 1.4 0 0 1 5 2 H11 A1.4 1.4 0 0 1 12.3 2.9 L14.6 9.1 V12.5 A1.4 1.4 0 0 1 13.2 13.9 H2.8 A1.4 1.4 0 0 1 1.4 12.5 Z"
        {...outline}
      />
      <path d="M1.4 9.1 H5.3 L6.5 11.3 H9.5 L10.7 9.1 H14.6" {...outline} />
    </svg>
  )
}

/** "Laporan": a bar chart. */
export function IconLaporan({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <path d="M1.6 14.4 H14.4" {...outline} />
      <rect x="3.1" y="9.4" width="2.6" height="4.2" rx="0.7" {...outline} />
      <rect x="6.7" y="6.4" width="2.6" height="7.2" rx="0.7" {...outline} />
      <rect x="10.3" y="3.4" width="2.6" height="10.2" rx="0.7" {...outline} />
    </svg>
  )
}

/** "Pengguna": two people. */
export function IconPengguna({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <circle cx="5.9" cy="4.9" r="2.9" {...outline} />
      <path
        d="M1.3 14.4 C1.3 11.4 3.4 9.5 5.9 9.5 C8.4 9.5 10.5 11.4 10.5 14.4"
        {...outline}
      />
      <path d="M10.7 2.4 A2.9 2.9 0 0 1 10.7 7.4" {...outline} />
      <path d="M12.4 9.9 C13.9 10.7 14.7 12.4 14.7 14.4" {...outline} />
    </svg>
  )
}

/** "Log Aktivitas": a list. */
export function IconLog({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <path d="M5.6 3.4 H14.4" {...outline} />
      <path d="M5.6 8 H14.4" {...outline} />
      <path d="M5.6 12.6 H14.4" {...outline} />
      <circle cx="2.2" cy="3.4" r="0.95" fill="currentColor" />
      <circle cx="2.2" cy="8" r="0.95" fill="currentColor" />
      <circle cx="2.2" cy="12.6" r="0.95" fill="currentColor" />
    </svg>
  )
}

/** The topbar's notification affordance. */
export function IconBell({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <path
        d="M8 1.6 C5.7 1.6 3.9 3.4 3.9 5.7 V9.1 L2.6 11.7 H13.4 L12.1 9.1 V5.7 C12.1 3.4 10.3 1.6 8 1.6 Z"
        {...outline}
      />
      <path d="M6.3 13.6 A1.8 1.8 0 0 0 9.7 13.6" {...outline} />
    </svg>
  )
}

/** The account menu's disclosure caret. */
export function IconChevronDown({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <path d="M3.6 6.2 L8 10.6 L12.4 6.2" {...outline} />
    </svg>
  )
}

/** The account menu's "Profil Saya" row. */
export function IconProfil({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <circle cx="8" cy="8" r="7.2" {...outline} />
      <circle cx="8" cy="6.3" r="2.3" {...outline} />
      <path
        d="M3.6 13.2 C4.6 11.3 6.2 10.3 8 10.3 C9.8 10.3 11.4 11.3 12.4 13.2"
        {...outline}
      />
    </svg>
  )
}

/** The account menu's "Keluar" row. */
export function IconLogout({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <path
        d="M9.5 14.4 H3.5 A1.5 1.5 0 0 1 2 12.9 V3.1 A1.5 1.5 0 0 1 3.5 1.6 H9.5"
        {...outline}
      />
      <path d="M10.9 5.3 L13.6 8 L10.9 10.7" {...outline} />
      <path d="M13.6 8 H6.3" {...outline} />
    </svg>
  )
}
