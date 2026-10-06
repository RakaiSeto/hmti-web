# Design build-out plan — remaining Brilliant pages

Companion to [`app-design-plan.md`](app-design-plan.md) (§5 page inventory) and the
implementation plan in [`plans/inventory-lending/`](plans/inventory-lending/overview.md).

**Scope: the `main-2` canvas only.** The older `main` canvas is treated as not existing —
nothing here reuses, references or migrates from it.

Status: **Phases A–D complete; Phase E partial.** Brilliant project
`nimble-guava/hmti-web`, canvas `main-2.bl`.

## 0. Progress

### Phase A — done

**Corrections (§4b).** Applied and verified by rendering each frame:

| Frame | Change |
| --- | --- |
| 01 · Landing | guest-card copy → "Untuk UKM, HMJ, dan instansi…" |
| 02 · Form Peminjaman | "Data Diri" → **Data Organisasi**; fields now Nama Organisasi · Nama Penanggung Jawab · No. WhatsApp · Keperluan; "NIM" gone; select caret removed from Keperluan |
| 03 · Cek Status | status → **Diajukan**; identity → org · penanggung jawab; email line replaced with "Simpan kode ini untuk mengecek status."; envelope icon → bookmark |
| 05 · Dasbor Admin | greeting → "14 pengajuan baru…"; activity + table rows → organisations; status chip → Diajukan; column header → ORGANISASI |
| 06 · Permintaan | tab → **Diajukan · 14**; cards → org / penanggung jawab / keperluan; search placeholder shortened to fit |
| 08 · Peminjaman Aktif | column header → **ORGANISASI**; rows → org + penanggung jawab; no NIM/class codes |

**Nav restructure (§3.2).** Rebuilt identically in all four admin frames (05, 06, 07,
08). They had **drifted** — 06 had a Keluar row, 07 and 08 had neither Dasbor nor
Keluar. Now:

```
Dasbor
INVENTARIS   Barang · Kategori
PEMINJAMAN   Peminjaman Aktif · Pengembalian
Permintaan   (+ 14 badge)
LAPORAN      Laporan
SISTEM       Pengguna · Log Aktivitas · Pengaturan
             Keluar  (pinned bottom)
```

Each frame's active row is set correctly (05 Dasbor, 06 Permintaan, 07 Barang,
08 Peminjaman Aktif), and every frame was rendered and inspected.

### Phases B–D — done

All eleven remaining pages are built on `main-2.bl` and each was rendered and inspected:

| # | Page | Frame id |
| --- | --- | --- |
| 09 | Katalog Barang | `67e06b833b1e0d81` |
| 10 | Detail Barang (+ availability calendar) | `7abe6a278b089ead` |
| 11 | Detail Permintaan | `f2e667851dfa69ef` |
| 12 | Serah Terima | `6c2884a9a530ad50` |
| 13 | Pengembalian | `d2cdebe810834ec8` |
| 14 | Form Barang | `4bbb199d9e8459db` |
| 15 | Laporan | `ccc67148c901ac8e` |
| 16 | Kategori | `8ec9da28256cd7ef` |
| 17 | Log Aktivitas | `c6c2308d09e56b1c` |
| 18 | Pengguna | `4cb9f0d37db95bce` |
| 19 | Pengaturan | `4a37b62e471237bb` |

Table columns were reworked to fixed proportional widths (`fill:3` first, `fill:2`
rest) after the first pass left header labels misaligned with their data.

### Phase E — partial

Done: table alignment, honest empty areas.
**Not done:** mobile frames (everything is still 1440 wide — NFR04 wants mobile
first-class), empty/loading/error states, and the renumber pass. Dark variants are out
of scope per the owner.

### Kit — partial

A `Kit` canvas exists with a **Button** component set (primary / secondary / danger /
success) and a **StatusBadge** set (7 statuses). Instancing masters across calls proved
unreliable through the bridge ("the master could not be resolved or instantiated"), so
the page shells are generated from one script (`.amp/in/gen.mjs`) instead of consumed as
components. The kit is a start, not yet the single source of the shells.

### v2 requirements delta — applied

A second requirements PDF (`.amp/in/dokumentasi-Web-invent-1.txt`) introduced two roles
and softened two gates. Applied to `main-2`:

