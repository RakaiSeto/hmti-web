# Phase 6 — Telegram notification

Back to [overview](overview.md).

**Goal.** Every new request pings the pengurus group automatically (FR19), with
credentials never in the repo (NFR09).

## Issues

### INV-15 — Bot notification on new request (FR19, NFR09)
On successful request insert, a queue-table row is written inside the same D1
transaction (settled decision 8b: at-least-once). A drain step — invoked in-request
after commit and by the cron — sends one plain-text message to the pengurus group via
the Bot API: kode pengajuan, organisasi, penanggung jawab, item lines with qty,
tanggal pinjam/kembali, keperluan. Bounded retry; if Telegram still fails, the request
is **already saved**, the queue row stays for the next drain, and the failure is
logged to server logs (not the activity log — FR21 is staff actions only). Token and
group ID come from env vars only; document setup in the README.
**Accepts:** a test request produces a correct message in a real group; killing the
network during send still leaves the request saved, coded, and eventually notified on
the next drain; no secret appears in code, logs or the client.

## Data structures
New table: `notifikasi_queue(pengajuan_id, payload, attempts, sent_at)` — written
in-transaction, drained with bounded retry, rows deleted on success.

## Verification
Static: typecheck, lint; message-format unit test. Runtime: submit through the browser
and watch the group message land; then simulate send failure and confirm the request
still tracks fine by code.
