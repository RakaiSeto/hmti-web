# 01 — HMTI Polinema: brand & design research

**Scope:** establish the ground truth about HMTI Polinema's identity, logo, colour, type, and
the design system already implied by its live website — so we can build a design system on
measured facts rather than invented ones.

**Method:** direct inspection of primary sources (the live site's HTML/CSS/JS bundles, the
official logo file, official institutional pages) plus pixel-level analysis of the brand
assets. Every non-obvious claim below carries its source. Where a fact could not be verified,
it is marked **UNVERIFIED** rather than guessed.

**Researched:** 2026-09-27 · **Repo state:** no application code yet.

---

## 0. TL;DR — the findings that actually constrain the design system

1. **The name is "Teknologi Informasi", not "Teknik Informatika".** HMTI = Himpunan Mahasiswa
   **Teknologi Informasi**. Many unrelated "HMTI" organisations exist at other Indonesian
   campuses; none of their branding is relevant here.
2. **The brand colour is already declared in code: `#FFE600`.** It is the only custom colour in
   the live site's entire theme (`--primary`). Everything else is stock shadcn/ui neutral.
3. **The logo carries a deep royal blue (`≈#041587`) and a burnt-orange stroke (`≈#A54105`) that
   the live website completely ignores.** The current site is effectively *yellow + neutrals*.
   The blue is the biggest unused asset in the brand.
4. **`#FFE600` is a fill, never a text colour on light backgrounds.** Measured contrast is
   **1.27:1** against white (fails everything) but **15.62:1** against the site's ink `#0A0A0A`.
   The existing site already pairs them correctly.
5. **`#041587` is a superb light-mode text/action colour (14.36:1 on white) and a terrible
   dark-mode one (1.38:1 on `#0A0A0A`).** Any dark theme needs a lightened blue ramp.
6. **There is no vector logo.** No SVG exists at any probed path (404). We have a 1705×1732
   raster PNG with transparency. A clean vector redraw is a prerequisite for a real design system.
7. **The live site is already a shadcn/ui + Tailwind v4 system** with a documented token set
   (below). We should extend it, not replace it.

---

## 1. Who HMTI Polinema is

| Fact | Value | Source |
| --- | --- | --- |
| Full name | Himpunan Mahasiswa Teknologi Informasi | <https://hmti.polinema.ac.id/> |
| Parent | Jurusan Teknologi Informasi (JTI), Politeknik Negeri Malang | <https://jti.polinema.ac.id/> |
| Founded | **7 March 2015** | Site "About HMTI" text: *"HMTI berdiri pada tanggal 7 Maret 2015"* |
| Current period | **2026/2027** | Site hero + header, <https://hmti.polinema.ac.id/> |
| Cabinet — as printed on the website | `KOMINFO XI` | `<meta name="author">`, footer "MADE BY KOMINFO XI" |
| Cabinet — **actually current** | **`Kabinet Adhigana`**, term 2026/2027, the **12th** cabinet | TikTok bio `KABINET ADHIGANA 2026/2027`; `#HMTI12Polinema` on 11/11 Instagram permalinks — see `02-social-presence.md` §5 |
| Departments | BPH · Internal · PSDM · RMB · Eksternal · Kominfo | <https://hmti.polinema.ac.id/struktur> |
| Address | Jl. Soekarno Hatta No. 9, Jatimulyo, Kec. Lowokwaru, Kota Malang, Jawa Timur 65141 | Site footer |
| Email | hmtipolinema@gmail.com | Site footer |
| Contact persons | Kaur RT +62 851-9624-1365 · Humas HMTI +62 851-6664-3421 | <https://hmti.polinema.ac.id/contact> |

**Self-description (verbatim, from the site):**

> "Himpunan Mahasiswa Teknologi Informasi atau yang biasa disebut HMTI adalah Himpunan
> Mahasiswa yang dinaungi oleh Jurusan Teknologi Informasi sebagai wadah dan aspirasi serta
> pelayanan bagi Mahasiswa Jurusan Teknologi Informasi."

**Visi (verbatim):**

> "Meningkatkan Himpunan Mahasiswa Teknologi Informasi yang semakin sinergis dan berprestasi,
> serta mendukung pengembangan kompetensi dan peningkatan penyaluran aspirasi mahasiswa
> Jurusan Teknologi Informasi."

**Misi (verbatim):**