| Area | Change | Where |
| --- | --- | --- |
| Roles | Admin (SC, all rights) + PJ Inventaris (OC, operational only) | new `NAV_PJ` in the generator; **20 · Inventaris (PJ Inventaris)** |
| Login | serves both roles; self-service reset removed | 04 — "Admin & PJ Inventaris", "Hubungi admin" |
| FR08 | admin manages PJ accounts; seeds first admin | 18 rebuilt as **Akun PJ Inventaris** |
| FR08 | admin edits own name/password | **21 · Profil Saya** (new) |
| FR12 | approve/reject is admin-only | 11 — Tindakan note |
| FR13 / BR03 / NFR03 | admin **and** PJ upload/verify letters | 11 — surat helper text |
| FR14 / BR04 | soft gates: warning shown, action allowed | 11 + 12 — warning banners, badge now "Surat belum terverifikasi" |
| FR21 | renamed "log aktivitas pengguna", admin-only, paginated, filterable | 17 rebuilt |
| NFR renumber | FR20→FR21, NFR06→NFR07, NFR07→NFR08, NFR08→NFR09 | plan docs reconciled |

Two new frames, both rendered and inspected:

| # | Page | Frame id |
| --- | --- | --- |
| 20 | Inventaris (PJ Inventaris) — role-gated nav, read-only | `9a425c2254bc330b` |
| 21 | Profil Saya | `74ddd4878e940320` |

**Resolved decision (audit recommendation):** FR12 wins over §2.1 — PJ cannot
approve/reject. FR12 is the specific normative statement; §2.2 step 4 agrees with it.

**Open:** whether Profil Saya deserves a full nav destination. It is currently a minimal
name/password form reached from 18, not a sidebar item.

### Brilliant DSL recipe (learned the hard way)

Writing to `main-2.bl` through the MCP bridge works only with this combination:

- Pass `designSystem: "default"` on the `edit` call. `"none"` rejects `$tokens`;
  naming `hmti-polinema` is refused ("a brand you did not author").
- Pin `ds(hmti-polinema)` on **each top-level created element**. That is what makes
  `$tokens` resolve to the HMTI brand (`$font.family` → Montserrat,
  `$primary.mid` → `#EEC643`).
- Write **`$token` refs only**. `tok(path,hex)` is the *read* serialisation, not a
  write form; bare hex and bare numerics halt the call in explicit mode.
- Omit `lh()` — a bare multiplier like `lh(auto,1.21)` is rejected.
- **16-char hex ids are written BARE** in directives (`delete(abc…)`,
  `before(abc…)`, `parent(abc…)`). `#` is only for named refs.
- New children **append** at the end of an auto-layout; build lists in display order.
- **Never issue a `tools/*` call while no tab is bound.** The helper then mints a pairing
  token and opens a *new* tab, stealing the pairing from the one the user has. The driver
  is therefore **connection-gated**: it tracks the helper's `surface connected` /
  `missed 2 keepalive pongs — dropping` stderr lines and re-confirms with `tools/list`
  (answered from cache when unbound, opens nothing) before it will touch the queue. With
  that gate in place a leader restart is safe — the user's tab re-attaches on its own over
  the fallback lane within ~20 s.
- One long-lived driver (`.amp/in/driver.mjs`) is the sole MCP client; it takes queued
  commands from `.amp/in/queue/` and writes replies to `.amp/in/results/`. This avoids
  the follower→leader RPC hop that kept timing out. Give it
  `BRILLIANT_MCP_CALL_TIMEOUT_MS=900000`; the 120 s default cannot finish a page.
- Each `edit` is capped by that timeout, so build a page in stages (shell, then each
  section) rather than one giant call.
