# Implementation plan — HMTI inventory + lending website

Source of truth: the requirements document, **v2** (`dokumentasi-Web-invent-1.pdf`,
converted to `.amp/in/dokumentasi-Web-invent-1.txt` — the one with Admin/PJ Inventaris
roles). Where it contradicts `docs/app-design-plan.md`, the PDF wins. Breakdown of
every FR/BR/NFR into executable GitHub-ready issues, ordered into ten independently
shippable phases.

Status: **plan only, nothing implemented.**

---

## 1. Context

HMTI Polinema needs a web app for managing its goods (inventory) and handling loans from
UKM/HMJ organisations. Borrowers are unauthenticated organisations; HMTI admins (pengurus)
run everything else. The design system v0.2 app kit already exists in `design-system/`
(`tokens.css`, `app.css`, spec in `index.html` §18). No application code exists yet.

The borrowing lifecycle is document-gated: request → admin decision → **physical letter
arrives outside the system** → admin uploads + verifies letter → handover → return.

## 2. Scope

**In:** everything the requirements PDF lists — public catalog + availability calendar,
request form with conflict checking and tracking code, status lookup by code, Telegram
bot notification, admin auth + admin account management, item/category CRUD, request
review (approve/reject with reason), letter upload + verification, handover and return
records, activity log, dashboard and reports/export (stage-2), all business rules BR01–
BR08, all NFRs.

**Out (explicitly):** per-person borrowing (only UKM/HMJ), requester file uploads, email
or WhatsApp notifications, stock movements beyond the damage/loss adjustment in BR05,
HMTI internal "member" role, multi-level approval.

## 3. Constraints

- **Language:** Bahasa Indonesia UI (`docs/app-design-plan.md` locked decision 4).
- **Styling:** consume `design-system/tokens.css` + `app.css` directly; do not introduce
  a second styling system. Light mode only, per user decision — the dark tokens stay
  in the design system but the app never sets `data-theme`.
- **NFR07:** widely-used stack, documented, maintainable by the next cabinet. No exotic
  dependencies.
- **NFR09:** Telegram token and group ID live in server env vars only; never committed.
- **NFR03:** letter files are served only to authenticated staff — admin or PJ
  inventaris (no public bucket).
- Mobile-first layout (NFR04) — most borrowers arrive from a phone.
- Repo has no CI yet; each phase adds its own verification commands.

## 4. Conflicts resolved (old design plan vs requirements PDF)

The earlier `docs/app-design-plan.md` locked decisions before this requirements document
existed. The PDF is authoritative:

| Topic | Old plan said | PDF says | Resolution |
| --- | --- | --- | --- |
| Partial approval | Allowed | FR04/BR08: if any item is unavailable the whole request is rejected | **No partial approval.** Single approve/reject per request |
| Letter upload | Requester uploads with form | Only admins and PJ inventaris upload (BR03, FR13) | **Staff-only upload.** Request form has no file input |
| Notification | Email/WhatsApp hook | FR19: Telegram bot to the pengurus group | **Telegram**, queue-based, save must survive send failure |
| Status model | draft→submitted→approved→borrowed→partially_returned | Diajukan, Disetujui/Ditolak, Surat diterima, Dipinjam, Selesai, + Dibatalkan, Terlambat | **PDF model** (see §5) |
| Stock ops | in/out, adjustment, maintenance | Only jumlah/kondisi updated on BR05 damage/loss | **PDF scope** |
| Hard gates | FR14/BR04: unverified letter blocks Dipinjam/handover | v2 PDF: warning shown, action still allowed | **Soft gates.** UI warning, server permits; only approval itself is a hard step |

## 5. Domain model (the shapes everything hangs off)

**Request status machine** (one field on `pengajuan`):

```
Diajukan ──▶ Disetujui ──▶ Surat diterima(terverifikasi) ──▶ Dipinjam ──▶ Selesai
    │              │
    │              └─▶ Ditolak (alasan wajib, BR06)
    └─▶ Dibatalkan (auto at H-1 if no letter, BR07 — pending org confirmation)
Terlambat: derived state when Dipinjam and today > tgl_kembali
```

**Letter verification** is its own two-valued field on `surat` (`diterima` →
`terverifikasi`). The v2 PDF makes it a *soft* gate: FR14/BR04 turn "block Dipinjam /
handover without verification" into "warn, but allow". Only approval itself (FR12) is
a hard step.

**Availability** is derived, never stored: an item's free qty on date range D =
`jumlah_total − Σ jumlah` over request lines whose request status ∈ {Disetujui, Surat
diterima, Dipinjam} and whose range overlaps D (BR01, BR08). One SQL view or query
helper; the calendar, form validation and admin views all read the same helper.

**Roles** (v2 PDF): `peran` ∈ {admin, pj_inventaris}. Admin = Steering Committee,
all rights. PJ Inventaris = Organizing Committee, operational only — cannot manage
items/categories/accounts, cannot see the log. Permission checks live in one
`requireRole()` guard per server function, not scattered conditionals.

**Tracked-code format** (FR05): `PINJ-YYYYMM-XXXX` where XXXX is 4 random
alphanumerics (~1.6M keys/month). Readable and month-sortable, but the random tail
exists because the code is the only auth on `/lacak` — a fully sequential suffix
would let anyone enumerate other orgs' requests (organisasi, kontak, borrowing
history).

