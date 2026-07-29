# Web Dashboard — Build Plan (`apps/web`)

**Goal:** turn the web app from a mock-data prototype into a fully-wired management console that mirrors the mobile app + API, for the roles that use the web: **PLATFORM_MANAGER** (web-only), **SUPER_ADMIN**, **ADMIN**. Employees stay mobile-only.
**Companions:** grounded in `MODULE_AUDIT.md` (mobile+API, ~88% ready) and `WEB_AUDIT.md` (web ~UI 90% / integration 10%).

---

## 0. Product principles (apply to every screen)

1. **Built for a non-technical user** — "see → navigate → do". No jargon, no query builders. Every screen answers *what is this / what can I do / what's the one primary action*. Big obvious primary buttons, plain-language labels, confirm dialogs for anything destructive, guided empty states.
2. **Keep the existing UI/UX** — reuse the current design system (`components/ui/*`: Button, Modal, Select, Input, Badge, EmptyState, ConfirmDialog, Skeleton) and shell (`AdminShell`, `Sidebar`, `TopBar`, `BreadcrumbNav`). No visual redesign — extend, don't replace.
3. **Responsive** — desktop-first (admins on laptops), but usable to tablet/phone: sidebar → hamburger drawer < 1024px; data tables → stacked cards < 768px; forms single-column < 640px.
4. **Secure** — cookie (httpOnly) sessions + **2FA on login**, platform-lock (EMPLOYEE blocked on web), permission-gated nav and actions.
5. **One contract** — call the real API through the shared `@godigitify/api-client`, not the parallel axios layer. Types come from `@godigitify/types`. Web can never drift from the endpoints mobile uses.

---

## 1. Foundation (must land first — unblocks everything)

| # | Work | Why | Touches |
|---|---|---|---|
| F1 | **Auth cookie contract** — API sets httpOnly `access_token`(15m)+`refresh_token`(7d) cookies on login/refresh via `@fastify/cookie`, in addition to the body (mobile unchanged). | Web middleware + SSR session already expect the cookie; today the API sets none, so login can't complete. | `apps/api` auth, `apps/web` login |
| F2 | **Adopt shared `api-client`** — point web services at `@godigitify/api-client` with a cookie-aware token getter; delete the parallel axios data calls. | Kills the mock/own-client drift risk (WEB_AUDIT §3). | `apps/web/services`, `lib` |
| F3 | **Retire mocks** — replace every `services/*.service.ts` body (tasks, dashboard, users, departments, audit, reports, notifications) with real calls; delete `src/data/*.mock.ts`. | Web is UI-only until this. | `apps/web` |
| F4 | **Platform-lock** — send `x-client-platform: web`; API rejects EMPLOYEE on web / PLATFORM_MANAGER on mobile (directive §5). | RBAC surface separation. | api + web |
| F5 | **Public `/setup` + `/reset-password` pages** — resolve the invite/reset **email links** already wired server-side (nodemailer). Call `/auth/accept-invite` and `/auth/reset-password`. | The emails point at `FRONTEND_URL/setup` and `/reset-password` — no landing page exists yet. | `apps/web (auth)` |

---

## 2. Two-factor authentication (2FA)

**Design: email OTP as the default second factor** (simplest for non-technical users, and reuses the nodemailer transport already wired). Optional TOTP (authenticator app) as an upgrade for PLATFORM_MANAGER/SUPER_ADMIN later.

**Login flow (web):**
1. Employee ID + password → `POST /auth/login`.
2. If the account is 2FA-enabled (all web roles by default), the API returns `{ mfaRequired: true, challengeId }` **instead of** a session, and emails a 6-digit code (5-min TTL, Redis `mfa:{challengeId}`).
3. Web shows a clean 6-box OTP screen → `POST /auth/login/verify { challengeId, code }` → on success, sets the session cookies (F1).
4. "Trust this device 30 days" checkbox → sets a long-lived signed `trusted_device` cookie so 2FA isn't re-prompted every login.

**Edge cases:** resend (rate-limited, 3/15min), code expiry, 5-attempt lockout per challenge, and a fallback to the reset flow if the user loses email access.
**API work:** extend `authService.login` to branch on an `mfaEnabled` user flag; add `verifyLoginOtp`, `resendLoginOtp`; new `User.mfaEnabled` column + `mfa:*` Redis keys. Mobile login unaffected unless a role opts in.

---

## 3. Module-by-module (web = the management surface)

Each module reuses existing API endpoints (see `MODULE_AUDIT.md §2`). Pages listed are Next App-Router routes under `(admin)`.

