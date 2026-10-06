# App design plan — Inventory + Borrowing/Approval

Planning document for the HMTI Polinema inventory and goods-borrowing app. This
defines **what pages get designed and against which rules**, before any design
work starts.

Status: **decisions locked** (see §7). No page designs exist yet.

---

## 1. What we're designing

Two halves in one app:

- **Inventory** — HMTI's goods: items, categories, stock, condition, locations,
  photos.
- **Borrowing** — requests from **outside** (other organisations, departments,
  events) to borrow HMTI's goods, reviewed by admins, with a handover → return
  lifecycle.

All requesters are external and **unauthenticated**; the app's authenticated
surface is staff-only.

## 2. Roles

| Role | Can |
| --- | --- |
| **Guest / external requester** (no account) | Public request form; track status by code |
| **Inventory admin** | Approve/reject (single step), handover, return, manage items/stock |
| **Superadmin** | Users, roles, settings, audit log, reports |

> There is **no HMTI "Member" role** — internal borrowing is out of scope.

## 3. Core flows the designs must support

1. **Request** — browse catalog → pick item + qty + date range + purpose →
   submit with identity + letter upload → receive a **tracking code**.
2. **Approval** — admin queue → **approve / reject in a single step**; **partial
   approval allowed** (approve some lines/qty, reject the rest) with a note.
3. **Handover** — verify items → print *berita acara* → stock reserved/out.
4. **Return** — condition check per item → damaged/lost handling → stock
   restored.
5. **Stock ops** — in/out, adjustment, maintenance/retired status.

Status model to design against:

```
draft → submitted → approved | partial | rejected
                   approved/partial → borrowed → partially_returned → returned
                   (+ overdue, lost, damaged)
```

Because requesters have no account, status is surfaced two ways: the on-screen
**tracking page** (by code) and out-of-band **notification** (email/WhatsApp) —
the design should assume a notification hook even if delivery is out of scope
for the UI.

## 4. Design-system gaps (extension needed before pages)

`design-system/index.html` is marketing-site oriented (hero, article cards,
footer). The app adds a new family, reusing existing tokens:

- **App shell** — sidebar + topbar, breadcrumb, global search, theme toggle.
- **Data display** — data table (sort/filter/select/pagination), timeline/
  stepper, empty & loading states.
- **Status badges** — fixed mapping of each request/item state → existing badge
  palette.
- **Overlays** — dialog, detail drawer, dropdown, tooltip, toast.
- **Form extras** — date-range, combobox, file upload, qty stepper, inline
  errors (§13 of the spec covers the basics).
- **Documents** — printable borrow receipt / *berita acara*.

**Ship these as a v0.2 "App kit" section** in the same `index.html` + a small
`app.css`, so pages compose from a specs'd kit. **Done** — see `design-system/app.css` and
`design-system/index.html` §18 (App kit).

## 5. Page inventory

### Phase 1 — MVP

**Public (no account)**
1. Landing / entry — brand hero + "Ajukan Peminjaman" + "Lacak Permintaan".
2. Catalog / inventory browse — search, category filter, availability.
3. Item detail — specs, photos, available qty, condition.
4. Request form — cart-style lines, date range, purpose, requester identity,
   letter upload → tracking code.
5. Track request by code — status timeline.

**Admin**
6. Login (staff) — guest entry point to the public flow.
7. Dashboard — stats: items, on loan, overdue, pending; recent activity.
8. Requests — list + status filters (the admin inbox).
9. Request detail — timeline, items, approve/reject (partial), notes.
10. Handover screen — verify items, print *berita acara*.
11. Return screen — per-item condition, damage/lost.
12. Items admin — table + CRUD.
13. Item form — create/edit, photos, stock.

### Phase 2

Users & roles, categories/locations, reports + CSV/PDF export, audit log,
settings (max duration, blacklist), notifications, requester profile by code.

## 6. Method & order

1. **Decide** — §7 (done).
2. **Extend** the design system → "App kit" section; review it. *(done: `app.css` + index.html
   §18)*
3. **Low-fi** — all Phase-1 pages as grey-box layouts in one reviewable file.
4. **Hi-fi** — per-page designs in **Brilliant** (chosen tool; OpenPencil was
   evaluated but not adopted for this), using tokens (`#FFE600` fill / `#041587`
   accent / Montserrat).
5. **Handoff** — codegen to React if the app will be built in this repo.

## 7. Locked decisions

| # | Decision | Choice |
| --- | --- | --- |
| 1 | External requesters | **No account**; form + tracking code |
| 2 | Approval depth | **Single admin step**, **partial approval allowed** |
| 3 | Design output tool | **Brilliant** (produce later) |
| 4 | Language | **Bahasa Indonesia** UI |
| 5 | Theme | **Light-first**, with the existing dark toggle |
| 6 | Roles | Guest/external, Inventory admin, Superadmin (no Member) |

Open / not yet specified: notification channel (email vs WhatsApp), max borrow
duration, late-return policy, and the canonical brand blue (§README blocking
decisions) — none block the layout work.
