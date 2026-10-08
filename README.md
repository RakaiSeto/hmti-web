# HMTI Polinema — Web & Design System

Website and design system for **HMTI Polinema** — Himpunan Mahasiswa
**Teknologi Informasi**, Jurusan Teknologi Informasi, Politeknik Negeri Malang.

> **Status: the app is under construction; the design system is v0.2 (proposal).**
> The design lives in Brilliant (`nimble-guava/hmti-web`, canvas `main-2.bl`) — 22 frames,
> all exported and readable through the MCP bridge. The application is a TanStack Start
> app on Cloudflare Workers; Phase 0 (tokens + scaffold) has landed.
>
> Where to start: [`docs/plans/inventory-lending/decisions.md`](docs/plans/inventory-lending/decisions.md)
> for the settled technical decisions and the traps, then
> [`docs/plans/inventory-lending/overview.md`](docs/plans/inventory-lending/overview.md)
> for the phase plan. For the design system itself,
> [`design-system/index.html`](design-system/index.html).

## Application

TanStack Start + TypeScript on Bun, deployed as one Cloudflare Worker with D1 (data) and
R2 (files). Better Auth handles staff accounts. Styling is Tailwind v4, with the design's
tokens generated into `src/styles/tokens.css` from the Brilliant canvas.

```bash
bun install
bun run cf-typegen          # writes worker-configuration.d.ts from wrangler.jsonc
bun run db:migrate:local    # applies drizzle/ to the local simulated D1
bun run dev                 # http://localhost:3000
```

Secrets for local dev go in `.dev.vars` (gitignored; see `.env.example`) — **throwaway
values only**. The Cloudflare Vite plugin copies that file into the build output
(`dist/server/.dev.vars`) so the built Worker can run locally, so anything in it reaches a
build artefact. Production secrets are Worker secrets, set out of band:
`wrangler secret put BETTER_AUTH_SECRET`.

| Command                                | Does                                                     |
| -------------------------------------- | -------------------------------------------------------- |
| `bun run dev`                          | Vite dev server with D1/R2 simulated locally             |
| `bun run typecheck` / `lint` / `test`  | what CI runs                                             |
| `bun run db:generate`                  | new migration from `src/db/schema.ts`                    |
| `bun run db:migrate:local` / `:remote` | apply migrations via wrangler                            |
| `bun run db:seed` / `db:seed:remote`   | seed the local DB, then copy it into the remote one      |
| `bun run deploy`                       | build + `wrangler deploy`                                |
| `python3 tools/gen-tokens.py`          | regenerate `src/styles/tokens.css` from the design dumps |

### Deploying

The Worker, D1 database and R2 bucket are `hmti-inventaris` in the account
`wrangler whoami` reports. `wrangler.jsonc` carries the real `database_id` and the deployed
origin in `vars.BETTER_AUTH_URL` — that origin is the one host Better Auth trusts, so a move
to a custom domain means changing it (see `src/lib/origins.ts`).

Provisioning a fresh account, in order:

```bash
bunx wrangler d1 create hmti-inventaris           # put the printed id in wrangler.jsonc
bunx wrangler r2 bucket create hmti-inventaris-files
bun run db:migrate:remote
openssl rand -base64 32 | bunx wrangler secret put BETTER_AUTH_SECRET
bun run db:seed && bun run db:seed:remote          # first admin + demo data
bun run deploy
```

Sign-up is disabled (FR08), so `db:seed:remote` is the only way an account reaches a
deployment: it copies the seeded rows, password hashes included, out of the local database.

**Routes** are all Indonesian (decisions.md D17): `/` · `/lacak` · `/masuk` ·
`/katalog` · `/katalog/$id` · `/ajukan`, with staff pages under `/admin/*`.

## Repository layout

```
src/             The application (TanStack Start)
  ├── routes/       file-based routes; routeTree.gen.ts is generated
  ├── components/   Logo, BrandLockup, PublicTopbar, PageShell, Card — the design's Kit
  │                 masters, hand-ported (decisions.md D11)
  ├── db/           Drizzle schema + D1 client
  ├── lib/          auth config, auth client
  ├── styles/       app.css (entry) + tokens.css — GENERATED from the design
  └── env.d.ts      Worker secret types (bindings come from `wrangler types`)
drizzle/         Generated migrations, applied by wrangler
tools/gen-tokens.py  Regenerates src/styles/tokens.css from the design dumps
wrangler.jsonc   Worker config: D1 + R2 bindings
design-system/   The design system (a separate deliverable — the app does not import it)
  ├── index.html    ← open this in a browser: full visual spec, self-contained
  ├── tokens.css    drop-in CSS custom properties (light + dark)
  ├── app.css       v0.2 app kit: shell, data table, status map, overlays, printable doc
  └── tokens.json   same tokens as data, with per-value provenance
docs/app-design-plan.md  Inventory + borrowing app: scope, roles, flows, page inventory, decisions
docs/research/   Brand + design research (cited, evidence-first)
  ├── 00-synthesis-and-design-inputs.md   ← the decisions the system must resolve
  ├── 01-hmti-polinema-brand-research.md  logo, colour, type, live site tokens
  ├── 02-social-presence.md               channels, vocabulary, campaign themes
  ├── 03-institutional-brand.md           Polinema + JTI parent-brand constraints
  ├── 04-design-editor-options-agent-driven.md   Figma alternatives an agent can drive (bb on Fedora)
  └── sources/                            primary documents (Statuta PDF, etc.)
docs/openpencil-setup.md  Design tooling: OpenPencil install, CLI/MCP workflow, bb wiring
assets/brand/    Canonical brand assets (logos, photos, reference files)
research-shots/ Screenshots and contact sheets captured during research
```