### 3.1 Dashboard 🟢 endpoints ready
- **Role-scoped landing:** PLATFORM_MANAGER → platform/org rollup; SUPER_ADMIN → org health, dept comparison, escalations, staff-load; ADMIN → own-dept summary (`/dashboard/admin-summary`), team workload, review queue.
- Web-rich: charts (trend, dept comparison, workload bars) using the existing `components/dashboard/*` — wire to `/dashboard/trend`, `/dept-stats`, `/workload`, `/dept-health`, `/staff-load`, `/escalations`.
- Cards deep-link into filtered Tasks/Users/Reports.

### 3.2 Tasks 🟢 (15 endpoints) — the web's table strength
- **List:** dense `DataTable` with columns (title, assignee, dept, status, priority, due, updated), sticky header, server-side sort/paginate, saved column prefs.
- **Filters:** status, priority, department (SA), assignee, cross-dept, overdue, date range, search — a persistent `FilterBar` (reused by Reports).
- **Single CRUD:** create (`/tasks/create` wizard), view (`/tasks/[id]` with activity, comments, attachments/proof download), edit (`/tasks/[id]/edit`), reassign (Move vs Duplicate — mirror mobile's `ReassignChoiceSheet`), status transitions with the 409-conflict handling (optimistic-lock → toast + refetch), delete (SA).
- **Bulk CRUD:** row checkboxes → bulk **assign**, bulk **status** (`/tasks/bulk/status`), bulk **cancel**, bulk **reassign**, export selection to report. Select-all-matching-filter.
- **Batch (FR-23):** duplicate-to-team → batch progress view (`/tasks/batch/[batchId]`), nudge.
- **Governance (SA):** governance task create/list/review (approve, request-revision) — a Tasks sub-tab or its own nav item for SA.

### 3.3 Users / People 🟢 (14 endpoints)
- **List:** `DataTable` (name, employee ID, role, dept, status, last active) + filters (role, status active/suspended, department, search) — reuse the **fixed** three-state status semantics.
- **Single CRUD:** create user (with the **invite link/email** flow — success shows copyable link + "resend invite"), view (`/users/[id]`: profile, task stats, workload, activity), edit, change role, deactivate/reactivate, trigger password reset.
- **Bulk CRUD:** bulk deactivate/reactivate, bulk role change, bulk department move, bulk invite/resend, export to report.
- **Department members** sub-view with composition counts.

### 3.4 Departments 🟢 (10 endpoints)
- **List** (cards or table): name, code, head, member count, health chip.
- **Single CRUD:** create, view (`/departments/[id]`: members, settings, health), edit, reassign head, **archive/reactivate** (soft-delete only — no hard delete), settings (approval rules, working schedule, categories).
- **Bulk:** bulk archive/reactivate.

### 3.5 Reports 🟢 (3 endpoints, needs DTO extension) — **web-first flagship, see §4**

### 3.6 Audit Log 🟢 (3 endpoints)
- Filterable table (category→entityType, actor, date range, search — mirror mobile's split), row → detail (`/audit/[id]`) with **integrity verification** (`/:id/verify`), actor timeline. SA/PM only.

### 3.7 Notifications 🟢 (4 endpoints)
- Notification center: all/unread filter, mark read, mark-all-read, deep-link to the entity. Live via refetch-on-focus (multi-tab) or optional socket.

### 3.8 Settings / Org Config 🟢 (2 endpoints, SA)
- Org configuration (working schedule, cross-dept assignment, categories, approval defaults) — the same fields now wired on mobile. Profile, change password, 2FA management (enable/disable, reset device trust).

### 3.9 Calendar (optional, SA/Admin)
- Deadline-density calendar (`/dashboard/calendar-deadlines`) if desired on web; lower priority than the above.

---

## 4. Reports module — detailed design (the core ask)

A **guided, 3-step builder** — not a query tool — so a non-technical manager can produce any cut in under a minute.

### 4.1 What can be reported (report type × scope)
| Report type (API `ReportType`) | Answers |
|---|---|
| `TASK_SUMMARY` | volume, status breakdown, completion & on-time rate |
| `USER_PERFORMANCE` | per-person assigned/completed/overdue, avg cycle time |
| `DEPARTMENT_COMPARISON` | dept-vs-dept completion/overdue/on-time |
| `OVERDUE_ANALYSIS` | overdue clusters, aging buckets, by dept/person |
| `CROSS_DEPT_ASSIGNMENT` | tasks assigned across departments, by admin |

**Scope (the "…-wise" requirement):** a single **Scope** selector drives all of them:
- **Organization-wide** (PLATFORM_MANAGER / SUPER_ADMIN)
- **Department-wise** — one or many departments
- **Admin-wise** — a specific admin (their assigned-out + managed tasks)
- **Employee-wise** — a specific employee (their tasks)
An ADMIN is auto-scoped to their own department (can't pick others); SA/PM can pick any.

### 4.2 Filters (one shared `FilterBar`, reused from Tasks)
- **Date range** (required): presets — Today, This week, This month, Last 30 days, This quarter, This year, **Custom (from–to)** with a date-range picker.
- Status, priority, department(s), assignee/admin, role, on-time vs overdue, governance-only.

### 4.3 Formats & delivery
- **Formats:** CSV (always), **Excel (.xlsx)**, **PDF** (formatted, printable summary).
- **Flow:** Step 1 pick report → Step 2 scope + date range + filters (with a live "≈ N rows" preview) → Step 3 format → **Generate**. Generation is async (BullMQ `reportQueue`): the request appears in a **"Recent reports"** table (`GET /reports`) with a live status chip (Queued → Processing → Ready), then a **Download** button (`GET /reports/:id/download`, signed URL). Failed reports show a retry.
- **Convenience:** "Export current view" button on the Tasks/Users tables that pre-fills the builder from the active filters. Optional later: scheduled/recurring reports emailed to the requester (email infra already exists).

### 4.4 API work required (extend, don't rebuild)
- Extend `RequestReportDto` from `{ type, dateRange }` to add `scope` (`org | department | admin | employee`), `targetId?` (dept/user), `filters?`, and `format` (`csv | xlsx | pdf`).
- Reports worker generates the file per scope+filters, uploads to storage (same S3 as attachments), stores `downloadUrl`.
- Permission gating: `REPORT_VIEW` / `REPORT_DOWNLOAD`; ADMIN scope forced to own department server-side.

---

## 5. Navigation & information architecture (simplicity)

- **Left sidebar** (existing `Sidebar` + `NAV_ITEMS`): Dashboard · Tasks · Users · Departments · Reports · Notifications · Audit · Settings — each permission-gated, so a user only sees what they can do. Collapsible to icons; drawer on small screens.
- **Top bar:** global search, notifications bell (unread count), profile menu (profile, 2FA, sign out), current-role badge.
- **Breadcrumbs** on every detail page (`BreadcrumbNav`) so users always know where they are and can step back.
- **Consistent page skeleton:** Title + one primary action (top-right) + filter bar + content + empty/loading/error states. Same everywhere → predictable.
- **Depth ≤ 3 clicks** to any task. No hidden gestures (web has no swipe) — everything is a visible button.

---

## 6. Cross-cutting components to add (extend the design system)

| Component | Used by | Notes |
|---|---|---|
| `DataTable` | Tasks, Users, Departments, Audit, Reports list | server sort/paginate, row selection, sticky header, column config, → responsive card list < 768px |
| `BulkActionBar` | all tables | appears on selection; contextual bulk actions |
| `FilterBar` + `DateRangePicker` | Tasks, Users, Audit, Reports | one shared, URL-synced (shareable/bookmarkable filtered views) |
| `WizardModal` / stepper | Task create, Report builder, User create | guided multi-step for non-technical users |
| `OtpInput` | 2FA login | 6-box code entry |
| `StatusChip` / `RoleBadge` | everywhere | theme-consistent, matches mobile semantics |
| `ConfirmDialog` (exists) | all destructive/bulk ops | plain-language "are you sure" with impact count |

All responsive, keyboard-accessible, and consistent with the current visual language.

---

## 7. Delivery phases (each phase shippable)

1. **Phase 0 — Foundation:** F1 auth cookies, F2 shared client, F4 platform-lock, F5 setup/reset pages. *(Unblocks login + email links end-to-end.)*
2. **Phase 1 — 2FA:** email-OTP login + device trust + Settings 2FA management.
3. **Phase 2 — Core data, real:** Dashboard + Tasks (list/filters/single CRUD) + Users (single CRUD + invite) on real API; retire those mocks (F3).
4. **Phase 3 — Bulk + Departments:** bulk CRUD across Tasks/Users, Departments module, `DataTable`/`BulkActionBar`/`FilterBar`.
5. **Phase 4 — Reports:** DTO extension + worker + the 3-step builder + Recent reports + downloads (CSV/xlsx/PDF).
6. **Phase 5 — Oversight & polish:** Audit, Notifications, Settings/Org Config, Governance (SA), responsiveness pass, empty/error states, accessibility.

**Definition of done per module:** real API wired · single + bulk CRUD · filters + date range · responsive · permission-gated · empty/loading/error states · plain-language copy.

---

## 8. Non-goals / guardrails
- No EMPLOYEE surface on web (mobile-only). No task *execution* flows (accept/submit proof) — those are the assignee's mobile job; web is management/oversight.
- Soft-delete only (users/tasks/departments) — never hard-delete.
- Don't fork endpoint logic — reuse `@godigitify/api-client`; any new capability (report scope, 2FA) is added to the shared API first.
- Keep the current look; this plan adds capability, not a redesign.
