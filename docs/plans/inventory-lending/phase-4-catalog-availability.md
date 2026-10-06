# Phase 4 — Public catalog & availability calendar

Back to [overview](overview.md).

**Goal.** The borrower-facing read side: what items exist and when they are free.

## Issues

### INV-10 — Public item list + detail (FR01)
Public pages showing items with photo, kategori, jumlah, kondisi, and current
availability. Search by name, filter by kategori. Detail page shows the same plus
location and the calendar link. Mobile-first (NFR04); no auth anywhere.
**Accepts:** list renders from seeded data at phone width; filters and search work;
availability reflects the INV-03 helper, not a stored flag.

### INV-11 — Per-item availability calendar (FR02)
Month-view calendar per item: each day shows free qty (or booked/partially booked),
built from the INV-03 helper over the visible month plus the item's total. Reuse the
app kit's date components; plain HTML/CSS if the kit lacks a calendar — no heavyweight
dependency without a reason.
**Accepts:** seeded overlapping requests produce correctly marked days; navigation
across months works; empty months render an honest empty state.

## Data structures
Read-only over `barang`, `kategori`, `pengajuan(_barang)`. Availability is derived —
this phase must not add any cached availability column.

## Verification
Static: typecheck, lint, helper-based tests for calendar day computation. Runtime:
seed two overlapping requests and confirm the calendar shows reduced qty on exactly
the overlapping days, checked in a browser at mobile width.
