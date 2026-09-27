# HMTI Polinema — Web & Design System

Website and design system for **HMTI Polinema** — Himpunan Mahasiswa
**Teknologi Informasi**, Jurusan Teknologi Informasi, Politeknik Negeri Malang.

> **Status: research complete, design system not started.** No application code yet.
> Read [`docs/research/00-synthesis-and-design-inputs.md`](docs/research/00-synthesis-and-design-inputs.md) first.

## Repository layout

```
docs/research/   Brand + design research (cited, evidence-first)
  ├── 00-synthesis-and-design-inputs.md   ← start here
  ├── 01-hmti-polinema-brand-research.md  logo, colour, type, live site tokens
  ├── 02-social-presence.md               channels, vocabulary, campaign themes
  ├── 03-institutional-brand.md           Polinema + JTI parent-brand constraints
  └── sources/                            primary documents (Statuta PDF, etc.)
assets/brand/    Canonical brand assets (logos, photos, reference files)
research-shots/ Screenshots and contact sheets captured during research
```

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
