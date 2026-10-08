# Build decisions — app from the Brilliant design

Companion to [`overview.md`](overview.md) (the 10-phase implementation plan) and
[`../../design-pages-plan.md`](../../design-pages-plan.md) (the design build-out).

**Status: settled.** Every decision below has the owner's ruling (2026-10-06) and the
work is underway — Phase 0 landed in this repo. Where this file disagrees with
`overview.md`, this file is newer: the corrections in §1 are evidence, not preference.

Stack is settled by the owner: **TanStack Start**. Everything else is here.

## 0. Rulings

| # | Ruling | Note |
| --- | --- | --- |
| D1 | **Workers + D1 + R2** | as recommended |
| D2 | **Drizzle** | as recommended |
| D3 | **Derived availability**, no cached column | as recommended |
| D4 | **Better Auth** | replaces the hand-rolled sessions + scrypt in INV-04 |
| D5 | **The design's values win** | `src/styles/tokens.css` is generated from the canvas |
| D6 | **Tailwind** | reversed my recommendation — see D6 |
| D7 | Native primitives (`<dialog>`, popover) | as recommended |
| D8 | **Bun** (not pnpm) | as recommended otherwise |
| D9 | Boundary rule — **explained, still open** | see D9 |
| D10 | **dd-mm-yyyy display, Asia/Jakarta** | storage stays ISO — see D10 |
| D11 | Hand-built React mirroring the Kit masters | as recommended |
| D12 | **hmti.rakaiseto.com for now** | our account; handover risk recorded — see D12 |
| D13 | Bot is ours; **Telegram deferred** | see D13 |
| D14 | CSV (UTF-8 BOM) + print-to-PDF | as recommended |
| D15 | Vitest + Playwright | as recommended |
| D16 | Nav from requirements, not the design | as recommended |
| D17 | All-Indonesian routes | as recommended |
| D18 | Phases 1–5 first shippable | as recommended |

Consequences worth stating plainly:

- **Phase 0 is now a phase.** The design's token layer and the corrected status
  vocabulary land before the domain model, so no page is built on the wrong colours.
- **Telegram is deferred**, which means FR19 is unmet until it lands. Until then a new
  request is visible only in the admin queue — the pengurus have to look. That is a real
  functional gap, not a scheduling note.
- **The custom server entrypoint moves to Phase 8.** It exists to host a cron trigger for
  BR07, and nothing else needs it; adding one now would be an unverified moving part.

---

## 1. Corrections to the existing plan

Found while setting up the Brilliant bridge from the orb (see
[`../../design-pages-plan.md`](../../design-pages-plan.md) §9 and the thread). Each one
changes an issue that `overview.md` describes differently.

### 1a. D1 has no interactive transactions

`overview.md` §5 and INV-13 say the availability re-check "runs inside the insert
transaction". That shape does not exist on Cloudflare D1:

- `BEGIN TRANSACTION` is rejected outright — D1 wraps each query or batch itself.
- `db.batch([...])` is one atomic round trip, **but** every statement must be known
  before it runs. There is no place to read a value, branch in application code, and
  write based on the result.

So INV-13 has to be implemented as either a folded conditional insert
(`INSERT ... SELECT ... WHERE free_qty >= ?`, then inspect `meta.changes`) or an
optimistic retry loop. Same guarantee, different code. See decision 2.

### 1b. Better Auth supports TanStack Start

INV-04 hand-rolls sessions + scrypt because "Workers can't run argon2/bcrypt natives".
That rationale is obsolete. Better Auth ships an official TanStack Start integration
(`tanstackStartCookies()` plugin, handler mounted at a server route) and has a
Cloudflare Workers/D1 adapter. Hand-rolling is now a choice, not a constraint. See
decision 4.

### 1c. The repo's tokens and the design's tokens are different systems

`design-system/tokens.css` was derived from the live marketing site. The Brilliant
design resolves against its own `hmti-polinema` brand. They disagree on the values that
matter most:

| Role | `tokens.css` (repo) | Brilliant design | Note |
| --- | --- | --- | --- |
| Brand yellow | `--brand` `#FFE600` | `primary.mid` `#EEC643` | visibly different |
| Brand blue | `--accent` `#041587` | `secondary.mid` `#0D21A1` | both already flagged provisional |
| Sidebar | `--tertiary` `#A54105` (orange) | `tertiary.mid` `#011638` (navy) | **same name, different meaning** |
| Page surface | `--surface` `#ffffff` | `color.surface` `#EFF0F2` | |
| Text | `--text` | `color.text.primary` `#454545` | |
| Semantic states | absent | `color.success/warning/error/info` + `.container` + `.text` | design has 11 the repo lacks |

