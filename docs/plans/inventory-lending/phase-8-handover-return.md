# Phase 8 — Handover, return & lifecycle rules

Back to [overview](overview.md).

**Goal.** Close the physical loop: record handover, record return with damage/loss,
and enforce the remaining business rules (FR14, BR02, BR04, BR05, BR07). Note the v2
PDF softened FR14 and BR04 from hard gates to warnings.

## Issues

### INV-19 — Handover record (FR15, FR14, BR04)
Admin or PJ records serah terima: per-item condition, penerima name, timestamp,
recorded-by. Status moves to `Dipinjam`. If the letter is not `terverifikasi`, the UI
shows a warning but **allows** the handover (v2 PDF: FR14 and BR04 are soft gates
now). Server permits; no hard block. Logged.

**A proof photo is required** (owner, after v2 — decisions.md D20). The operator
photographs what the borrower is walking away with, so a later disagreement about a
condition has something behind it. Stored in R2 under `handovers/{kode}.{ext}`,
referenced from `serah_terima.file_path`, served staff-only at `/api/bukti/serah/{kode}`,
and shown on the request page next to the recorded handover.

**Accepts:** a handover on an unverified letter succeeds with a visible warning; a
valid handover moves status and is visible on both staff detail and borrower
tracking; the proof photo opens from the request page. Submitting the form with no
photo attached shows "Foto bukti serah terima wajib diunggah." and records nothing.

### INV-20 — Return record + damage/loss handling (FR16, BR05)
Admin or PJ records pengembalian: per-item condition, catatan for rusak/hilang,
timestamp. Status → `Selesai`. When items are rusak/hilang, the item's jumlah/kondisi
are updated per the recorded note (BR05) — the update is part of the same transaction
as the return record. Logged.

**A proof photo is required** (owner, after v2 — see decisions.md D20). The operator
uploads one image of the items as they come back; the form refuses to submit without it
and so does the server, which is what makes it a requirement rather than a nudge. Stored
in R2 under `returns/{kode}.{ext}`, referenced from `pengembalian.file_path`, and served
staff-only at `/api/bukti/kembali/{kode}`. It is shown on the request page next to the recorded
return, because a `rusak`/`hilang` line is a claim and the photo is what settles it.

**Accepts:** a return marking 1 of 3 units lost reduces the item's available stock and
shows in the catalog/calendar immediately; the borrower tracking shows Selesai; the
proof photo opens from the request page. Submitting the form with no photo attached
shows "Foto bukti pengembalian wajib diunggah." and records nothing.

### INV-21 — H-1 letter deadline & auto-cancel (BR02, BR07) + Terlambat
A cron trigger on the same Worker (daily, WIB midnight) checks requests still
`Diajukan`→`Disetujui` whose `tgl_pinjam` is tomorrow with **no letter received**
(BR02 uses receipt language, so `diterima` is the threshold, verification is not
required by this rule): auto-cancel to `Dibatalkan` per BR07, Telegram message
announces it, admin UI keeps a re-approve action on Dibatalkan requests. The handler
is a thin wrapper over an exported, unit-tested `cancelStaleRequests()`.
`Terlambat` is computed for `Dipinjam` requests past `tgl_kembali` — derived at read
time, not a status write.
**Accepts:** a seeded stuck request flips to `Dibatalkan` after the job runs and the
Telegram message lands; an overdue loan shows `Terlambat` in the staff list and
dashboard inputs.

## Data structures
Exercises `serah_terima`, `pengembalian`; the derived `Terlambat` predicate lives next
to the status machine, not scattered.

## Verification
Static: typecheck, lint, tests for the soft-gate behavior, BR05 transaction and the
cron function. Runtime: full happy path in one browser session — approve, verify
letter, hand over, return with damage — then verify stock and statuses everywhere;
run the cron against a seeded H-1 case.
