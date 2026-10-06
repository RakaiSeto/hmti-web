# Phase 7 — Staff review & letters

Back to [overview](overview.md).

**Goal.** The staff side of the queue: filter requests, decide with reasons (admin
only), and run the letter intake/verification step (admin and PJ).

## Issues

### INV-16 — Request list + filters (FR11)
Admin table of requests: kode, organisasi, dates, items summary, status. Filter by
status and by date range. Row → detail page (reuses the borrower timeline plus admin
actions). Pending-first default sort. Actions logged.
**Accepts:** filters compose correctly against seeded data across statuses; detail
page reachable from the row; PJ inventaris sees this surface (it's operational).

### INV-17 — Approve / reject, admin-only (FR12, BR06)
**Only admin** can approve or reject (v2 PDF: "PJ inventaris tidak bisa"). Approve
moves `Diajukan → Disetujui`; reject requires a non-empty alasan_penolakan (enforced
server-side, not just in the UI) and moves to `Ditolak`. Both only from `Diajukan` —
the status machine from overview §5 is the gate, illegal transitions rejected
server-side. Confirmation dialog before both. Logged.
**Accepts:** a PJ attempting approve/reject gets 403; rejecting without a reason is
refused by the API; approving an already-decided request fails; the borrower's
`/lacak` page shows the outcome and reason.

### INV-18 — Letter upload & verification (FR13, BR03, NFR03)
Admin **or PJ inventaris** uploads the letter (PDF or image) to the R2 `letters/`
prefix — staff-only upload, this is the only other upload path in the system. Served
through an authed route only, never cached. Two-step state: `diterima` →
`terverifikasi`, each settable by either role, both logged with who/when. Re-upload
replaces the file, keeping history simple (latest only).
**Accepts:** a logged-out fetch of a letter file is refused; the two-step verification
is visible in the request timeline; upload of a wrong file type is rejected; PJ can
upload and verify.

## Data structures
Exercises `surat` and the status machine. Letter file naming: code-based, not
user-supplied.

## Verification
Static: typecheck, lint, transition-guard tests. Runtime: in a browser as admin —
filter the queue, reject one request with a reason, approve another, upload + verify
its letter, then confirm the borrower-side tracking reflects all of it.
