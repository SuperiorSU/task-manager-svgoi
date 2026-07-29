# Web Dashboard Audit — TaskFlow SVGOI (`apps/web`)

**Audited:** 2026-07-28 · **Scope:** `apps/web` (Next.js 15 App Router). Companion to `MODULE_AUDIT.md` (mobile + API).
**Method:** traced each page → hook → service → data source, and checked the auth/session model, the HTTP client, and how (and whether) the web talks to the real API in `apps/api`.

## Legend

| Symbol | Meaning |
|---|---|
| 🟢 | Wired to real API, working |
| 🟡 | UI built, partially wired / needs integration |
| 🔴 | Mock-backed — UI only, not talking to the API |

---

## 0. Headline

> **The web app is a design-complete UI prototype running on mock data.** Every feature module's data layer reads from `src/data/*.mock.ts` with artificial `setTimeout` delays. **Zero** files use the shared `@godigitify/api-client`; the web has its own `axios` client (`lib/api.ts`) that is currently used in only **two** places (login, and one direct call on the Departments page). Auth is designed for **cookie-based** sessions, but **the API does not set cookies** — so even login doesn't complete end-to-end yet.

This is the opposite maturity profile from mobile (≈88% real-wired). Web is ≈**UI 90% / integration 10%**.

---

## 1. Architecture & how web links to the rest

```
apps/web (Next.js) ──uses──▶ @godigitify/types      (shared — 24 files) ✅
                  ──does NOT use──▶ @godigitify/api-client (0 files)     ❌ divergence
                  ──own axios──▶ src/lib/api.ts (cookie/withCredentials) ──▶ apps/api  (only login + 1 call today)
                  ──data──▶ src/services/*.service.ts ──▶ src/data/*.mock.ts  (mock, everything else)
```

**Does web need to be "linked" to the mobile app?** — **No direct app-to-app link, and none is needed.** Web and mobile are meant to converge on the **same backend** (`apps/api`) and share **`@godigitify/types`**. The correct and only linkage is:
1. **One API** — a task created on web must appear on mobile through the same endpoints + socket events.
2. **Shared types** — already in place (24 files).

**What is NOT shared (and arguably should be):** the **HTTP client**. Mobile uses `@godigitify/api-client`; web re-implements calls with its own axios instance. This means the contract is enforced only at the *type* level, not the *call* level — web can drift from the real endpoint shapes. **Recommendation:** wire web through `@godigitify/api-client` (adapting its token getter to read the web cookie) so both clients share one call layer.

**Role/platform split (why web exists):** PLATFORM_MANAGER → web-only; ADMIN/SUPER_ADMIN → both; EMPLOYEE → mobile-only. Web hosts the heavier management/reporting surfaces.

---

## 2. Auth & session — 🔴 broken end-to-end (contract mismatch)

| Piece | Web expects | API provides | Status |
|---|---|---|---|
| Login | `POST /auth/login` sets an httpOnly `access_token` **cookie** (`withCredentials`) | Returns tokens in the **JSON body** (Bearer model); **no `Set-Cookie`**, no `@fastify/cookie` | 🔴 mismatch |
| Route protection | `middleware.ts` reads `access_token` **cookie** | — | 🔴 cookie never set |
| Server session | `lib/session.ts` decodes the `access_token` **cookie** (SSR) | — | 🔴 |
| Refresh | axios interceptor `POST /auth/refresh` with `withCredentials` | refresh works, but returns body tokens, not cookies | 🔴 |

**This is the #1 blocker.** To fix, pick one:
- **(a) API sets cookies (recommended for web):** register `@fastify/cookie`, and on login/refresh set httpOnly `access_token` (15m) + `refresh_token` (7d) cookies **in addition to** the body (mobile keeps using the body). Web then works as designed with SSR + middleware.
- **(b) Web goes Bearer** like mobile (store token client-side, `Authorization` header) — loses httpOnly/SSR benefits; not recommended given the middleware/session design already committed to cookies.

Also apply the **platform-lock** (`x-client-platform: web`) once auth is real, and reject EMPLOYEE on web (directive §5).

---

## 3. Module-by-module (web)

All feature services import `src/data/*.mock.ts` and `await delay()`; hooks call those services. Endpoints exist on the API (see `MODULE_AUDIT.md`) — they are simply **not called** from web yet.

