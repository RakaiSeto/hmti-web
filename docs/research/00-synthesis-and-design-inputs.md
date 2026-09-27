# 00 — Synthesis: what we know, and what the design system must decide

Read this first. It consolidates `01`, `02` and `03` into the decisions that actually shape a
design system. Everything here traces back to a cited claim in one of those documents.

---

## 1. The three identity layers (the core structural insight)

HMTI Polinema does not have one visual identity. It has **three, stacked**, and they currently
have no governance:

| Layer | What it is | Current state |
| --- | --- | --- |
| **A. Organisational brand** | The seal: yellow badge, royal-blue gear, `HMTI` wordmark. Plus `#FFE600`. | Stable and consistent across every channel — this is the brand. |
| **B. Cabinet campaign** | A per-year theme owned by the sitting cabinet. 2026 = **Kabinet Adhigana**, whose Instagram feed is built on a **maroon/oxblood** ground (`#5C1A1C`–`#805954`) with a white→gold script + condensed-caps headline lockup. | Rebuilt from scratch every year. Currently shares nothing with layer A. |
| **C. Event sub-brands** | `TI-COMPSTREAM`, `Seminar Nasional`, `Malam Keakraban`, `Study Excursie`, `Dies Natalis`, `Expo Kelembagaan`, … | Each has ad-hoc artwork. No templates, no shared rules. |

**A design system that only serves layer A will be ignored**, because the visible output of this
organisation is overwhelmingly layer B and C. The system must either (a) explicitly scope to A
and hand B/C a *constrained* set of templates, or (b) provide a theming mechanism so a cabinet
can re-skin without leaving the system. **This is decision #1 and it should be made before any
token is written.**

---

## 2. Recommended token seed

Derived from measured evidence. Values marked ⚠ require an organisational decision.

### Colour

| Token | Value | Status | Evidence |
| --- | --- | --- | --- |
| `brand.yellow` | **`#FFE600`** | ✅ Safe | The only custom colour in the production CSS; matches the logo's measured `#FFE603`. Legitimised at institutional level by the JTI flag colour `#FDF018` (Statuta Pasal 6). |
| `brand.blue` | **`#041587`** ⚠ | ⚠ **Contested** | Median of the master logo. But every export disagrees: `#041584` (IG), `#1D1873` (LinkedIn), `#130A4B` (YouTube), `#322261` (TikTok). No vector original exists. |
| `brand.orange` | **`#A54105`** | ✅ Safe | Measured on both logo strokes. Use as a stroke/tertiary only (4.93:1 on yellow — large text or larger). |
| `ink` | **`#0A0A0A`** | ✅ Safe | Existing `--foreground` / `--primary-foreground`. |
| `surface` | `#FFFFFF` / `#F5F5F5` / `#E5E5E5` | ✅ Safe | Existing shadcn neutral set, already in production. |

**Hard rules derived from computed contrast** (full table in `01` §4.2):

- `#FFE600` **on white = 1.27:1** → yellow is a *fill* colour, never text on light.
- `#FFE600` **on `#0A0A0A` = 15.62:1** → the existing site pairing is correct; keep it.
- `#041587` **on white = 14.36:1** → the strongest brand-native colour available for light-mode
  text, links and actions. **The current site never uses it. This is the biggest available win.**
- `#041587` **on `#0A0A0A` = 1.38:1** → **must not** be used as-is in dark mode. A lightened
  blue ramp is mandatory if a dark theme ships.

### Typography

- **Montserrat** — the working typeface (applied on `<body>`, used for both display and body).
  Variable, self-hosted. Make this the system's primary family.
- **Inter** — loaded and available via `--font-inter` but **never applied**. Either adopt it as a
  secondary/UI/numeric face or drop it. ⚠ decision.
- **Arial** — mandated by the Statuta for Polinema lambang lettering. Relevant only if HMTI
  artwork must carry the institutional crest. Do not use Arial for HMTI's own type.
- Existing scale in use: `xs · sm · lg · xl · 2xl · 3xl · 4xl · 5xl`; weights `300/500/600/700`.

