# Phase 3 — Inventory admin

Back to [overview](overview.md).

**Goal.** Admins fully manage the goods catalog: categories (stage-2 priority but
needed as FK targets) and items with photos. PJ inventaris has no access here —
admin-only surfaces (v2 PDF role split).

## Issues

### INV-07 — Category management (FR10)
CRUD for `kategori` in the admin area. Deleting a category with items is refused or
requires reassignment — pick one, state it in the UI. Every item mutation here logs
via `logAksi`.
**Accepts:** CRUD works; deletion rule enforced and visible; actions logged.

### INV-08 — Item CRUD (FR09)
Create/edit/delete `barang`: nama, kategori, jumlah, kondisi, lokasi, foto. Photo
upload into R2 `photos/` (image, size cap); item delete soft-refuses or warns when the
item appears in non-final requests (state the chosen rule in the UI).
Validation at the form boundary including jumlah ≥ 0. Admin-only via
`requireRole('admin')`.
**Accepts:** full CRUD with photo works in a real browser; a referenced item cannot
silently vanish from a pending request; actions logged.

### INV-09 — Item photo handling
Upload to R2 `photos/` prefix (image, size cap), store, serve, replace, remove.
Serving goes through the Worker with long cache TTLs (public data, NFR04-friendly).
One helper reused by the admin item form; letter uploads in Phase 7 use the same
bucket's `letters/` prefix with the opposite access rule (NFR03).
**Accepts:** photo round-trips correctly; oversized/invalid files rejected with a
clear message.

## Data structures
No new tables; this phase exercises `kategori`, `barang`, `log_aktivitas`.

## Verification
Static: typecheck, lint, validation tests. Runtime: drive item create → edit → photo
replace → delete in the browser, and see each step in the activity log.
