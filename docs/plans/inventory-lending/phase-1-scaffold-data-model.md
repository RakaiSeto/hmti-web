# Phase 1 — Scaffold & data model

Back to [overview](overview.md).

**Goal.** A running TanStack Start app on Cloudflare (D1 + R2) whose schema encodes
every entity in §7 of the requirements, plus the one shared availability helper
everything else consumes.

## Issues

### INV-01 — Scaffold TanStack Start + Cloudflare bindings
Scaffold per the stack decision in overview §6: TanStack Start + TypeScript, deployed
as one Worker. `wrangler.jsonc` with D1 + R2 bindings, `getPlatformProxy()` for fully
local dev, `tokens.css` + `app.css` wired in the root layout (dark mode scrapped).
Custom server entrypoint set up from day one so the cron trigger has a home (INV-21
needs it). Secrets via Workers env vars only (NFR09 starts here). Ship the public
shell pages (`/`, `/lacak`) as placeholders using the app kit.
**Accepts:** `npm run dev` serves the shell against local D1/R2; typecheck and lint
pass; `wrangler deploy` works to `*.workers.dev`; no secret in the repo.

### INV-02 — Schema + migrations for all nine entities
Entities from requirements §7: `admin`, `kategori`, `barang`, `pengajuan`,
`pengajuan_barang`, `surat`, `serah_terima`, `pengembalian`, `log_aktivitas`, plus
`sessions` for auth. Key shapes (one-line sketch):
- `admin(nama, email/username UNIQUE, password_hash, peran IN ('admin','pj_inventaris'))`
- `sessions(token PK, admin_id FK CASCADE, expires_at)` — revocation by cascade
- `pengajuan(kode UNIQUE, organisasi, penanggung_jawab, kontak, tgl_pinjam, tgl_kembali, keperluan, status, alasan_penolakan)`
- `pengajuan_barang(pengajuan_id, barang_id, jumlah)` — the multi-item line table (BR08)
- `surat(pengajuan_id, file_path, status_verifikasi, diunggah_oleh, waktu)`
- `log_aktivitas(pengguna_id, aksi, entitas, entitas_id, waktu)` — append-only, no delete path ever coded
Status as an enum exactly matching overview §5. Seed script: realistic fakes, one
admin (the FR08 "akun admin pertama dibuat sekali saat sistem dipasang"), a few
kategori/barang.
**Accepts:** migrations run clean against a fresh local D1; seed produces browsable
data; cascade delete of an admin removes their sessions.

### INV-03 — Availability helper (BR01 + BR08 engine)
One query helper (Drizzle): free qty for `barang` over a date range =
`jumlah_total − Σ pengajuan_barang.jumlah` where the parent pengajuan status ∈
{Disetujui, Surat diterima, Dipinjam} and ranges overlap. Unit tests: no overlap,
boundary-touching dates (checkout/checkin same day = no conflict — decide and encode
once, document in a comment on the helper), multiple overlapping requests, status
exclusions.
**Accepts:** the calendar, request validation and admin views will all import this one
helper; tests prove the boundary rule chosen.

## Data structures
The status enum, the role enum, and the availability helper are the deliverable here,
more than the tables.

## Verification
Static: typecheck, lint, unit tests for INV-03. Runtime: seeded app renders the shell
in a browser at desktop and mobile widths; `npm run preview` runs the built Worker
locally with bindings.
