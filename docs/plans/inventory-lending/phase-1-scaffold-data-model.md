# Phase 1 — Scaffold & data model

Back to [overview](overview.md).

**Goal.** A running TanStack Start app on Cloudflare (D1 + R2) whose schema encodes
every entity in §7 of the requirements, plus the one shared availability helper
everything else consumes.

## Issues

### INV-01 — Scaffold TanStack Start + Cloudflare bindings — **done in Phase 0**
Landed: TanStack Start + TypeScript on Bun, deployed as one Worker. `wrangler.jsonc` with
D1 + R2 bindings, `@cloudflare/vite-plugin` for fully local dev, Better Auth wired on the
Drizzle/D1 adapter, tokens generated from the Brilliant canvas into
`src/styles/tokens.css`, and CI running route-tree generation + `wrangler types` +
typecheck + lint + tests. Secrets via Workers env vars only (NFR09 starts here). Public
shell pages (`/`, `/lacak`, `/masuk`) exist as placeholders using the design's tokens.
What is **not** done and moves to this phase: the domain schema and its migrations (INV-02).
The custom server entrypoint for the cron trigger moves to Phase 8 — nothing needs a
`scheduled` export until BR07 (decisions.md D13).
**Accepts:** `bun run dev` serves the shell against local D1/R2; typecheck and lint pass;
`wrangler deploy` works to `*.workers.dev`; no secret in the repo.

### INV-02 — Schema + migrations for all nine entities
**Auth tables already exist** — Phase 0 created Better Auth's `user`, `session`,
`account` and `verification` (with `peran` on `user`), and applied them as
`drizzle/0000_*.sql`. There is no separate `admin` table and no `password_hash` column to
write: Better Auth owns credentials. This phase adds the eight domain tables.

Entities from requirements §7: `kategori`, `barang`, `pengajuan`, `pengajuan_barang`,
`surat`, `serah_terima`, `pengembalian`, `log_aktivitas`. Key shapes (one-line sketch):
- `kategori(nama UNIQUE)`
- `barang(nama, kategori_id FK, jumlah, kondisi, lokasi, foto_path)`
- `pengajuan(kode UNIQUE, organisasi, penanggung_jawab, kontak, tgl_pinjam, tgl_kembali, keperluan, status, alasan_penolakan)`
- `pengajuan_barang(pengajuan_id, barang_id, jumlah)` — the multi-item line table (BR08)
- `surat(pengajuan_id, file_path, status_verifikasi, diunggah_oleh, waktu)`
- `log_aktivitas(pengguna_id, aksi, entitas, entitas_id, waktu)` — append-only, no delete path ever coded
`tgl_pinjam` / `tgl_kembali` are `YYYY-MM-DD` TEXT, never timestamps (decisions.md D10).
Status as an enum exactly matching overview §5. Seed script: realistic fakes, one admin
(the FR08 "akun admin pertama dibuat sekali saat sistem dipasang"), a few
kategori/barang. Note `disableSignUp` is on, so the seed inserts the first account
directly rather than calling a sign-up endpoint.
**Accepts:** migrations run clean against a fresh local D1; seed produces browsable
data; deleting a user cascades their sessions (already true from Phase 0).

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