- **An empty `t("")` is refused** ("text content cannot be empty; the app auto-removes
  empty text elements") and halts the whole fence at that line. Use an empty frame as a
  spacer instead.
- If a call hangs for >15 min the tab is stuck mid-operation; restarting the driver
  clears it, but a stale payload can replay — verify the frame afterwards rather than
  trusting the first result.

Scripts: `.amp/in/gen.mjs` (shells + atoms), `.amp/in/pages-cd.mjs` (11–19),
`.amp/in/p09.mjs` / `p10.mjs` (09, 10), `.amp/in/driver.mjs` + `q.mjs` / `runcall.mjs`.

---

## 1. What main-2 already has

Eight frames, all `1440×1024`, all `ds(hmti-polinema)`, all light:

| # | Frame | Covers |
| --- | --- | --- |
| 01 | Landing | hero, guest card, 3-step how-it-works, footer |
| 02 | Form Peminjaman | public shell + topbar, identity fields, dates, item picker, submit |
| 03 | Cek Status | public shell + topbar, code lookup, timeline |
| 04 | Login Admin | centred card on brand gradient |
| 05 | Dasbor Admin | admin shell, stat tiles, chart, activity, recent table |
| 06 | Permintaan | admin shell, status tabs, search, request cards, approve/reject |
| 07 | Inventaris | admin shell, summary counters, category filter, stock table |
| 08 | Peminjaman Aktif | admin shell, active/overdue tabs, loan table, return action |

**Shells worth copying verbatim** (they are consistent across frames):

- *Public* (02, 03): `Topbar` 72px, brand left, 1px bottom stroke `$neutral.soft`;
  centred `Scroll` column.
- *Admin* (05–08): `Body` = `Sidebar` 252px on `$tertiary.mid` + `Main`. `Main` =
  `Topbar` 62px (`Right` = bell + user chip) + `Content` (pad 24/32). Sidebar = `Brand`
  (logo + "HMTI Polinema" / "INVENTARIS"), divider, nav rows, spacer, `Nav · Keluar`.
- *Nav rows*: `Dasbor · Inventaris · Peminjaman · Permintaan (+badge) · Laporan`.

**Two structural facts that shape the plan:**

1. **No component masters.** `main-2` has zero `comp()` masters — every frame is
   hand-built and copy-pasted. Nine more pages built the same way will drift.
2. **Desktop only.** All eight frames are 1440 wide. There is no phone frame, and NFR04
   makes mobile first-class.

## 2. What's missing

Against the page inventory in `app-design-plan.md` §5 and the FR list in the
requirements document:

| Plan page | Ref | In main-2? |
| --- | --- | --- |
| Landing | — | ✅ 01 |
| Catalog / browse | FR01 | ❌ |
| Item detail (+ availability calendar) | FR01, FR02 | ❌ |
| Request form | FR03 | ✅ 02 |
| Track by code | FR06 | ✅ 03 |
| Login | FR07 | ✅ 04 |
| Dashboard | FR17 | ✅ 05 |
| Requests list | FR11 | ✅ 06 |
| **Request detail** | FR11–FR13 | ❌ |
| **Handover** | FR15 | ❌ |
| **Return** | FR16 | ❌ |
| Items admin | FR09 | ✅ 07 |
| **Item form** | FR09 | ❌ |
| **Reports / export** | FR18 | ❌ |
| Categories | FR10 | ❌ |
| Admin accounts | FR08 | ❌ |
| Activity log | FR20 | ❌ |

**The design already promises `Laporan`.** Every admin frame (05–08) carries a
`Nav · Laporan` row — it is a dead link today. That is the single clearest gap.

**The lifecycle has a hole in the middle.** 06 · Permintaan approves/rejects from the
list, but there is no request-detail page, and nothing between "approved" and
"Peminjaman Aktif". The physical steps the requirements put between them — letter
upload + verification, handover, return — have no page at all.

## 3. Prep work (do this first)

### 3.1 Build a component set

`main-2` pages are hand-copied, so every remaining page would fork the shells again.
Build masters once on a `main-2 · Kit` section, then compose:

Sidebar · Topbar · NavItem (default/active/with-badge) · Button (primary `$primary.mid`,
secondary, ghost, danger) · StatusBadge (the fixed status map) · TableRow · Card ·
Input / Select / Textarea / FileDrop · Chip · Tab · Stepper · Dialog · EmptyState.

Evidence for each: pull the token values and geometry straight from the frames listed in
§1 rather than inventing. Reuse the existing vocabulary — `radius.md` for controls,
`radius.xl` for cards, `$color.surface` on `$color.surface.container`, `Montserrat`,
`shadow` pairs `y1/blur2 @0.1` + `y8-12/blur24-32 @0.2`.

### 3.2 Restructure the admin nav

The sidebar carries five rows; the plan needs nine admin pages. Pick a grouping, e.g.:

```
Dasbor
Inventaris   → Barang · Kategori
Peminjaman   → Aktif · Pengembalian
Permintaan   (+ badge)
Laporan
Sistem       → Pengguna · Log Aktivitas · Pengaturan
```

This is a decision, not a detail: it changes every remaining admin page's chrome.

### 3.3 Give the public pages a nav

Landing (01) has no nav; 02/03 have a topbar with no links. Catalog and detail need an
entry point, and the form needs a way to reach the catalog. Add one public nav —
`Katalog · Lacak · Ajukan · Masuk admin` — and wire it into 01, 02, 03.

## 4. Decisions

### Settled (owner, 2026-10-05)

**1. Borrower identity — organisation, with a named contact person.**
No per-person borrowing, and no NIM anywhere. The borrower is a UKM/HMJ; the form collects
the organisation plus the person who answers for it. Fields on the request:

| Field | Required | Notes |
| --- | --- | --- |
| Nama organisasi | yes | UKM / HMJ / instansi |
| Nama penanggung jawab | yes | the contact person, not a borrower |
| Kontak | yes | WhatsApp number (primary) |
| Keperluan | yes | purpose |

No NIM, no email field, no "atas nama pribadi" path. Copy that framed the borrower as a
student changes: 02's "Tanpa akun — cukup NIM" → "Tanpa akun — cukup data organisasi".

**2. Notification — Telegram, pengurus-side only.**
The bot posts to the pengurus group on a new request (FR19). The **borrower is not
notified by anything** — no email, no Telegram. They poll the status page with their
tracking code, which is the only borrower-facing status surface. 03's line *"Status juga
dikirim ke email Anda setiap ada perubahan."* is deleted, not reworded to Telegram.

**3. Status vocabulary — the plan's state machine, in Bahasa Indonesia.**

| Enum | Label (UI) | Where |
| --- | --- | --- |
| `Diajukan` | Diajukan | badge, tabs, timeline |
| `Disetujui` | Disetujui | " |
| `Ditolak` | Ditolak | " |
| `surat.diterima` | Surat diterima | timeline + admin letter card |
| `surat.terverifikasi` | Surat terverifikasi | " |
| `Dipinjam` | Dipinjam | " |
| `Selesai` | Selesai | " |
| `Dibatalkan` | Dibatalkan | " |
| `Terlambat` | Terlambat | derived, shown on active loans |

"Menunggu Persetujuan" is retired everywhere — 03's timeline step and 06's tab both become
**Diajukan**. Note the two letter states are a field on `surat`, not request statuses
(overview §5), so the timeline shows them as sub-steps under `Disetujui`.

### Still open

4. **Where the letter lives.** FR13/BR03 make upload admin-only, on the request. 02's form
   is already clean of it — good — so the upload/verify UI belongs on the new request
   detail page. Confirm.
5. **Kategori vs Lokasi.** FR10 asks for categories (stage 2); `Lokasi` is not in the
   requirements at all. 07 already filters by "Semua Kategori". Design Kategori; skip
   Lokasi unless asked.
6. **Mobile + dark.** Decide now whether the phone frames and the dark variants are part
   of this build-out or a later sweep. Either way they are owed (NFR04; plan §7 locked
   "light-first, with the existing dark toggle").

## 4b. Corrections to frames that already exist

The settled decisions above make some `main-2` content wrong today. Fix these in Phase A
so the new pages are built beside correct neighbours:

| Frame | Change |
| --- | --- |
| 02 · Form Peminjaman | Replace the "NIM" field with **Organisasi** + **Penanggung jawab**; keep Kontak (WhatsApp). Drop the student framing. |
| 02 · Form Peminjaman | Item picker availability copy stays; no letter input (already correct). |
| 03 · Cek Status | Delete the email-notification line; replace with "Simpan kode ini untuk mengecek status." |
| 03 · Cek Status | Timeline step "Menunggu Persetujuan" → **Diajukan**. |
| 03 · Cek Status | Identity line "Budi Santoso · TI-2A · Workshop Robotika" → organisation + penanggung jawab. |
| 06 · Permintaan | Tab and card copy "Menunggu" / "Menunggu Persetujuan" → **Diajukan**; borrower line drops NIM. |
| 06 · Permintaan | Search placeholder "Cari pengajuan, nama, atau NIM…" → "Cari pengajuan, organisasi, atau penanggung jawab…". |
| 08 · Peminjaman Aktif | Peminjam rows drop the student/NIM framing, keep organisation + penanggung jawab. |
| 05 · Dasbor Admin | Any "peminjam" wording that implies a person becomes the organisation. |

## 5. The remaining pages

Numbering continues from 08. A final renumber pass (public 01–06, admin 07+) is a tidy-up
for the last phase, not a blocker.

### Public

**09 · Katalog Barang** — FR01
Entry from landing and from the form's item picker. Reuse the public topbar + a search
input and category chips (the `Tabs`/`Search` shapes from 06), then a card grid. Each
card: photo, nama, kategori, kondisi, availability badge (Tersedia / Terbatas / Habis),
free qty. States: results, no-results, loading.

**10 · Detail Barang** — FR01, FR02
Two-column like 02's `Cols`: left = photo + description; right = specs (KONDISI, LOKASI,
MAKS. PINJAM), qty stepper, "Ajukan Peminjaman" CTA. Below: the **month availability
calendar** (FR02) — this is the only place the calendar lives, so it belongs on this page,
not a separate one. States: available, partially booked, fully booked.