The design references 31 distinct token names; the repo's file has 93 custom
properties but a different vocabulary and no `success`/`warning`/`error`/`info`
families at all. `tertiary` meaning orange in one system and navy in the other will
cause real bugs if both stay in play. See decision 5.

### 1d. `app.css` carries the pre-v2 status vocabulary

`design-system/app.css` defines `.st-draft .st-submitted .st-approved .st-partial
.st-rejected .st-borrowed .st-returned .st-overdue .st-damaged .st-lost .st-out
.st-available` — the retired English/partial-approval model. The design's `StatusBadge`
component has the v2 seven:

```
axes[status[diajukan, disetujui, ditolak, dipinjam, selesai, terlambat, dibatalkan]]
```

The CSS kit is stale against the design. Also needed: styling for the two `surat` sub-states.

### 1e. Brilliant's HTML export is a reference, not app code

`export(format: "html")` returns absolutely-positioned `<div>`s with inline styles and
`data-instance-of` markers (frame 06 = 82 KB). Useful as a pixel reference and to see
which Kit master each region came from. Not responsive, not a component. The frames must
be hand-built as React components — but the Kit's master list hands us the component
inventory for free (see §3).

---

## 2. Decisions — blocking the scaffold

### D1. Deploy target and database

| Option | For | Against |
| --- | --- | --- |
| **A. Workers + D1 + R2** (planned) | One platform for SSR, cron, storage, rate limit; free tier covers this org by orders of magnitude | No interactive transactions (1a); SQLite |
| B. Workers + Postgres (Neon via Hyperdrive) | Real transactions; clean range-overlap SQL | Second vendor, connection pooling, a bill to own |
| C. Node + Postgres on a VPS | Most familiar in Indonesian orgs; cheapest mental model | You become the sysadmin; lose the free edge/cron/storage |

**Recommend A.** The race in INV-13 is two borrowers submitting in the same second at a
student org. A folded conditional insert closes it. B buys a nicer transaction model for
a concurrency level that will not occur.

### D2. ORM and query layer

**Recommend Drizzle + drizzle-kit** (as planned). Typed schema, generated migrations
that run on D1, and `db.batch()` for atomic multi-statement writes. Availability is one
hand-written SQL helper — do not try to express the overlap in ORM chaining.

### D3. Availability: derived or materialised

**Recommend derived, no cached column** (as planned). Add two indexes:
`pengajuan_barang(barang_id)` and `pengajuan(status, tgl_pinjam, tgl_kembali)`.

### D4. Auth: Better Auth or hand-rolled

| | Hand-rolled (planned) | Better Auth |
| --- | --- | --- |
| Size | ~150 lines you fully own | a dependency with its own upgrade cadence |
| Covers | sessions, scrypt, cookie, guards | the above plus CSRF, session rotation, admin-created users, rate limiting |
| Risk | you own the timing/CSRF/reset edges | upstream |

**Recommend Better Auth** with the Drizzle adapter and `tanstackStartCookies()`. The
plan's reason for hand-rolling no longer holds (1b), and this is the one area where a
subtle bug is both likely and quiet. Keep `requireRole()` as the single guard either way.

### D5. Token source of truth — **settled: the design's values**

The app's tokens are the design's values, generated into `src/styles/tokens.css` by
`tools/gen-tokens.py` from the canvas itself. `design-system/tokens.css` stays as it is
and keeps serving the marketing spec — it is a separate deliverable, not the app's
source of truth.

Generation beats transcription here: re-running the script after a design change makes
the drift a diff, and each generated line names the design token it came from.

**Contrast, re-checked for the design's values.** The design system's README carries a
non-negotiable rule about `#FFE600`; the app's yellow is different (`#EEC643`) so the rule
was re-derived rather than inherited. Same shape: **1.44:1 as text on a light surface —
it is a fill, never text.** Paired with `--color-brand-ink` `#0A0A0A` it is 12.06:1. Every
pair the app currently renders passes AA (lowest is `accent-soft` on the gradient's far
end, 4.51:1). The rule is restated in the generated file's header so it travels with the
tokens.

