# Verification strategy

Applies to every phase; each phase file names its specifics.

**Static, every phase.** Typecheck, lint, and the phase's unit tests must pass before
the phase is called done. Phases 1, 5, 7, 8 carry the concentrated logic tests
(availability, conflicts, transitions, role guards, business-rule gates).

**Runtime, every phase.** Exercise the real UI in a browser — desktop and phone width,
since NFR04 makes mobile first-class. Phase order is chosen so each phase's runtime
check builds on the previous one's working surface: submit flows need catalog data
(Phase 3), review needs requests (Phase 5), and so on.

**Lifecycle smoke test.** The canonical end-to-end proof, run at Phases 8 and 10:
seed → submit (conflict + success) → Telegram fires → admin approves / PJ tries and
is blocked → reject-with-reason path → letter upload + verify (PJ) → handover →
return with damage → stock and statuses correct everywhere → dashboard and reports
reconcile → cron run cancels the H-1 stuck case.

**Honest failure.** If a surface can't be verified (e.g., Telegram needs a real group,
deployment needs credentials), say so in the phase's PR rather than approximating it.