### Admin — the lifecycle

**11 · Detail Permintaan** — FR11, FR12, FR13, BR03, BR06, NFR03
The highest-value missing page, and the one the whole physical loop hangs off. Reuse the
admin shell from 06. Blocks: back + kode + status badge; **organisation card** (nama
organisasi · penanggung jawab · kontak · keperluan — no NIM, no personal borrower); item
lines table (barang · diminta · ketersediaan); timeline (reuse the `Steps` shape from 03,
with the two `surat` sub-steps under Disetujui); **letter card** (upload → `diterima` →
`terverifikasi`, with who/when); action bar (Setujui / Tolak with a mandatory-reason
dialog); per-request activity log. Must show the illegal-transition and unverified-letter
states, not just the happy path.

**12 · Serah Terima** — FR15, FR14, BR04
Per-item condition, penerima, timestamp, recorded-by. Gated on a `terverifikasi` letter —
design the blocked state too, since the requirement is a hard gate. Printable *berita
acara* via the design system's `.doc` styling.

**13 · Pengembalian** — FR16, BR05
Per-item condition (Baik / Rusak / Hilang), catatan, summary counts, confirm. Say plainly
that rusak/hilang updates the item's stock — that consequence is the whole point of BR05.

**14 · Form Barang** — FR09
Create/edit: nama, kategori, jumlah, kondisi, lokasi, deskripsi, foto (drag or pick).
Reuse 02's labelled-input and 2-column form grid. Design the referenced-item delete rule
as a visible state.

