# HMTI Polinema — Design System v0.2

Research-derived. **Proposal, not an approved standard** — see
[`../docs/research/00-synthesis-and-design-inputs.md`](../docs/research/00-synthesis-and-design-inputs.md) §5
for the decisions that still need organisational sign-off.

## Files

| File | What |
| --- | --- |
| `index.html` | The full visual spec — open it in a browser. Self-contained (logo and hero image are inlined as data URIs); only Montserrat is fetched remotely. |
| `tokens.css` | Drop-in CSS custom properties: ramps, semantic tokens (light + dark), radii, spacing, type scale, layout, motion, elevation. |
| `app.css` | **v0.2 app kit** — app shell, data table, status badges, stepper/timeline, empty & loading states, overlays, form extras and the printable berita acara. Load after `tokens.css`. |
| `tokens.json` | The same tokens as structured data, with `provenance` and `note` fields per value. |

## App kit (v0.2)

The design system started marketing-site oriented (hero, article cards, footer). v0.2 adds the
application family for the inventory + borrowing app, built on the same tokens:

- **App shell** — sidebar + topbar, breadcrumb, global search, account menu.
- **Data display** — sortable/selectable data table with toolbar + pagination, stepper, timeline.
- **Status map** — one fixed badge per request/item state (`.st-draft` … `.st-lost`).
- **Overlays** — dialog, detail drawer, dropdown, tooltip, toast.
- **Form extras** — date range, searchable combobox, file upload, quantity stepper, inline errors.
- **Documents** — printable borrow receipt / *berita acara* with `@media print` rules.

Everything is demonstrated live in `index.html` §18 (App kit). The CSS is inlined there to keep
the showcase self-contained, so when you edit `app.css` keep §18 in sync. UI language is Bahasa
Indonesia, light-first with the dark theme resolved. Scope, roles, flows and the Phase-1 page
inventory: [`../docs/app-design-plan.md`](../docs/app-design-plan.md).

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
