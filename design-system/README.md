# HMTI Polinema — Design System v0.1

Research-derived. **Proposal, not an approved standard** — see
[`../docs/research/00-synthesis-and-design-inputs.md`](../docs/research/00-synthesis-and-design-inputs.md) §5
for the decisions that still need organisational sign-off.

## Files

| File | What |
| --- | --- |
| `index.html` | The full visual spec — open it in a browser. Self-contained (logo and hero image are inlined as data URIs); only Montserrat is fetched remotely. |
| `tokens.css` | Drop-in CSS custom properties: ramps, semantic tokens (light + dark), radii, spacing, type scale, layout, motion, elevation. |
| `tokens.json` | The same tokens as structured data, with `provenance` and `note` fields per value. |

## The two rules that matter most

```css
/* 1. Brand yellow is a FILL, never text on a light surface. */
/*    #FFE600 on #FFFFFF = 1.27:1  — unreadable          */
/*    #FFE600 on #0A0A0A = 15.62:1 — the house pair       */

/* 2. The light-mode brand blue cannot be used in dark mode. */
/*    #041587 on #0A0A0A = 1.38:1  — unreadable           */
/*    use --accent, which swaps to #698FE6 in dark (6.30:1) */
```

## Provisional values

`--accent` (`#041587`) is the **median of the official seal**, but every raster export of that
seal measures a different blue — `#041584` (Instagram), `#1D1873` (LinkedIn), `#130A4B`
(YouTube), `#322261` (TikTok) — and no vector original exists. Treat it as provisional until the
logo is redrawn. See `tokens.json` → `color.brand.blue`.

## What is measured vs decided

- **Measured:** brand yellow, the seal's geometry and proportions, the neutral ramp, radius/type/
  spacing/motion values, all contrast ratios.
- **Decided here:** the 50→950 ramp construction (OKLCH), the 7-step radius scale, the minimum
  size and clear-space rules, the dark-mode accent swap.
- **Open:** the canonical blue, dark mode, typeface authority, per-cabinet theming scope, the
  vector logo redraw, and the canonical domain.