### Admin — secondary

**15 · Laporan** — FR18
Tabs: Riwayat Peminjaman / Rekap Stok. Date-range and status filters (reuse 06's filter
row), summary tiles, table, and both export paths — CSV/XLSX and print-to-PDF. This is
the page the sidebar has been linking to all along.

**16 · Kategori** — FR10
Table (nama, jumlah barang, aksi), add/edit dialog, delete rule when the category has
items.

**17 · Log Aktivitas Pengguna** — FR21
Read-only, paginated: waktu · admin · aksi · entitas · entitas_id. Filter by admin and
date. **No edit or delete affordance anywhere** — the requirement is that the log cannot
be changed from the UI.

**18 · Akun PJ Inventaris** — FR08
Admin accounts table, create/edit/delete, `peran`. Surface the self-lockout guards
(deleting or demoting yourself / the last active admin) as visible refusals.

**19 · Pengaturan** — optional
Max borrow duration, blacklist, notification toggle, BR07 auto-cancel flag. Only build if
the pengurus want it; nothing in the requirements forces this page.

## 6. Order

```
Phase A  prep        nav structure + component masters + public nav + settle §4
Phase B  public     09 Katalog → 10 Detail Barang (+ calendar)
Phase C  lifecycle  11 Detail Permintaan → 12 Serah Terima → 13 Pengembalian → 14 Form Barang
Phase D  secondary  15 Laporan → 16 Kategori → 17 Log Aktivitas → 18 Pengguna → 19 Pengaturan
Phase E  sweep      mobile frames · dark variants · empty/loading/error · renumber · consistency
```