### Layout, radius, motion

| Token | Value | Source |
| --- | --- | --- |
| Container | `max-w-6xl` (72rem) | Live site markup |
| Gutter | `px-4` → `sm:px-6` → `lg:px-8` | Live site markup |
| Section rhythm | `py-24` (96px) | Live site markup |
| Radius | ⚠ **conflict** — `--radius: 0.625rem` (10px) is declared but markup uses `rounded-md/lg/xl` (6/8/12px) | Live site CSS + markup |
| Focus ring | `ring-[3px]`, `ring-ring/50`, `border-ring` | Live site markup — good a11y, keep it |
| Transition | `--default-transition-duration: .15s`, `cubic-bezier(.4,0,.2,1)` | Live site CSS |

---

## 3. The logo problem (blocking)

The organisation has **no vector logo and no variants**.

| Have | Need |
| --- | --- |
| One 1705×1732 transparent PNG (1.86 MB) | SVG master |
| One 256×260 WebP (17 KB) | Mono black variant |
| A "favicon.ico" that is actually WebP bytes | Mono white/knockout variant |
| — | Centre-mark-only lockup (for sizes below ~96 px) |
| — | Real multi-size favicon set |
| — | Documented clear space + minimum size + forbidden uses |

**Measured proportions for the redraw** (from `01` §3.3): badge is circular, 1:1; outer orange
stroke ≈ 1.2% of badge width; yellow ring band ≈ 18.4%; inner orange stroke ≈ 1.0%; blue centre
field ≈ 61.6%. Preserve these.

**The only logo rule the organisation has ever published** is in the media-partner terms:
partners must *"mencantumkan logo HMTI"*. There is no clear-space, minimum-size, or
colour-variant rule anywhere.

---

## 4. What already exists and should be extended, not replaced

The live site is a **Next.js App Router + Tailwind v4 + shadcn/ui** project with a complete
token set already in production. It is light-first, high-whitespace, card-based, and uses yellow
as a disciplined accent. **Adopt its conventions**: the same token names, the same component
inventory (button variants, nav with active underline, hero banner, two-column text section,
bordered info card, article card, footer lockup), the same radius/focus behaviour.

Defects to fix while we are in there (`01` §6.4): a broken article thumbnail, `PERIODE 2025/2026`
vs `2026/2027` drift, `og:url`/`og:image` pointing at the dead `hmtipolinema.org`, a fake
favicon, a shipped `google-site-verification` placeholder, and a compiled-but-unexposed dark theme.

---

## 5. Open decisions blocking the build

Ordered by how much they block:

1. **Scope** — does the system cover only layer A, or must it also theme layers B and C? (§1)
2. **Canonical blue** — what is `brand.blue`, really? Every export disagrees. (§2)
3. **Dark mode** — ship it or delete the dead tokens? If shipped, the blue ramp must be lightened.
4. **Typeface authority** — Montserrat, or Montserrat + Inter?
5. **Radius** — resolve the `0.625rem` token vs `rounded-md/lg/xl` markup conflict.
6. **Cabinet theming** — is a per-cabinet palette a supported feature or an out-of-scope rogue?
7. **Vector logo** — commission/redraw, and confirm the intended blue at the same time.
8. **Domain** — is `hmtipolinema.org` becoming canonical?

---

## 6. Evidence quality

| Layer | Confidence | Notes |
| --- | --- | --- |
| Organisational identity, contacts, structure | **High** | Primary sources, live site + official regulations |
| Colour, typography, layout tokens | **High** | Extracted from production CSS/JS, pixel-measured assets |
| Institutional (Polinema/JTI) constraints | **High** | Backed by a national regulation (Permenristekdikti 20/2019) |
| Social presence and vocabulary | **High** | 674-line cited harvest; some fields login-walled |
| Canonical brand blue | **Low** | Rasters only; exports disagree |
| Historical versions of any page | **None** | Internet Archive was offline during the whole session |

Full limitations and per-claim sources: `01` §9, `02` §7, `03` §8.
