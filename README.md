# HMTI Polinema — Web & Design System

Website and design system for **HMTI Polinema** — Himpunan Mahasiswa
**Teknologi Informasi**, Jurusan Teknologi Informasi, Politeknik Negeri Malang.

> **Status: research complete, design system v0.1 drafted (proposal).** No application code yet.
> Start with [`design-system/index.html`](design-system/index.html) to see it, and
> [`docs/research/00-synthesis-and-design-inputs.md`](docs/research/00-synthesis-and-design-inputs.md)
> for the decisions still needing sign-off.

## Repository layout

```
design-system/   The design system
  ├── index.html    ← open this in a browser: full visual spec, self-contained
  ├── tokens.css    drop-in CSS custom properties (light + dark)
  └── tokens.json   same tokens as data, with per-value provenance
docs/research/   Brand + design research (cited, evidence-first)
  ├── 00-synthesis-and-design-inputs.md   ← the decisions the system must resolve
  ├── 01-hmti-polinema-brand-research.md  logo, colour, type, live site tokens
  ├── 02-social-presence.md               channels, vocabulary, campaign themes
  ├── 03-institutional-brand.md           Polinema + JTI parent-brand constraints
  └── sources/                            primary documents (Statuta PDF, etc.)
assets/brand/    Canonical brand assets (logos, photos, reference files)
research-shots/ Screenshots and contact sheets captured during research
```

## Using the tokens

```html
<link rel="stylesheet" href="design-system/tokens.css">
```

```css
.button-primary { background: var(--brand); color: var(--brand-ink); }
.link           { color: var(--accent); }   /* swaps automatically in dark mode */
```

Toggle dark mode with `<html data-theme="dark">`. The accent token is the important one — it
swaps from `#041587` to `#698FE6` because the light-mode blue is unreadable on `#0A0A0A`.

## Brand quick reference

| Token | Value | Source |
| --- | --- | --- |
| Brand yellow | `#FFE600` | `--primary` in the live site CSS |
| Brand blue | `#041587` ⚠ contested | measured from the logo; every export disagrees |
| Brand orange | `#A54105` | measured on the logo's strokes |
| Ink | `#0A0A0A` | `--foreground` / `--primary-foreground` |

**Non-negotiable contrast rules:** `#FFE600` is a *fill*, never text on light (1.27:1 on white).
It pairs correctly with `#0A0A0A` (15.62:1). `#041587` is excellent on white (14.36:1) and
unusable on `#0A0A0A` (1.38:1).

## Organisation facts

- Founded **7 March 2015**, alongside the founding of Jurusan Teknologi Informasi.
- Current cabinet: **Kabinet Adhigana**, term 2026/2027 (the 12th cabinet).
- Departments: **BPH · Internal · PSDM · RMB · Eksternal · Kominfo**
- Slogan: `#TI_FAST #TI_BRAVO` · Cabinet slogan: `#SatuKolaborasiSeribuKontribusi`
- Address: Jl. Soekarno Hatta No. 9, Jatimulyo, Lowokwaru, Kota Malang, Jawa Timur 65141
- Email: hmtipolinema@gmail.com

## Official channels

| Platform | Handle | URL |
| --- | --- | --- |
| Website | — | <https://hmti.polinema.ac.id> |
| Instagram | `@hmtipolinema` | <https://www.instagram.com/hmtipolinema/> |
| TikTok | `@hmtipolinema` | <https://www.tiktok.com/@hmtipolinema> |
| YouTube | `@HMTIPolinemaa` | <https://www.youtube.com/@HMTIPolinemaa> |
| LinkedIn | `hmti-polinema` | <https://www.linkedin.com/company/hmti-polinema/> |
| X / Twitter | `@HMTIPolinema` | <https://twitter.com/hmtipolinema> |
| Merchandise | `@hmti.goods` | — |

> The live site links `youtube.com/@HMTIPolinema`, which **404s**. The working handle is
> `@HMTIPolinemaa` (double "a"). The site also advertises `hmtipolinema.org`, which does not
> resolve.

## Blocking decisions before the design system can be built

1. Scope — org brand only, or also the per-cabinet and per-event layers?
2. The canonical brand blue (every export disagrees; no vector original exists).
3. Dark mode — ship it or delete the dead tokens.
4. A vector logo redraw (only rasters exist today).

See [`docs/research/00-synthesis-and-design-inputs.md`](docs/research/00-synthesis-and-design-inputs.md) §5.
