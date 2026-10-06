# Phase 2 — Auth, roles & audit log

Back to [overview](overview.md).

**Goal.** Admins and PJ inventaris log in, admin manages PJ accounts, and every staff
mutation from here on records who did what to which data when (FR21).

## Issues

### INV-04 — Login/logout for admin and PJ (FR07, NFR01)
Session-cookie auth against the D1 `sessions` table. Passwords hashed with scrypt via
`@noble/hashes` (per-password random salt; Workers can't run argon2/bcrypt natives).
HTTP-only cookie, one `requireAuth()` / `requireRole()` guard applied per server
function, login page styled from the app kit. Logout destroys the session row.
**Accepts:** unauthenticated access to any staff route redirects to login; a PJ can
log in and out; hashed password round-trips; logout kills the row.

### INV-05 — Account management with roles (FR08)
Admin CRUD over PJ inventaris accounts: create, edit name, reset password, delete.
Admin edits their own name and password. First admin exists only via the seed script
(INV-02) — no public bootstrap path. Deleting the last admin is refused; deleting a
PJ cascades their sessions (already built in INV-02). `peran` drives one
`requireRole('admin')` guard, not scattered checks.
**Accepts:** full PJ CRUD works; PJ accounts cannot reach item/category/account
management (server-side 403, not just hidden UI); last-admin guard has a test.

### INV-06 — Activity log core (FR21)
One `logAksi(pengguna, aksi, entitas, entitas_id)` called at every mutation site
built from this phase onward (login, account changes). Admin-only paginated log view,
filterable by pengguna/action/date, no edit/delete routes exist. Later phases just
add call sites.
**Accepts:** doing anything in this phase appears in the log with correct user,
action, entity and time; a PJ hitting the log route gets 403; the table has no
update/delete code path.

## Data structures
Reuses `log_aktivitas` and `sessions` from INV-02; `peran` enum is the new shape.

## Verification
Static: typecheck, lint, tests for the role guards, last-admin guard and log writes.
Runtime: log in as each role in a real browser, create a PJ as admin, verify the PJ
is blocked from admin-only surfaces, see all actions in the log view; confirm a
logged-out request to a staff URL redirects.
