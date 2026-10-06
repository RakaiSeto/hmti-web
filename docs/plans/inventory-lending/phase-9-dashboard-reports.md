# Phase 9 — Dashboard & reports

Back to [overview](overview.md).

**Goal.** The stage-2 (S priority) management views: summary dashboard and exportable
reports. Both roles see these (v2 PDF: dashboard and laporan are for admin and PJ).

## Issues

### INV-22 — Dashboard (FR17)
Admin landing showing: new requests (`Diajukan`), active loans (`Dipinjam`), overdue
(`Terlambat`, from the INV-21 predicate), plus recent activity from the log. Cards
link into filtered queue views. Counts derive from the same helpers as everywhere
else — no separate counting logic.
**Accepts:** numbers match the filtered lists they link to on seeded data; renders
cleanly at mobile width.

### INV-23 — Reports & export (FR18)
Admin report of borrowing history (filterable by date range/status) and a stock recap
(per item: total, currently out, damaged/lost tally from returns). Export to Excel
(CSV/XLSX) and print-to-PDF via the app kit's printable `.doc` styling rather than a
PDF-generation dependency.
**Accepts:** exports open correctly in a spreadsheet app and match on-screen rows;
stock recap reconciles with a hand-written count on seeded data.

## Data structures
Read-only; the damaged/lost tally reuses `pengembalian.catatan`-linked records, so
INV-20's data must be structured to support the tally — check, and adjust INV-20's
record shape here only if it genuinely can't answer (redesign-from-first-principles,
not a bolt-on).

## Verification
Static: typecheck, lint. Runtime: verify dashboard numbers against seeded states in a
browser; download both exports and open them. Confirm PJ inventaris can reach both
surfaces.