**Activity log** (FR21): append-only table `(pengguna, aksi, entitas, entitas_id,
waktu)`, written by one `logAksi()` call at each mutation site; admin-only read view,
no UI to edit or delete it.

## 6. Alternatives considered (stack)

| | A: TanStack Start + Cloudflare | B: Laravel + MySQL | C: Next.js + Postgres |
| --- | --- | --- | --- |
| Fits repo | Plain-CSS tokens drop in untouched; SSR + server functions in one framework | Blade can consume the same CSS | Same |
| Maintainability (NFR07) | One language, mainstream, free tier covers the org's load | Most common in Indonesian orgs, cheap shared hosting | Mainstream |
| Overlap queries (BR01/BR08) | D1 (SQLite) transactions, serializable single-writer | Fine | Postgres range overlap, clean |
| Telegram + cron (FR19, BR07) | Cron trigger on the same Worker, custom server entrypoint | Easy | Route handler + platform cron |
| File handling (NFR03) | R2 private bucket, served through authed Worker route | Local disk or S3 | External blob store needed |

**Choice: A (TanStack Start + TypeScript + Cloudflare Workers/D1/R2, Drizzle).** Full
serverless setup: one Worker (SSR + cron trigger via custom server entrypoint), D1 for
data, private R2 bucket for files, WAF rate limiting + Turnstile, `hmti.rakaiseto.com`.
Auth notes: opaque session tokens in a D1 `sessions` table (revocation by FK cascade),
scrypt password hashing via `@noble/hashes` (argon2 impractical on Workers), Telegram
sends via a queue table drained in-transaction, D1 Time Travel + monthly D1→R2 export
for backups. Grilled and settled with the user 2026-10-05.

## 7. Phases

Infra and shared types land first; each phase ends shippable.

| Phase | Delivers | Issues | Requirement coverage |
| --- | --- | --- | --- |
| [1 — Scaffold & data model](phase-1-scaffold-data-model.md) | TanStack Start + D1/R2 scaffold, schema, migrations, availability helper | INV-01…03 | §7 data needs, BR01/BR08 engine |
| [2 — Auth, roles & audit log](phase-2-auth-audit.md) | Login, admin/PJ accounts, role guards, activity log | INV-04…06 | FR07, FR08, FR21, NFR01 |
| [3 — Inventory admin](phase-3-inventory-admin.md) | Category + item CRUD, photos | INV-07…09 | FR09, FR10 |
| [4 — Public catalog & calendar](phase-4-catalog-availability.md) | Item list, detail, availability calendar | INV-10…11 | FR01, FR02 |
| [5 — Request & tracking](phase-5-request-tracking.md) | Request form, conflict check, code, status lookup | INV-12…14 | FR03–FR06, NFR02, NFR08 |
| [6 — Telegram bot](phase-6-telegram.md) | Auto-notification on new request | INV-15 | FR19, NFR09 |
| [7 — Review & letters](phase-7-review-letters.md) | Admin queue, approve/reject, letter upload+verify | INV-16…18 | FR11–FR13, BR03, BR06, NFR03 |
| [8 — Handover & return](phase-8-handover-return.md) | Handover/return records, lifecycle rules, H-1 cancel | INV-19…21 | FR14–FR16, BR02/BR04/BR05/BR07 |
| [9 — Dashboard & reports](phase-9-dashboard-reports.md) | Summary dashboard, history + stock export | INV-22…23 | FR17, FR18 |
| [10 — Hardening & deploy](phase-10-hardening-deploy.md) | Mobile polish, spam defense, docs, deployment | INV-24…26 | NFR04–NFR07 |

[Verification strategy](testing.md) applies per phase.

## 8. Open decisions (do not block; defaults chosen)

1. ~~**Stack**~~ — settled 2026-10-05 via grilling: TanStack Start + Cloudflare.
2. **BR07 auto-cancel** — implemented as a real status write to `Dibatalkan` at H-1
   (on letter *receipt*, per BR02 wording), Telegram message announces it, admin UI
   keeps a re-approve action on Dibatalkan requests.
3. ~~**Hosting**~~ — settled: Cloudflare Workers, `hmti.rakaiseto.com` day one.
4. **Late policy** — what actually happens on Terlambat is unspecified beyond the flag;
   Phase 9 reports it, no enforcement designed.

## 9. Implementation guidance

- Read the **Principles** of poteto-mode first; this plan assumes them.
- **model-the-domain** and **boundary-discipline** govern Phases 1 and 5: the status
  machine and availability helper are the core; validate at the form/API boundary,
  trust internal types after that. Role permissions follow the same rule: one
  `requireRole()` guard per server function, never scattered conditionals.
- **foundational-thinking** set the phase order — availability helper and status enum
  land in Phase 1 so every later phase consumes one definition.
- **sequence-verifiable-units:** each phase ships alone with its own verification; do
  not stack phases in one PR.
- **prove-it-works:** every phase verifies on the real UI (browser), not just tests.
- **exhaust-the-design-space** was applied to the stack choice (§6); apply it again only
  if the pengurus reject default A.
- **subtract-before-you-add** settled §4 — the old plan's partial approval, member role
  and stock ops are deleted, not carried forward.
- Keep a **show-me-your-work** decision trail across phases; this is a multi-PR program.
- **unslop** and **technical-writing** apply to every doc, README and commit message.
