# Phase 10 — Hardening, docs & deployment

Back to [overview](overview.md).

**Goal.** Ship-ready: spam defense on the public form, performance sanity, user-facing
documentation, deployment.

## Issues

### INV-24 — Spam protection on public forms (NFR02)
Rate-limit request submission via a Cloudflare WAF rate-limiting rule on the submit
route (free, zero code), plus Turnstile on the request form. Tracking lookups get the
rate limit without the captcha.
**Accepts:** rapid repeat submissions are refused with a readable message; a normal
single submission is unaffected.

### INV-25 — Performance pass (NFR05)
Measure the public landing, catalog and calendar on a throttled connection; fix what's
actually slow (image sizing on catalog photos, query plans on the calendar month
range, payload trimming). Cloudflare's edge makes most of this free; measure before
touching anything.
**Accepts:** documented before/after timings for the three key pages.

### INV-26 — Documentation & deployment (NFR07)
README covering: local setup (wrangler + `getPlatformProxy`), env vars (including
Telegram + Turnstile secrets), backup runbook (D1 Time Travel restore + the monthly
D1→R2 export cron from INV-21's infrastructure, so state outlives the 7-day free-tier
restore window), and a pengurus-facing operating guide for both roles (how the weekly
flow works: queue → letter → handover → return). Deploy to Cloudflare Workers at
`hmti.rakaiseto.com`, secrets set in the platform, cron triggers scheduled.
**Accepts:** a fresh machine follows the README to a working app; production serves
the seeded happy path end to end; the backup runbook names the exact commands.

## Verification
Static: full typecheck, lint, test suite green. Runtime: post-deploy smoke test of the
complete lifecycle in production — submit, notify, approve, verify, hand over, return —
plus the rate-limit behavior live.