Phase C is the critical path: it closes the hole between approval and active loan, which
is where the requirements put the most business rules (BR03–BR06, FR13–FR16).

## 7. Verification

Per page, before calling it done:

- **Render it.** Export PNG from Brilliant at 1440 and at 390 width and inspect both.
- **Token discipline.** Every frame carries `ds(hmti-polinema)`; every colour, spacing and
  radius is a token reference. No bare hex. Montserrat throughout.
- **Shell match.** Compare against 05–08 (admin) or 02–03 (public) for padding, nav row
  height, card radius and shadow.
- **Coverage.** Walk the FR list; each new page names the FRs it satisfies.
- **Lifecycle.** The end-to-end smoke test in
  [`plans/inventory-lending/testing.md`](plans/inventory-lending/testing.md) must be
  walkable through the designed pages alone: submit → approve → letter → handover →
  return → stock and statuses correct.

## 8. Blocking item

§4 items 4–6 are still open, but only item 6 (mobile + dark) affects Phase A's scope. The
borrower-identity, notification and status decisions that would have forced rework are
settled, so Phases A–D can proceed.

---

## 9. Outstanding work — plan

Scope agreed with the owner: **items 1, 4, 5, 6, 7** of the audit. Items 2 (mobile) and 3
(empty/loading/error states) are explicitly **not** in this batch. Plan only — nothing
below is built yet.

### 9.1 — PJ variant of the request detail (item 1)

**Problem.** Frame 11 shows Setujui/Tolak to whoever opens it. FR12 forbids PJ approving,
and there is no frame anywhere showing what a PJ sees on a request — the screen they use
most.

**Plan.** New frame **22 · Detail Permintaan (PJ Inventaris)**, built from 11 with:

| Block | Admin (11) | PJ (22) |
| --- | --- | --- |
| Org card, item lines, timeline | same | same |
| Surat card | upload + verify | upload + verify (FR13 — both roles) |
| Soft-gate warning | shown | shown (FR14/BR04 apply to both) |
| Tindakan card | Setujui / Tolak + reason note | **no buttons**; read-only line: "Hanya admin yang dapat menyetujui atau menolak pengajuan." |
| Sidebar | full admin nav | `NAV_PJ` |
| Account chip | "Admin HMTI" | "PJ Inventaris" |

Rendered with `role: "pj"` — the generator already supports this (frame 20 uses it), so
this is one frame, not new machinery.

**Also folded in — confirm.** Frame **05 · Dasbor Admin** has the same defect: its "Barang
Baru" button is admin-only but is drawn for everyone. I did not build a PJ dashboard
variant. It is the same defect class as item 1 and is needed for role-gating to be
coherent, but it was not in your list, so I have left it out of scope pending a yes.

### 9.2 — Public nav and where the catalog lives (item 4)

**Correction applied.** The catalog is **not** a public destination reached from the
landing. It is the surface you use while filling the request form. So:

- **Drop "Katalog" from the public nav.** The public topbar becomes
  `Lacak · Ajukan Peminjaman · Masuk admin`.
- **01 · Landing** keeps no nav bar (it is a hero). Its two paths stay
  "Ajukan Peminjaman" → 02 and "Cek status" → 03. Nothing to add.
- **02 · Form Peminjaman** — the item picker becomes the catalog. Today it is a flat list
  ("Cari barang…", five item rows). Upgrade it to: search, category chips, item rows with
  photo thumb, name, category, availability badge and free-qty, plus add/remove lines.
  This is the only place a borrower browses items.