> **Two token files, on purpose.** `design-system/tokens.css` is the design system's own
> artifact (derived from the live marketing site). `src/styles/tokens.css` is the app's,
> generated from the Brilliant canvas. They disagree — the brand yellow is `#FFE600` in
> one and `#EEC643` in the other. The app uses the generated one; see
> [decisions.md](docs/plans/inventory-lending/decisions.md) D5.

## Using the tokens

```html
<link rel="stylesheet" href="design-system/tokens.css" />
```

```css
.button-primary {
  background: var(--brand);
  color: var(--brand-ink);
}
.link {
  color: var(--accent);
} /* swaps automatically in dark mode */
```

Toggle dark mode with `<html data-theme="dark">`. The accent token is the important one — it
swaps from `#041587` to `#698FE6` because the light-mode blue is unreadable on `#0A0A0A`.

## Using the app kit (v0.2)

For the inventory + borrowing app, load `app.css` after `tokens.css`:

```html
<link rel="stylesheet" href="design-system/tokens.css" />
<link rel="stylesheet" href="design-system/app.css" />
```

It adds the app shell (`.app`), data table (`table.data`), the fixed status badges (`.st-*`),
stepper/timeline, empty/skeleton states, overlays (dialog, drawer, dropdown, tooltip, toast),
form extras (date range, combobox, upload, qty) and the printable `.doc` berita acara. The
same components are demonstrated (and the CSS is inlined) in `index.html` §18. The app's scope,
flows and page inventory live in [`../docs/app-design-plan.md`](../docs/app-design-plan.md).

## Brand quick reference

**Two palettes are in play.** The table below is the _design system's_ reading of the live
marketing site. The app uses the **Brilliant design's** values instead
(`docs/plans/inventory-lending/decisions.md` D5), which differ on the two that matter:
brand yellow `#EEC643` (not `#FFE600`) and brand blue `#0D21A1` (not `#041587`).

| Token        | Value                 | Source                                         |
| ------------ | --------------------- | ---------------------------------------------- |
| Brand yellow | `#FFE600`             | `--primary` in the live site CSS               |
| Brand blue   | `#041587` ⚠ contested | measured from the logo; every export disagrees |
| Brand orange | `#A54105`             | measured on the logo's strokes                 |
| Ink          | `#0A0A0A`             | `--foreground` / `--primary-foreground`        |

**Non-negotiable contrast rules:** `#FFE600` is a _fill_, never text on light (1.27:1 on white).
It pairs correctly with `#0A0A0A` (15.62:1). `#041587` is excellent on white (14.36:1) and
unusable on `#0A0A0A` (1.38:1). The app's yellow keeps the same rule at 1.44:1 — see the
header of `src/styles/tokens.css`.

### Logo

`assets/brand/logo/hmti-logo-256.webp` (256×260, 17 KB) is the only usable logo file: the
1705×1732 PNG beside it is the 1.8 MB master, and **no vector original exists** — no SVG has
ever been served by the site (`docs/research/01-hmti-polinema-brand-research.md` §3). The
app imports this file directly rather than copying it, so there is one source of truth.

## Organisation facts

- Founded **7 March 2015**, alongside the founding of Jurusan Teknologi Informasi.
- Current cabinet: **Kabinet Adhigana**, term 2026/2027 (the 12th cabinet).
- Departments: **BPH · Internal · PSDM · RMB · Eksternal · Kominfo**
- Slogan: `#TI_FAST #TI_BRAVO` · Cabinet slogan: `#SatuKolaborasiSeribuKontribusi`
- Address: Jl. Soekarno Hatta No. 9, Jatimulyo, Lowokwaru, Kota Malang, Jawa Timur 65141
- Email: hmtipolinema@gmail.com

## Official channels

| Platform    | Handle           | URL                                               |
| ----------- | ---------------- | ------------------------------------------------- |
| Website     | —                | <https://hmti.polinema.ac.id>                     |
| Instagram   | `@hmtipolinema`  | <https://www.instagram.com/hmtipolinema/>         |
| TikTok      | `@hmtipolinema`  | <https://www.tiktok.com/@hmtipolinema>            |
| YouTube     | `@HMTIPolinemaa` | <https://www.youtube.com/@HMTIPolinemaa>          |
| LinkedIn    | `hmti-polinema`  | <https://www.linkedin.com/company/hmti-polinema/> |
| X / Twitter | `@HMTIPolinema`  | <https://twitter.com/hmtipolinema>                |
| Merchandise | `@hmti.goods`    | —                                                 |

> The live site links `youtube.com/@HMTIPolinema`, which **404s**. The working handle is
> `@HMTIPolinemaa` (double "a"). The site also advertises `hmtipolinema.org`, which does not
> resolve.

## Blocking decisions before the design system can be built

1. Scope — org brand only, or also the per-cabinet and per-event layers?
2. The canonical brand blue (every export disagrees; no vector original exists).
3. Dark mode — ship it or delete the dead tokens.
4. A vector logo redraw (only rasters exist today).

See [`docs/research/00-synthesis-and-design-inputs.md`](docs/research/00-synthesis-and-design-inputs.md) §5.