**Finding that changed this decision.** The brand is a *three-mode* design system, not a
light-only one. 29 of the 35 tokens the design references carry `dark(...)` and/or
`high-contrast(...)` values in the canvas — `primary.firm` `#AE8C00` → dark `#EEE0B6`,
`color.surface` `#EFF0F2` → dark `#292929`, and so on. All three modes are now in
`tokens.css`, so `overview.md` §3's "light only" is a choice we can revisit by setting
`data-theme`, not a re-design. Five tokens have no dark value and stay fixed:
`primary.mid`, `secondary.mid`, `tertiary.mid`, `neutral.mid`, `color.shadow`.

**Also resolved: flaw 9 was not a flaw.** `tertiary.mid` appearing as both `#011638`
(navy) and `#FF9900` (orange) is not two meanings — the orange is an unset icon fill on a
`NavIcon` *inside a component master*, and `indigo`/`#7C6BF0` are Brilliant's own dashed
component-boundary guides. Both are editor chrome. `tools/gen-tokens.py` excludes them by
name so nobody re-imports them as design values.

**`design-system/app.css` is left untouched.** Its `.st-*` classes are pre-v2, but the
app no longer consumes that file at all (D6), so correcting them in place would edit a
deliverable to serve a consumer that does not exist. Recorded as design-system debt in
§6 instead.

### D6. Styling approach — **settled: Tailwind**, my recommendation reversed

I recommended plain CSS and the owner asked why not Tailwind. On inspection my reasoning
was weaker than I presented it: my objection was "two styling systems", and that only
holds if the token layer stays outside Tailwind. It does not have to — Tailwind v4's
`@theme` block *is* a CSS custom-property layer, so the design's tokens live there and
Tailwind is the single system rather than a second one. The other costs are real but
small: `app.css`'s component classes are superseded, and the next cabinet is more likely
to know Tailwind than bespoke CSS (NFR07).

**Font:** self-host Montserrat (Fontsource). The design system's spec fetches it from
Google Fonts; the app should not depend on a third party for its brand face.

See §7 for the token trap this choice creates.

### D7. Component primitives for overlays

The kit styles `.dialog .drawer .dropdown .tooltip .toast` but has no behaviour: focus
trap, escape, positioning, a11y.