- **03 · Cek Status** — add the public topbar nav (it currently has only "Kembali ke
  beranda").

**Open fork — 09 / 10.** If the catalog lives in the form, do `09 · Katalog Barang` and
`10 · Detail Barang` survive?

- **(a) Keep them**, reachable *from the form* as an expanded browse and a per-item detail
  with the FR02 availability calendar. The form's picker gets a "Lihat semua" / "Detail"
  affordance. *Recommended:* the form column is ~920px and cannot carry a 6-card grid or
  the month calendar comfortably, and FR02 needs a home.
- **(b) Delete them** and fold everything into 02. Simpler, but the availability calendar
  (FR02) then has nowhere to live and the picker gets cramped.

Recommend **(a)**. Either way "Katalog" leaves the public nav.

### 9.3 — Profil Saya in the nav (item 5)

**Problem.** 21 exists but is unreachable except from 18, and its sidebar highlights
"Pengguna" rather than itself.

**Plan.** Add **Profil Saya** to `NAV_ADMIN` under SISTEM (after Pengaturan). `NAV_PJ` does
not get it — v2 FR08 gives self-edit to admin only; a PJ's password is reset by an admin.
Then frame 21's active row resolves correctly, and 18's "Buka profil saya" button becomes a
shortcut rather than the only path.

### 9.4 — Make the kit real (item 6)

**Problem.** The Kit canvas holds a Button set and a partial StatusBadge set, and is
consumed by nothing. All 21 pages are generated by script. Cross-call `inst()` failed
earlier ("the master could not be resolved or instantiated").

**Plan, in order:**

1. **Probe once.** Try the name-based cross-canvas form the docs bless —
   `inst(Button, canvas(Kit))` — from a page frame. Earlier attempts used `#ref`, which may
   be why they failed. One probe decides the rest.
2. **If it works:** move the shells into the kit as masters (Sidebar, Topbar, NavItem,
   Card, Field, Chip, TableHead/Row, EmptyState, Button, StatusBadge) and have pages
   instance them. That is the deliverable you originally asked for.
3. **If it still fails:** stop fighting it and formalize the fallback — the kit becomes a
   **spec + generator** (`.amp/in/gen.mjs` is already the single source of every shell),
   with the Kit canvas kept as a human-facing visual reference. Document that instancing is
   unreliable over the MCP bridge, so the next person does not retry it blind.

Either way the kit must cover more than Button + StatusBadge: the shells are the repeated
thing, not the atoms.

### 9.5 — Remove 19 · Pengaturan (item 7)

**Plan.** v2 does not require a settings page. Delete frame **19 · Pengaturan** and drop
"Pengaturan" from `NAV_ADMIN`.

The settings it held are real but have no v2 page: max borrow duration, the BR07
auto-cancel flag, the Telegram group ID, and a blacklist. In the implementation plan these
are server-side config (env vars / seed), which is where BR07's "masih usulan" flag belongs
anyway. So deleting the page loses no requirement — but if the pengurus want a UI toggle
for BR07, 19 comes back as an admin-only page and that is a new decision, not this batch.

### Order and cost

```
9.1  frame 22 (PJ request detail)    1 new frame, generator already supports role
9.3  Profil Saya in nav              1 line in NAV_ADMIN + rebuild 21 (and 18, 17)
9.2  public nav + form picker        edit 02, 03, generator publicFrame; delete/keep 09/10
9.5  delete 19                       delete frame + 1 nav line
9.4  kit                             probe first; scope depends on the result
```

9.1 and 9.3 are small and independent. 9.2 is the one with a real open question (the
09/10 fork). 9.4 is the only item whose size is unknown until the probe runs.

### Execution status (owner approved 9.1a, two dashboards, frame grouping)

Done and each verified by rendering:

| Item | Result |
| --- | --- |
| 9.1 | **22 · Detail Permintaan (PJ Inventaris)** built — PJ nav, no Setujui/Tolak, read-only Tindakan note. Verified. |
| 9.1 + 05 | **23 · Dasbor PJ Inventaris** built — PJ nav, no "Barang Baru", read-only lists. Verified. |
| 9.2 | **02** rebuilt with the catalog in-form (search, chips, picker rows, Keranjang, "Lihat katalog lengkap"). **03** rebuilt with the public nav. "Katalog" removed from the public nav. 09/10 kept, reachable from the form. Verified. |
| 9.3 | `NAV_ADMIN` now ends Pengguna · Log Aktivitas · **Profil Saya**; `NAV_PJ` unchanged. Verified. |
| 9.5 | Frame **19 · Pengaturan** deleted; nav row renamed in all 14 admin frames. Verified. |
| 9.4 | **Kit probe succeeded** — see below. |
| grouping | All frames repositioned into a 5-column grid with 224px gutters, grouped by section; 2 stray vector icons deleted. Verified by position read. |

**Kit finding (9.4).** `inst(Button) at(variant(primary))` **works across calls** when the
master is addressed **by name** on its own canvas. The earlier failures used `#ref`, which
does not survive the call boundary. So component instancing over the bridge is viable; the
shells can be converted to masters when wanted.

**Previously blocked, now resolved:** the Brilliant tab hung mid-call and then stopped
re-dialing the leader; a reload in Chrome cleared it. Once back:

- **Picker quantity steppers** on 02 — applied. The first attempt timed out part-way and
  left 9 stepper frames (3 childless ones in row 1, 4 each in rows 2 and 3); the extras
  were deleted in two cleanup passes. Final state verified: **exactly 3 steppers, one per
  picker row**, each showing minus / number / plus.
- **Kit probe cleanup** — the temporary `Probe` frame was already gone ("already absent").
**Final grid**

```
Row 1  Publik         01 Landing · 02 Form · 03 Cek Status · 09 Katalog · 10 Detail
Row 2  Akses/dasbor   04 Login · 05 Dasbor Admin · 23 Dasbor PJ · 06 Permintaan · 07 Inventaris
Row 3  Siklus         08 Peminjaman Aktif · 11 Detail Permintaan · 22 Detail (PJ) · 12 Serah Terima · 13 Pengembalian
Row 4  Inventaris     14 Form Barang · 16 Kategori · 15 Laporan · 20 Inventaris (PJ) · 17 Log
Row 5  Sistem         18 Akun PJ · 21 Profil Saya
```


### 9.6 — Frame 23 rebuilt in the 05 dashboard style (owner request)

The first cut of **23 · Dasbor PJ Inventaris** was a plainer layout (greeting + tiles +
two lists). It has been rebuilt to mirror **05 · Dasbor Admin** exactly, because the two
dashboards should read as one design in two roles. Structure copied from 05:

1. **HeroZone** — gradient banner (`linear(135, secondary.mid → secondary.firm 0.55 →
   tertiary.mid)`) with date / greeting / subtitle on the left and actions on the right,
   then a **StatsRow overlapping it** (negative gap), four cards each carrying
   label + tinted 30x30 chip, big value, and delta + 5-bar sparkline.
2. **MidRow** — a `fill:2` bar-chart card ("Peminjaman per Bulan", 6 bars with the peak
   bar highlighted and a "Feb tertinggi: 71" chip) beside a `fill:1` "Aktivitas Terkini"
   list.
3. **Warning bar** — full-width amber strip.
4. **Peminjaman Terbaru** table card.

PJ-specific differences from 05: the **"Barang Baru" button is removed** (admin-only
FR09) leaving only "Ekspor" (FR18 grants PJ export); the greeting and the warning copy
say "laporkan ke admin" instead of offering an admin action.

Applied and verified. Two defects found in the first pass and fixed:

1. The stat cards sat **below** the banner with a gap instead of overlapping it — the
   HeroZone gap was positive. Fixed with a negative gap (`-32:$spacing.overlap.2xl`);
   `SP.overlap*` helpers were added to the generator for this.
2. The "Ekspor" button rendered mid-banner rather than right-aligned — the left block was
   `fill` so `x(sb)` had no free space to distribute. Fixed by making both banner children
   `hug`, matching 05.

Both re-rendered and confirmed: cards now overlap the banner, Ekspor sits at the right
edge.

### Not in this batch

- **Mobile frames** (item 2) — all 22 frames are 1440 wide; NFR04 wants mobile first-class.
- **Empty / loading / error states** (item 3) — my own §5 lists them as required for 09 and
  10; none are drawn.
- **Doc debt** — `docs/app-design-plan.md` §5 still describes the pre-v2 app (Superadmin
  role, partial approval, email/WhatsApp notification), and this doc's §5 is now corrected for the v2 names.
- **Commit** — nothing in this thread is committed.
