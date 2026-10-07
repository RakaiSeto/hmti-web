# Phase 5 — Request form, conflict check & tracking

Back to [overview](overview.md).

**Goal.** The core borrower flow: submit a multi-item request, get a code, look up
status by code. Conflict checking happens here, server-side.

## Issues

### INV-12 — Request form (FR03)
Public multi-item form: nama organisasi, penanggung jawab, kontak, item lines (item +
qty, add/remove lines), tanggal pinjam and kembali, keperluan. **No file upload** (BR03
— admins do that). Cart-style line editing with per-line free qty shown from the
INV-03 helper for the chosen range. Client-side checks are convenience only; the
server re-validates everything at the boundary (NFR08): required fields, kembali >
pinjam, pinjam not in the past, qty ≤ free qty.
**Accepts:** full form round-trips at phone width; invalid dates and over-qty rejected
server-side with messages the form surfaces.

### INV-13 — Conflict check & atomic submit (FR04, BR01, BR08)
On submit, server re-runs the availability helper per line for the requested range.
If **any** line is short, the whole request is rejected (no partial approval — overview
§4) with a per-line reason list. Valid requests insert atomically and get status
`Diajukan`. Guard against the two-tabs race: the availability re-check is folded into the
insert statement, not run before it.
**Accepts:** tests cover all-available, one-line-short, same-item-two-requests-raced;
the raced case lets exactly one request through.

**Implementation constraint (decisions.md §1a/§7d).** D1 has no interactive
transactions, so this cannot be written as *read free qty → branch → insert*. The
transactional part has to be one statement that carries the condition itself
(`INSERT … SELECT … WHERE <free qty> >= ?`, then inspect `meta.changes`), or an optimistic
retry loop. Getting this wrong is how the race survives.

### INV-14 — Tracking code & status lookup (FR05, FR06)
Unique code `PINJ-YYYYMM-XXXX` (4 random alphanumerics — see overview §5 rationale)
returned on success (copyable, shown once with a "save this" affordance) and a
`/lacak?kode=` page rendering the request's timeline: status, item lines, dates,
rejection reason when present (BR06 visible here), letter stage shown minimally so
borrowers know where the flow stands.
**Accepts:** a submitted request is findable by code; unknown codes get a clear
not-found; the timeline matches the status machine.

## Data structures
Writes `pengajuan` + `pengajuan_barang`; the transactional availability check is the
key shape. Status transitions stay a named constant list, not inline strings.

## Verification
Static: typecheck, lint, tests for INV-13. Runtime: submit a real request through the
browser at mobile width, hit a deliberate conflict with a second request, then track
both by code.