**Recommend native-first**: `<dialog>` for dialog and drawer, the popover API for
dropdown and tooltip, and hand-rolled toast. Zero dependencies and the kit's classes
stay. If the searchable combobox (the design's item picker) fights us, take one headless
dependency for that alone rather than adopting a whole primitive library.

### D8. Repo layout, package manager, CI — **settled: Bun**

- **App at the repo root** (`src/routes`, `vite.config.ts`, `public/`); `design-system/`
  and `docs/` stay where they are and are read from, not copied.
- **Bun** (`bun install`, `bun run dev`).
- **CI from Phase 0** — GitHub Actions running route-tree generation, `wrangler types`,
  typecheck, lint and unit tests. The repo had no CI; a ten-phase program without one is
  how phases silently rot. Landed with the scaffold.

---

## 3. Decisions — blocking the core loop

### D9. Availability boundary rule — **explained, awaiting pengurus**

The question: **if one organisation borrows an item and returns it on the 10th, can
another organisation borrow that same item starting on the 10th?**

Two defensible answers:

| Rule | Meaning | Consequence |
| --- | --- | --- |
| **A. Return day is free** (checkout inclusive, return exclusive) | The 10th is bookable again the moment the first loan is due back | Maximum availability; assumes the first borrower returns before the second collects |
| B. Return day is blocked | The item is unavailable on the 10th too | Safer physically; costs a day of availability on every loan |

**Recommend A**, which is also what INV-03 already leans toward. Worked example with
A — one item, 3 units:

```
Request 1  borrows 2 units   1st – 10th      free: 1 unit
Request 2  asks for 1 unit  10th – 12th      ALLOWED  (10th is free under A)
Request 2  asks for 3 units 10th – 12th      REJECTED (only 1 free)
Request 2  asks for 1 unit   9th – 12th      REJECTED (the 9th still has only 1 free)
```

Under B the second request's 10th–12th window would also be rejected, because the 10th
would count as occupied.

Why this needs a human: it is a promise about physical behaviour — whether the pengurus
can rely on an item being back at the start of its next booking — and the app cannot
enforce it either way. Encode it once in the availability helper with a comment naming
this decision. Everything else (the calendar, the form's per-line check, the admin view)
reads that one helper, so the rule cannot drift.

### D10. Date storage and timezone — **settled: dd-mm-yyyy, Asia/Jakarta**

The owner's ruling is the *display* format. Storage stays ISO, because the two formats
answer different questions and only one of them can be sorted:

- **Display:** `10-10-2026` (dd-mm-yyyy), rendered in `Asia/Jakarta`. This is the
  Indonesian convention and matches the design.
- **Storage:** `YYYY-MM-DD` TEXT for `tgl_pinjam` / `tgl_kembali`. Date-only, never a
  timestamp. `10-10-2026` sorts before `09-11-2026` as a string, which silently breaks
  every range query and the calendar — so the wire format cannot be dd-mm-yyyy.
- **Audit timestamps** (`log_aktivitas.waktu`, `created_at`): ISO 8601 UTC.
- **"Today"** is always computed in `Asia/Jakarta`, never from the runtime's clock zone
  (Workers run in UTC).
- The BR07 cron therefore fires at **17:00 UTC** = 00:00 WIB.

One formatting helper does the conversion at the edge; no component formats a date itself.

### D11. Design→code workflow

**Recommend hand-built React components mirroring the Kit masters**, with the exported
PNG/HTML kept as a side-by-side reference. The Kit's component set is the app's
component list:

```
Kit masters                     → React component
Button (4 variants)                Button
StatusBadge (7 v2 statuses)        StatusBadge
NavRow{Dasbor,Barang,…} (2 states) NavRow
NavSection                         NavSection
Sidebar admin (active[…] axis)     AdminShell
Sidebar PJ (active[…] axis)        PjShell
Topbar (crumb on/off, role)        Topbar
Field / Chip / Card / EmptyState   same
```

That mapping is the reason hand-porting is tractable: the design already factored the
shells into components, so the code inherits the factoring instead of re-deriving it.

---

## 4. Decisions — ops and launch

### D12. Cloudflare account and domain ownership — **settled: ours, for now**

The owner's ruling: we are their provider, so the account and domain are ours —
`hmti.rakaiseto.com` for now, on our Cloudflare account.

The risk this accepts, recorded so it is a decision rather than an oversight: the org's
app, database, file bucket and backups all live on an account the pengurus do not
control, and the cabinet changes every year. The campus domain `hmti.polinema.ac.id` is
the one they advertise. When the app is handed over, this needs either a transfer or a
written access note in the README naming who holds the account and how to reach them.

### D13. Telegram bot ownership — **ours; the whole phase is deferred**

The bot is ours, per the same provider reasoning. When it is built: a dedicated bot on
our Telegram account, token and group ID in Workers secrets, rotation documented, and the
queue table from INV-15 unchanged — a send failure must never lose a saved request.

**Telegram is deferred, so FR19 is unmet.** The consequences, stated plainly:

- A new request is visible only in the admin queue. The pengurus must open the app; they
  are not notified. For a request submitted on a Friday for the following week, that
  delay is the difference between approving it and auto-cancelling it under BR07.
- The `notifikasi_queue` table is therefore *not* in the Phase 1 schema. Adding it later
  is one migration; building the queue now for a sender that does not exist would be
  dead code.
- Phase 6 moves out of the first program. Phases 7–8 close the physical loop without it —
  staff see the queue, they just are not pinged about it.

### D14. Report export format

**Recommend CSV (UTF-8 with BOM) + print-to-PDF** via the kit's `.doc` styling, as
planned. Skip XLSX: it needs a dependency, and CSV opens in Excel and Sheets. The BOM
matters — without it Excel mis-reads Indonesian characters.

### D15. Test tooling

**Recommend Vitest** (unit: availability helper, status machine, role guards) **+
Playwright** (the per-phase browser verification `testing.md` already requires).

---

## 5. Decisions — scope and product rulings

### D16. Nav: build from requirements, not from the design

The design's admin sidebar has a `Pengaturan` row with no page behind it, and no
`Profil Saya` row, so frame 21 highlights `Pengguna`. Per the owner, the design stays as
it is and flaws are revisited after the app ships.

**Recommend the app's nav follow the requirements**: Dasbor · Inventaris(Barang,
Kategori) · Peminjaman(Aktif, Pengembalian) · Permintaan · Laporan · Sistem(Pengguna,
Log Aktivitas, Profil Saya). Drop Pengaturan; its settings are server config anyway.

**Amended once the shell was built**: the sidebar's `Sistem` group is Pengguna · Log
Aktivitas. `Profil Saya` and `Keluar` moved out of the sidebar into the topbar's account
menu, because they are account actions rather than destinations and the sidebar is on
screen the whole time. A PJ gets `Keluar` only — `navPj` still carries no `Profil Saya`,
since an admin resets their password (FR08).

### D17. Route naming

**Recommend all-Indonesian paths**, admin under a prefix:
`/` · `/ajukan` · `/lacak` · `/katalog` · `/katalog/$id` · `/masuk` ·
`/admin/dasbor` · `/admin/permintaan` · `/admin/permintaan/$kode` · `/admin/barang` ·
`/admin/kategori` · `/admin/peminjaman` · `/admin/pengembalian` · `/admin/laporan` ·
`/admin/pengguna` · `/admin/log` · `/admin/profil`.

Hard to change later: bookmarks, printed *berita acara* links, and the tracking URL
borrowers keep.

### D18. First shippable cut — **settled: Phases 1–5**

**Phases 1–5** are the first shippable: public catalog, calendar, request form with
conflict checking, tracking by code, plus login and the staff queue. That is a usable app
for borrowers before letters, handover/return and reports land. Phases 7–8 close the
physical loop next; 9 and 10 after. Phase 6 (Telegram) is deferred entirely (D13).

```
Phase 0   tokens from the design · scaffold · D1/Drizzle/Better Auth · CI   ← landed
Phase 1   schema, migrations, availability helper
Phase 2   auth wired to the UI, roles, activity log
Phase 3   inventory admin (kategori, barang, photos)
Phase 4   public catalog + availability calendar
Phase 5   request form, conflict check, tracking
          ─────────── first shippable ───────────
Phase 7   review, approve/reject, letter upload + verify
Phase 8   handover, return, H-1 auto-cancel (+ custom server entrypoint for cron)
Phase 9   dashboard + reports
Phase 10  hardening + deploy
Phase 6   Telegram — deferred
```

---

## 6. Known design flaws — recorded, deferred

Per the owner: build against the design as-is; fix these after the app exists. Recorded
here so they are not lost.

| # | Flaw | Where | Status |
| --- | --- | --- | --- |
| 1 | `Profil Saya` absent from the admin nav; frame 21 highlights `Pengguna` | design-pages-plan §9.3 | open — D16 builds the nav from requirements instead |
| 2 | `Pengaturan` row exists with no page (frame 19 deleted) | design-pages-plan §9.5 | open — D16 drops the row |
| 3 | `Katalog` is not in the public nav; 09/10 are reachable only from the form | design-pages-plan §9.2 | open |
| 4 | All 22 frames are 1440 wide — no mobile frame, and NFR04 makes mobile first-class | design-pages-plan §9 "Not in this batch" | open — the app is mobile-first regardless |
| 5 | No empty / loading / error states drawn | same | open — the app writes its own |
| 6 | No dark variants | doc contradiction | **resolved** — the canvas has 29/35 dark+high-contrast values; all three modes are in `tokens.css` (D5) |
| 7 | Two token systems with a `tertiary` name collision (§1c) | this file | **resolved** — the app uses the design's values; `tertiary` maps to `--color-ink` (D5) |
| 8 | `app.css` status classes are pre-v2 (§1d) | this file | **resolved for the app** — it no longer consumes `app.css` (D6). Still design-system debt for anyone using the kit |
| 9 | `tertiary.mid` carries both `#011638` (navy) and `#FF9900` (orange) | this file | **not a flaw** — the orange is an unset icon fill inside a component master; `indigo`/`#7C6BF0` are the editor's own boundary guides (D5) |
| 10 | The interactive canvas dies ~20 s after boot in the orb; MCP read/export work | design-pages-plan §9, thread | open — affects future design edits only, not the app |
| 11 | `color.text.primary` is `#454545` — mid-grey, not near-black; `neutral.intense` `#292929` is the darkest text | this file | open — worth a look when the design is next revised; the app uses the design's values as-is |
| 12 | Light-mode cards barely separate from the page: the card fill (`color.surface` `#EFF0F2`) is *darker* than the page (`color.surface.container` `#F0F0F0`) by one value, so a downward-offset shadow does all the work | this file | open — cosmetic; the app uses the design's card recipe (fill + shadow pair) unchanged |
| 13 | The public topbar has no call to action — "Ajukan Peminjaman" is a grey text link identical to "Lacak", and only "Masuk admin" is coloured (the brand blue) | this file | open — the loud CTA lives in the hero instead, which is coherent; flagged because it inverts the usual emphasis |

Flaws 1–5, 10 and 12–13 are visual and deferred by the owner's call. 6–9 were resolved by
the decisions above, so they should not be re-litigated. 11 is cosmetic.


---

## 7. Build notes — traps found while landing Phase 0

Recorded because each one cost real debugging time and will bite the next person.

### 7a. Never redefine Tailwind's spacing or radius namespaces

`@theme { --spacing-2xl: 32px }` shadows `--container-2xl`, so `max-w-2xl` silently
resolves to **32px** instead of 672px. The page still renders — it just collapses into a
one-word-per-line column. Symptom: `getComputedStyle(el).maxWidth === '32px'`.

The fix is that no override is needed: the design's spacing scale
(`xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32`) *is* Tailwind's 4px scale, and its radius
scale (`xs 2 · sm 4 · md 6 · lg 8 · xl 12 · 2xl 16`) *is* Tailwind's default radius set.
Use the stock utilities and keep the mapping in a comment in `tokens.css`. The type scale
is the only one that genuinely differs, so it is the only one overridden.

### 7b. TanStack Start's route augmentations need an import

`server: { handlers: … }` on a file route is an unknown property unless something in the
program imports `@tanstack/react-start` — the augmentation lives in
`@tanstack/start-client-core` and is only loaded when the package is referenced.
`src/router.tsx` carries `import type {} from '@tanstack/react-start'` for this reason.
Removing it breaks the Better Auth route handler's types.

### 7c. `env` from `cloudflare:workers` is typed as `Cloudflare.Env`

Not the global `Env`. Declaring secrets on a bare global `interface Env` has no effect;
they must go inside `declare namespace Cloudflare { interface Env { … } }`, which is what
`src/env.d.ts` does. Bindings (`DB`, `BUCKET`) come from `bun run cf-typegen` — a fresh
clone must run it, and CI does.

### 7d. D1 has no interactive transactions

Already §1a, repeated here because it constrains code that does not exist yet: INV-13's
"re-check availability inside the insert transaction" cannot be written as read → branch
→ write. Fold the condition into one statement and inspect `meta.changes`, or use an
optimistic retry loop.

### 7e. The design's surface tokens run backwards from the usual naming

`color.surface.container` is the **page** (`#F0F0F0`) and `color.surface` is a **card**
(`#EFF0F2`). The card is one value *darker* than the page in light mode — the opposite of
the "raised = lighter" instinct. Naming the page token `surface-raised` (which this repo
did at first) makes a card invisible against it, because both then resolve to a near-white
grey and nothing else distinguishes them.

Cards are separated by their **shadow pair**, not their fill:

```
shadow-card  = 0 1px 2px rgb(20 20 20 / 0.1), 0 8px 24px rgb(20 20 20 / 0.2)
shadow-modal = 0 16px 48px rgb(20 20 20 / 0.2)
```

`shadow-card` is the pair every in-page card carries (frames 03, 11, and the rest);
`shadow-modal` is the single doubled shadow the login card uses over the dark backdrop
(frame 04). Both are generated into `tokens.css`; use `<Card>` rather than hand-rolling
`rounded-xl bg-surface`.

### 7f. The logo is a raster with no vector original

`assets/brand/logo/hmti-logo-256.webp` (256×260) is the only usable asset: the 1705×1732
PNG is the 1.8 MB master and no SVG has ever been served
(`docs/research/01-hmti-polinema-brand-research.md` §3). It is already circular with
transparent corners, so the design's `radius.full` crop is a no-op — keep it anyway, for
the day someone drops in a square file.

It is imported from `assets/brand/` rather than copied into `src/`, so there is one file.
The design renders it at 36px in the topbar and 64px on the login page; at 36px the arced
"POLINEMA" ring text is not legible, which is expected and is what the design does.

The org's own favicon is the logo re-served, so the app uses the same file as its icon —
no derived PNG to drift.