| Module | Pages | Data source | API exists? | Status |
|---|---|---|---|---|
| **Auth** | `(auth)/login` | real axios `/auth/login` (cookie) | 🟢 | 🔴 blocked by cookie mismatch (§2) |
| **Dashboard** | `(admin)/dashboard` | `dashboard.service` → `dashboard.mock` (stats/trend/dept/workload/activity) | 🟢 (11 endpoints) | 🔴 mock |
| **Tasks** | `tasks`, `tasks/create`, `tasks/[id]`, `tasks/[id]/edit` | `tasks.service` → `MOCK_TASKS` (list/get/activity/comments/create/status/bulk/delete) | 🟢 (15) | 🔴 mock |
| **Users** | `users`, `users/create`, `users/[id]`, `users/[id]/edit` | `users.service` → `users.mock` | 🟢 (14) | 🔴 mock |
| **Departments** | `departments`, `departments/create`, `departments/[id]` | list page calls real `api.get('/departments')` ✅; `departments.service` is still mock | 🟢 (10) | 🟡 one real call, rest mock |
| **Audit** | `(admin)/audit` | `audit.service` → `audit.mock` | 🟢 (3) | 🔴 mock |
| **Reports** | `(admin)/reports` | `reports.service` → `reports.mock` | 🟢 (3) | 🔴 mock — **web is the intended home for Reports** (absent on mobile) |
| **Notifications** | `(admin)/notifications` | `notifications.service` → `notifications.mock` | 🟢 (4) | 🔴 mock |
| **Settings** | `(admin)/settings` | mock/local | 🟢 org-config (2) | 🔴 mock |

**Inventory:** 18 pages, 27 components, 7 services (all mock), 11 hooks, 7 mock data files.

**Real-time:** no Socket.IO wiring found on web. Once integrated, web can rely on refetch-on-focus (multi-tab), or wire the same handshake-token pattern as mobile. Low priority vs §2.

---

## 4. Consolidated gaps & integration roadmap (prioritized)

| # | Gap | Severity | Fix |
|---|---|---|---|
| 1 | **Auth cookie/Bearer mismatch** — web can't actually log in against the API | 🔴 Blocker | API sets httpOnly cookies on login/refresh (`@fastify/cookie`) — §2(a) |
| 2 | **Entire data layer is mock** (tasks/dashboard/users/audit/reports/notifications) | 🔴 High | Replace each `*.service.ts` body with real calls; ideally via `@godigitify/api-client` |
| 3 | **Web bypasses shared `api-client`** (own axios) — contract enforced only at type level | 🟡 Med | Adopt `@godigitify/api-client` with a cookie-aware token getter; delete the parallel client |
| 4 | **Platform-lock not enforced** on web (EMPLOYEE could load admin UI) | 🟡 Med | `x-client-platform: web` + API guard, after §1 |
| 5 | **No real-time** on web | 🟢 Low | Optional Socket.IO or refetch-on-focus |
| 6 | Mock data files remain after wiring | 🟢 Low | Delete `src/data/*.mock.ts` (keep any `type` exports → move to shared types) |

**Suggested order:** #1 (unblock auth) → #2 module-by-module starting with Dashboard + Tasks (highest value, endpoints ready incl. new `/dashboard/admin-summary`) → #3 (consolidate onto shared client during #2) → #4 → #5/#6.

---

## 5. Cross-surface parity matrix (mobile vs web vs API)

| Module | API | Mobile | Web |
|---|---|---|---|
| Auth | 🟢 | 🟢 Bearer | 🔴 cookie (blocked) |
| Tasks | 🟢 | 🟢 | 🔴 mock |
| Users/People | 🟢 | 🟢 | 🔴 mock |
| Departments | 🟢 | 🟢 | 🟡 partial |
| Dashboard | 🟢 | 🟢 | 🔴 mock |
| Notifications | 🟢 | 🟢 | 🔴 mock |
| Governance | 🟢 | 🟢 | — (not built on web) |
| Audit | 🟢 | 🟢 | 🔴 mock |
| Files | 🟢 | 🟢 | — (no upload UI found) |
| Calendar | 🟢 | 🟢 | — (not built on web) |
| Reports | 🟢 | — (web-first) | 🔴 mock (intended home) |
| Org Config | 🟢 | 🟢 (now wired) | 🔴 mock (settings) |

---

## 6. Bottom line

- **Mobile + API:** production-shaped, ≈88% ready (see `MODULE_AUDIT.md`). Org Config now wired.
- **Web:** **excellent UI, not yet integrated.** It is a faithful front-end against mock data with real auth *plumbing* that's blocked by a cookie/Bearer contract mismatch. It does **not** need to link to the mobile app — it needs to be **connected to the same API**, starting with the auth-cookie fix, then swapping each mock service for a real call (preferably through the shared `api-client`).
- **Governance, Calendar, Files** are mobile-only today; decide whether web needs them (likely Governance + Calendar for SA, not Files).