> 1. "Menguatkan sinergi antar anggota Himpunan Mahasiswa Teknologi Informasi untuk peningkatan
>    kompetensi, serta menciptakan ekosistem organisasi yang prestatif."
> 2. "Menjalankan program kerja yang berfokus pada peningkatan prestasi akademik dan non
>    akademik yang bersifat jangka panjang."
> 3. "Peningkatan Efektivitas Wadah Penyaluran Aspirasi mahasiswa Jurusan Teknologi Informasi."

**Naming caution.** JTI also runs off-campus programmes (PSDKU) at Kediri, Pamekasan and
Lumajang (<https://jti.polinema.ac.id/>). Those campuses run their own HMTI chapters with
their own social accounts — e.g. `@hmti.psdku_lumajang`, which uses the hashtag `#TI_UNITE`
instead of the Malang chapter's `#TI_FAST #TI_BRAVO`. Do not merge their identities.

---

## 2. Official channels and reachability

| Platform | Handle | URL | Verified |
| --- | --- | --- | --- |
| Website | — | <https://hmti.polinema.ac.id> | HTTP 200 |
| Website (declared) | — | `https://hmtipolinema.org` | **NXDOMAIN — does not resolve** |
| Instagram | `@hmtipolinema` | <https://www.instagram.com/hmtipolinema/> | HTTP 200 |
| LinkedIn | `hmti-polinema` | <https://www.linkedin.com/company/hmti-polinema/> | HTTP 200 |
| TikTok | `@hmtipolinema` | <https://www.tiktok.com/@hmtipolinema> | HTTP 200 |
| YouTube | **`@HMTIPolinemaa`** — the site's `@HMTIPolinema` is wrong | <https://www.youtube.com/@HMTIPolinemaa> | **RESOLVED:** `@HMTIPolinema` → 404; `@HMTIPolinemaa` renders (2.3K subs, 136 videos) |
| X / Twitter | `@hmtipolinema` (site) / `@HMTIPolinema` / printed as `@HMTlpolinema` in post footers | <https://twitter.com/hmtipolinema> | linked from site; footer string has a **lowercase-L** typo |
| Facebook | `HMTIPolinema` | <https://www.facebook.com/HMTIPolinema> | via search index |
| Merchandise IG | `@hmti.goods` | linked in the Instagram bio | via search index |

**Infrastructure fact:** `hmti.polinema.ac.id` is a CNAME to **`hmtipolinema.pages.dev`** —
i.e. the site is served from **Cloudflare Pages**. The site itself is a **Next.js App Router**
build (Turbopack chunks, `next-size-adjust` meta, `next/font`).

**Known inconsistencies to resolve before designing:**

- The canonical/OG URL metadata points at `https://hmtipolinema.org`, a domain that does not
  resolve. The OG image is likewise an absolute URL on that dead domain.
- The site links the YouTube handle `@HMTIPolinema`, which returns **404**. The working
  channel is **`@HMTIPolinemaa`** (double "a") — confirmed by direct render.
- The site's `KOMINFO XI` authorship is **stale**: the live cabinet is `Kabinet Adhigana`
  (12th, 2026/2027).
- `<meta name="google-site-verification" content="your-google-verification-code">` — a
  placeholder value is still shipped in production.

**Organisation vocabulary found in the wild:**

- Hashtags: `#TI_FAST`, `#TI_BRAVO` (Malang chapter); `#TI_UNITE` (PSDKU Lumajang).
- Site tagline pattern: "HIMPUNAN MAHASISWA TEKNOLOGI INFORMASI / POLITEKNIK NEGERI MALANG /
  PERIODE <year>/<year>".
- Article style example: *"Revealing the IT Workplace: Bridging Knowledge and Adapting to the
  real World of IT Workplace"* (Study Excursie 2024).

---

## 3. The logo

### 3.1 File inventory (archived in this repo)

| Repo path | Format | Dimensions | Size | Notes |
| --- | --- | --- | --- | --- |
| `assets/brand/logo/hmti-logo-master-1705x1732.png` | PNG RGBA | 1705 × 1732 | 1.86 MB | **Master.** Transparent background. Far too heavy for web. |
| `assets/brand/logo/hmti-logo-256.webp` | WebP RGBA | 256 × 260 | 17 KB | The production web size used by the site. |
| `assets/brand/logo/hmti-favicon.ico` | **WebP, not ICO** | 256 × 260 | 17 KB | Byte-identical to the WebP above — the "favicon" is just the logo re-served. |
| `research-shots/logo-full-color.png` | PNG | 689 × 700 | — | Rendered reference view. |
| `research-shots/logo-mark-center.png` | PNG | 630 × 640 | — | Centre-mark detail crop. |

**No SVG exists.** Probed `…/images/logo/logo-hmti.svg`, `-white`, `-dark`, `-putih` → all
**HTTP 404**. The only logo ever served by the site is the raster PNG/WebP pair.

**Alpha behaviour:** 23.2% of master pixels are fully transparent, 76.2% fully opaque — the
mark is a clean cut-out and works on any background without a knock-out box.

### 3.2 Anatomy of the mark

A single circular badge, read outside-in:

1. **Burnt-orange outer stroke** — a thin ring around the whole badge.
2. **Yellow field** — the wide outer band.
3. **Black arc lettering** — uppercase, evenly letter-spaced, following the circle:
   `HIMPUNAN MAHASISWA TEKNOLOGI INFORMASI` over the top arc,
   `POLINEMA` along the bottom, separated by **two round black bullet dots** at 3 and 9 o'clock.
4. **Inner burnt-orange stroke** — separates the yellow band from the centre field.
5. **Deep royal-blue gear (cog)** — rounded teeth, inscribed in the inner circle.
6. **White circuit traces** — straight lines radiating from the centre with round **node dots**
   at their ends; four or five traces.
7. **White monitor** — rounded-rect screen on a small trapezoid stand, centred.
8. **`HMTI` wordmark** — heavy uppercase sans, in white, inside the monitor screen.
9. **Three white signal arcs** — a "Wi-Fi"/broadcast motif at the monitor's upper right.

Semantics are self-evident from the iconography: *cog* = engineering/technical craft,
*circuit + nodes* = information technology, *monitor + broadcast arcs* = computing and
connectivity, *circle* = a unified student body.

### 3.3 Measured geometry

Measured on the 1705×1732 master via alpha-bounding-box and run-length scans of the centre row
and centre column. Badge width `W` = 1694 px (the drawn circle inside the canvas).

| Element | Measured | As % of badge width |
| --- | --- | --- |
| Badge outer diameter | 1694 × 1704 px | 100% (essentially circular, 1:1) |
| Outer orange stroke | 19–20 px | **≈ 1.2%** |
| Yellow ring band (outer stroke → inner stroke) | ≈ 311 px total | **≈ 18.4%** |
| Inner orange stroke | 12–18 px | **≈ 1.0%** |
| Blue centre field diameter | ≈ 1044 px | **≈ 61.6%** |
| Arc text cap-height | ≈ 20 px stroke | ≈ 1.2% |

> Practical upshot: **minimum legible size ≈ 96 px / 24 mm** for the full badge (below that the
> arc lettering and the inner strokes collapse). Below that, use the **centre mark alone**
> (gear + monitor) or the wordmark. This is a derived recommendation, not an official rule —
> no official minimum size is published anywhere.

### 3.4 Measured logo colours

Extracted with per-channel masks over fully-opaque pixels (mean and median both reported,
because the master is a raster export with anti-aliasing and light compression noise).

| Role | Median | Mean | Notes |
| --- | --- | --- | --- |
| Brand yellow | `#FFE603` | `#FDE604` | Matches the declared `#FFE600` — treat **`#FFE600`** as canonical. |
| Brand blue | `#041587` | `#031186` | Deep royal/navy. Not declared anywhere in code — and **not stable across exports**: the same seal measures `#041584` (Instagram pfp), `#1D1873` (LinkedIn), `#130A4B` (YouTube), `#322261` (TikTok). See `02-social-presence.md` §6. |
| Burnt-orange stroke | `#A54105` | `#A54007` | Used for both badge strokes. |
| Ink | `#060202` | `#090306` | Arc lettering and bullets — effectively black. |
| White | `#FFFFFF` | `#FDFDFB` | Monitor, traces, arcs, wordmark. |

Because the yellow channel spreads from `#FCE503` to `#FEE705`, the mark was almost certainly
exported from a vector original and rasterised — another argument for a proper redraw.

---

## 4. Colour

### 4.1 The declared system (live site)

The entire theme is **shadcn/ui "neutral"** with exactly **one** substitution: `--primary`.
Extracted from the production stylesheet (`assets/brand/reference/live-site-theme.css`).

| Token | Light | Dark |
| --- | --- | --- |
| `--background` | `#FFFFFF` | `#0A0A0A` |
| `--foreground` | `#0A0A0A` | `#FAFAFA` |
| `--card` / `--popover` | `#FFFFFF` | `#171717` |
| `--card-foreground` | `#0A0A0A` | `#FAFAFA` |
| **`--primary`** | **`#FFE600`** | **`#FFE600`** |
| `--primary-foreground` | `#0A0A0A` | `#0A0A0A` |
| `--secondary` / `--muted` / `--accent` | `#F5F5F5` | `#262626` |
| `--muted-foreground` | `#737373` | `#A1A1A1` |
| `--destructive` | `#E40014` | `#FF6568` |
| `--border` / `--input` | `#E5E5E5` | `rgba(255,255,255,.10)` / `.15` |
| `--ring` | `#A1A1A1` | `#737373` |
| `--radius` | `0.625rem` (10px) | — |

**Verification:** a hex census across all 13 production JS/CSS bundles found **exactly two**
occurrences of `#ffe600` (light + dark) and **zero** occurrences of `#041686`/`#041587`. The
brand blue is genuinely absent from the codebase — it exists only inside the logo bitmap.

**Why yellow is defensible at the institutional level:** the Statuta Polinema (Permenristekdikti
No. 20/2019, Pasal 6 ayat 2g) specifies the **Jurusan Teknologi Informasi flag as yellow,
RGB 253,240,24 = `#FDF018`**. HMTI's `#FFE600` is a sibling of that legally-mandated JTI
colour — so the yellow brand has an official parent-institution hook. See
`03-institutional-brand.md` §3c.

### 4.2 Measured contrast (WCAG 2.1, computed)

| Pair | Ratio | AA text | AA large | AAA text |
| --- | --- | --- | --- | --- |
| `#FFE600` on `#0A0A0A` | **15.62** | PASS | PASS | PASS |
| `#FFE600` on `#171717` | 14.15 | PASS | PASS | PASS |
| `#FFE600` on `#041587` | 11.33 | PASS | PASS | PASS |
| **`#FFE600` on `#FFFFFF`** | **1.27** | **fail** | **fail** | **fail** |
| `#041587` on `#FFFFFF` | **14.36** | PASS | PASS | PASS |
| `#041587` on `#FFE600` | 11.33 | PASS | PASS | PASS |
| **`#041587` on `#0A0A0A`** | **1.38** | **fail** | **fail** | **fail** |
| `#A54105` on `#FFE600` | 4.93 | PASS | PASS | fail |
| `#A54105` on `#FFFFFF` | 6.25 | PASS | PASS | fail |
| `#737373` on `#FFFFFF` (site's muted text) | 4.74 | PASS | PASS | fail |

**Rules this implies:**

- Yellow is a **surface/fill** colour. Never set body text in yellow on white.
- On light surfaces, **`#041587` is the strongest brand-native colour available** — it beats the
  current `#0A0A0A`-only palette for links, primary actions and headings while staying on-brand.
- On dark surfaces, **do not use `#041587`** as-is. A lightened blue ramp is required
  (target ≥ 4.5:1 on `#0A0A0A`).
- `#A54105` is only safe for large text or as a stroke/border — never small body copy.

---

## 5. Typography

Two families are loaded via `next/font` and self-hosted as variable WOFF2:

| Family | CSS var | Weights | Where it is used |
| --- | --- | --- | --- |
| **Montserrat** | applied on `<body>` (`montserrat_…_variable`) | variable (300–700+ declared tokens) | The working typeface — headings **and** body. |
| **Inter** | `--font-inter` | variable, `100 900` | Loaded and available, but **not applied to `<body>`**. |

The stylesheet also declares `--font-sans: ui-sans-serif, system-ui, …` and
`--font-mono: ui-monospace, SFMono-Regular, …`, but `--font-sans` resolves to the generic
system stack — **Montserrat wins in practice** because it is set on the body element.

**Observed usage in the live design:**

- Hero: UPPERCASE, bold, very large, tight leading, white on a dark photographic scrim.
- Section headings: sentence case, bold, large (e.g. "About HMTI", "Artikel Terkini").
- Card headings: UPPERCASE bold ("VISI", "MISI").
- Body: regular, `--muted-foreground` grey, generous leading (`1.625`).

**Weights available as tokens:** `300 light · 500 medium · 600 semibold · 700 bold`.
**Type scale tokens present:** `1.5rem / 1.875rem / 2.25rem / 3rem / 3.75rem` (2xl–6xl).

---

## 6. The live site as a de-facto design system

**Stack:** Next.js App Router (Turbopack build) · Tailwind CSS v4 · shadcn/ui component tokens ·
self-hosted fonts · Cloudflare Pages hosting · Supabase Storage for images.

### 6.1 Information architecture

Primary nav: **Beranda · Struktur Organisasi · Media Partner · Contact Us** (+ a `Contact Us`
primary button, and an icon button).

Home page sections, in order:

1. **Hero** — full-bleed group photograph with a dark scrim; three-line uppercase title
   (`HIMPUNAN MAHASISWA TEKNOLOGI INFORMASI` / `POLITEKNIK NEGERI MALANG` / `PERIODE 2026/2027`).
2. **About HMTI** — two-column: oversized heading left, body copy right.
3. **Visi & Misi** — two bordered cards, equal width.
4. **Artikel Terkini** — card grid with image thumbnails.
5. **Profil / contact block** — address, contact, social icon row, copyright line.

### 6.2 Visual language

- Light-first. `#FFFFFF` page, `#F5F5F5` alternating section bands.
- Very generous whitespace; large section paddings.
- Content sits in **cards**: `--radius` 10 px, 1 px `#E5E5E5` border, subtle shadow, white fill.
- **Yellow is used sparingly and deliberately** — the `Contact Us` button and the active nav
  underline. It is an accent, not a field colour.
- Photography-led hero with a **dark overlay** so white type passes contrast.
- Icon-only social row in the footer (Instagram, TikTok, X, YouTube, LinkedIn).
- No visible dark-mode toggle, although a complete `.dark` token set is compiled into the CSS.

### 6.3 Component inventory observed

Badge/pill button (primary + outline), icon button, nav link with active underline, hero banner,
two-column text section, bordered info card, article card with image + category tag + title +
excerpt, footer with three-column layout + centred logo + social icon row + divider + legal line.

### 6.4 Defects found in the current production site

Worth fixing as part of this work:

1. **Broken image** in the "Artikel Terkini" card — the thumbnail 404s and renders as a broken
   image icon on the live homepage.
2. **Period inconsistency** — the header/hero says `PERIODE 2026/2027` while `/struktur` still
   says `PERIODE 2025/2026`.
3. **Dead canonical domain** — `og:url`, `og:image` and `twitter:image` point at
   `hmtipolinema.org`, which does not resolve.
4. **Fake favicon** — `/favicon.ico` is served as WebP bytes; no real multi-size ICO.
5. **Placeholder metadata shipped** — `google-site-verification` still contains
   `your-google-verification-code`.
6. **Unused design capability** — a full dark theme is compiled but never exposed; the brand
   blue is compiled nowhere at all.

---

## 7. Voice and tone

- **Language:** Indonesian, with occasional English event titles.
- **Register:** formal-institutional but warm — "wadah dan aspirasi serta pelayanan bagi
  Mahasiswa", "sinergis dan berprestasi".
- **Display headings:** UPPERCASE, often the full legal name of the organisation spelled out.
- **Short forms:** "HMTI", "JTI", "Polinema", "Kominfo", "PSDM", "RMB", "BPH".
- **Recurring nouns:** himpunan, jurusan, mahasiswa, aspirasi, kompetensi, program kerja,
  sinergi, prestasi.
- **Audience address:** *"Halo, Sobat Informatics!"* — the house greeting in Instagram captions.
- **Slogans in active use:** `#TI_FAST #TI_BRAVO` (the declared org slogan, per LinkedIn
  JSON-LD) and `#SatuKolaborasiSeribuKontribusi` (the Adhigana cabinet slogan).
  `#PROUDTOBEINFORMATICS` is the primary org hashtag.
- **Per-intake nicknames** are a live part of the brand: `Rasendriya'22`, `Arshaknife'24`,
  `Dharmasena'26`. Any design system should expect a new nickname every year.

Full vocabulary inventory: `02-social-presence.md` §5.

---

## 8. Gaps and open decisions

**Missing assets we must create:**

1. **A vector logo.** No SVG exists. Needs a redraw preserving the measured proportions, with
   variants: full-colour badge, one-colour black, one-colour white/knockout, and the centre
   mark alone. Plus a real favicon set.
2. **A brand blue ramp.** `#041587` has exactly one value; a design system needs 50→950 steps
   plus a lightened dark-mode-safe variant.
3. **A yellow ramp** to match, anchored on `#FFE600`.
4. **Logo usage rules** — clear space, minimum sizes, permitted backgrounds, forbidden uses.
   Note the *only* place the organisation has ever written a logo rule is the media-partner
   terms, which merely require that partners *"mencantumkan logo HMTI"*
   (<https://hmti.polinema.ac.id/medpart>).

**Open questions to confirm with the organisation:**

1. ~~Which YouTube handle is live?~~ **RESOLVED — `@HMTIPolinemaa`.**
2. **Is the canonical brand blue really `#041587`?** Every export disagrees (`#041584`,
   `#1D1873`, `#130A4B`, `#322261`). We only have rasters, so the intended value is
   unknowable without the original vector. **This is the single biggest open decision.**
3. Is `hmtipolinema.org` intended to become the primary domain (metadata already assumes it)?
4. Is the brand yellow officially `#FFE600`, or should it be re-derived from the logo
   (which measures `#FFE603`)?
5. Is the deep blue intended as a co-primary, or is the current yellow-on-neutral system the
   deliberate house style?
6. Which typeface is authoritative — Montserrat (in use) or Inter (loaded but unused)?
7. Does the organisation have any unpublished brand book or a **kabinet logo**? Note that each
   cabinet now carries its own campaign theme — the 2026 Instagram feed is built on a
   **maroon/oxblood** ground (`#5C1A1C`–`#805954`), *not* the yellow/blue logo palette. A design
   system must decide whether cabinet campaign themes are in scope or explicitly out of it.
8. Who owns the **per-event sub-brands** (`TI-COMPSTREAM`, `Seminar Nasional`, `Malam
   Keakraban`, `Study Excursie`, `Dies Natalis`)? They are visually distinct from the parent
   identity and currently unmanaged.

---

## 9. Source index

| # | Source | Used for |
| --- | --- | --- |
| 1 | <https://hmti.polinema.ac.id/> | Name, period, vision/mission, about text, nav, hero, footer, contacts, address |
| 2 | <https://hmti.polinema.ac.id/struktur> | Department list, period inconsistency |
| 3 | <https://hmti.polinema.ac.id/medpart> | Media-partner terms, logo-mention requirement, contact numbers |
| 4 | <https://hmti.polinema.ac.id/contact> | Contact persons |
| 5 | `/_next/static/chunks/0684645a74e0637b.css` (archived at `assets/brand/reference/live-site-theme.css`) | Every colour/radius/type token |
| 6 | 13 production JS/CSS bundles from `/_next/static/chunks/` | Hex census proving `#FFE600` is the only brand colour in code |
| 7 | `https://hmti.polinema.ac.id/images/logo/logo-hmti.png` (+ `.webp`) | Logo pixel measurements |
| 8 | `https://hmti.polinema.ac.id/images/home/hero-{1,2,3}.webp` | Hero photography, dimensions |
| 9 | <https://jti.polinema.ac.id/> | Program studi list, PSDKU campuses |
| 10 | <https://jti.polinema.ac.id/himpunan-mahasiswa-teknologi-informasi> | **Placeholder page** ("Halaman Sedang Dikembangkan") as of research date |
| 11 | <https://www.polinema.ac.id/> | Parent institution reachability |
| 12 | DNS resolution of `hmti.polinema.ac.id` | CNAME → `hmtipolinema.pages.dev` (Cloudflare Pages) |
| 13 | Brave Search result snippets, 2026-09-27 | Social follower counts, handles, hashtags, `@hmti.goods`, `@hmti.psdku_lumajang` |

**Research limitations encountered:** the Internet Archive (Wayback Machine) was **offline**
during this session, so historical versions of the site and of the JTI HMTI page could not be
retrieved. Google search was CAPTCHA-blocked and DuckDuckGo is unreachable from this machine;
Brave Search was used instead. The Supabase Storage bucket that hosts article imagery did not
respond to public listing requests.

**Companion documents:** `02-social-presence.md` (social channels and their visual identity),
`03-institutional-brand.md` (Polinema + JTI parent brand constraints).
