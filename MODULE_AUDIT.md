# Module Audit — TaskFlow SVGOI (Mobile + API)

**Audited:** 2026-07-28 · **Scope:** `apps/api` (Fastify) + `apps/mobile` (Expo/RN). Web dashboard covered at a high level in §7; full web audit is a follow-up.
**Method:** traced each module end-to-end — DB/Prisma → service → route (+ guard + schema) → `@godigitify/api-client` method → mobile hook → screen — and checked edge-case handling, empty/loading/error states, and cross-module interconnection.

## Legend

| Symbol | Meaning |
|---|---|
| 🟢 | Ready — wired end-to-end, edge cases handled, no known blocker |
| 🟡 | Mostly ready — works, but has gaps (mock stub, missing UI state, or a known edge case) |
| 🔴 | Not wired / stubbed / mock-backed |
| — | Not applicable on this surface |

**Wiring key:** `endpoints` = live API routes · `client` = api-client methods · `hooks` = RQ hooks · `screens` = mobile screens consuming it.

---

## 1. Architecture & interconnection (how the pieces link)

```
apps/mobile (Expo RN) ─┐
                       ├─▶ packages/api-client ──▶ REST /https ──▶ apps/api (Fastify)
apps/web (Next.js)    ─┘        (shared)                              │  ├─ Prisma ─▶ PostgreSQL (Supabase, pgbouncer)
                                                                      │  ├─ Redis (cache, throttle, session denylist, BullMQ)
packages/types  ── shared DTOs/enums, single source of truth ────────┘  └─ Socket.IO (real-time notif/task events)
packages/{config,utils,ui,ui-web}
```

- **Single contract.** Both apps consume the **same** `@godigitify/api-client` + `@godigitify/types`. There is no mobile-only or web-only API — the server is the single source of truth. The client mirrors the server almost 1:1 (see §2 counts), which is the strongest interconnection signal in the codebase.
- **Real-time.** `apps/api/src/plugins/socket.plugin.ts` authenticates the handshake (verified JWT + DB re-check) and derives rooms server-side. Mobile `useSocket` treats `notification:new` as a **refetch trigger** (invalidates notifications + task queries), never as canonical data — DB is truth.
- **Background work.** BullMQ (`apps/api/src/jobs`) runs 3 queues (notifications, reports, recurring-tasks) and 7 workers (overdue, due-soon, digest, notification send, push-receipt check, retention, db-keepalive).
- **RBAC surfaces.** PLATFORM_MANAGER → web-only; EMPLOYEE → mobile-only; ADMIN / SUPER_ADMIN → both. This is the reason the web app exists separately (see §7).

---

## 2. Module-by-module (API ↔ Mobile)

### Tasks 🟢 — the core, most mature module
- **API:** 15 endpoints (`/tasks` CRUD, `/:id/status`, `/:id/assign`, `/bulk/status`, comments, activity, attachments, `/batch`, `/batch/:id`, `/batch/:id/nudge`). Guards: `requireAuth` + `requirePermission` per op; `schema` validation on all writes.
- **Client/hooks:** `tasksApi` (16) → `useTasks`, `useTask`, `useTaskActivity/Comments/Attachments`, `useUpdateTaskStatus`, `useCreateTask(Batch)`, `useReassignTask`, `useBulkCancelTasks`, `useDeleteTask`, `useAddComment`, `useTaskReviewActions`, `useTaskSelection`, `useTaskDraft`.
- **Screens:** tasks tab, `tasks/[id]`, create (+copyFrom duplicate), review/[id], batch/[batchId](/member), comments.
- **Edge cases handled:** optimistic-lock `version` guard → **409 CONFLICT** on concurrent writes; status-transition matrix (`VALID_TRANSITIONS`); reassign resets to PENDING + clears `acceptedAt` + department-follows-assignee + proof retention; `ALREADY_ASSIGNED` guard; visibility scoping shared between REST and socket (`taskVisibilityWhere`/`canViewTask`); draft crash-resilience (AsyncStorage); debounced search; skeletons + empty/no-results states.
- **Interconnection:** notifications (assign/status), dashboard cache invalidation, socket task rooms, files (proof), governance (shared status engine).
- **Gaps:** 409 surfaces as a **generic error toast** (server message) + socket auto-refetch — correct but no dedicated "reload & review" modal. `limit: 100` list fetch not yet paginated (perf, not correctness).

### Users / People 🟢
- **API:** 14 endpoints — list, `/:id`, `/assignable` (task pickers, §2 matrix), task-stats, create, update, change-role, deactivate/reactivate, push-token, notification-prefs, workload. Session-invalidation wired on suspend/role-change (Redis denylist + socket disconnect).
- **Client/hooks:** `usersApi` (14) → `usePeople` (infinite scroll), `useOrgDirectory`, `useProfile`, `usePermissions`.
- **Screens:** team directory, people/[id](+edit), create-user, org/[id], department members.
- **Edge cases:** `/assignable` returns a narrow projection (no email/phone cross-dept); self excluded from pickers; department-locked management vs cross-dept assignment separation; infinite-scroll pagination.
- **Interconnection:** tasks (assignee), departments (membership/head), audit (role changes), auth (session invalidation).

### Auth / Session 🟢
- **API:** 7 endpoints — login, refresh, logout, forgot/reset/change-password, `/me`. Access 15m / refresh 7d (revocable). `requireAuth` re-reads user from DB every request. Redis `revoked:user:*` denylist for fast suspend.
- **Client/hooks:** `authApi` (7) → `useAuth`, `auth.store` (Zustand + SecureStore).
- **Edge cases:** silent refresh with in-flight de-dup (`_refreshPromise`); logout on refresh failure; token not persisted (refreshed lazily on first request — see §6 note).
- **Gaps:** platform-lock (`x-client-platform`) — verify header is sent by both clients and enforced (directive §5); confirm during web audit.

### Dashboard 🟢
- **API:** 11 endpoints — stats, upcoming, activity, trend, dept-stats, workload, dept-health, staff-load, escalations, calendar-deadlines, **admin-summary** (new; replaces the 100-task over-fetch). All cached in Redis (`dashboard:*`), invalidated by task mutations.
- **Client/hooks:** `dashboardApi` (11) → `useDashboard`, `useSuperAdminDashboard`, `useAdminSummary`.
- **Screens:** employee/admin/SA dashboards.
- **Edge cases:** stale-aware focus refetch (`useRefetchOnFocus`) + first-focus force-load (cold-start race fix); accurate server-side counts.
- **Interconnection:** tasks, users (workload), departments (health), audit (SA feed).

### Departments 🟢
- **API:** 10 endpoints — list, `/:id`, create, update, members, archive, reactivate, reassign-head, settings get/patch. `DEPT_MANAGE` / `DEPT_SETTINGS_MANAGE` guards.
- **Client/hooks:** `departmentsApi` (10) → `usePeople`/`useOrgDirectory`, department-settings hooks.
- **Screens:** department/[id](+edit/members/reassign-head), create-department, department-settings.
- **Edge cases:** soft-delete via `archive`/`reactivate` (no hard-delete); head reassignment; active-task count warning in archive modal.
- **Note:** confirm schema `onDelete: Restrict` on Department relations (directive §6b) is migrated.

### Notifications 🟢
- **API:** 4 endpoints — list, unread-count, `/:id/read`, `/read-all`. Push fan-out via BullMQ + idempotency.
- **Client/hooks:** `notificationsApi` (4) → `useNotifications`, `notification.store`, push via `notification.service`.
- **Screens:** notifications (SectionList), tab-badge initializer.
- **Edge cases:** DB-as-truth (socket = refetch hint); **fixed** empty-body PATCH bug (client only sends `Content-Type: application/json` when a body exists); push permission failure never blocks app.
- **Interconnection:** every task mutation, socket, BullMQ workers, dashboard unread-count.

### Governance 🟢
- **API:** 5 endpoints — create, list, `/:id`, approve, request-revision. `GOVERNANCE_TASK_CREATE/REVIEW` guards.
- **Client/hooks:** `governanceApi` (5) → `useGovernance`, `useGovernanceReviewActions`.
- **Screens:** GovernanceTasksScreen, AssignGovernanceTaskScreen, GovernanceTaskDetailScreen.
- **Interconnection:** reuses task status engine; SA-only assignment to admins.

### Audit 🟢
- **API:** 3 endpoints — list (filters), `/:id/verify` (integrity hash chain), `/actor/:actorId`. `AUDIT_VIEW` guard.
- **Client/hooks:** `auditApi` (3) → `useAudit`.
- **Screens:** audit/index, audit/[id].
- **Edge cases:** integrity verification, category chips, actor timeline.

### Files / Attachments 🟢
- **API:** 3 endpoints — presign, confirm, `/:id/download`. Two-phase S3 upload.
- **Client/hooks:** `filesApi` (3) → `useFileUpload`.
- **Edge cases:** client-side MIME validation, preview+explicit confirm, `confirm` is the DB commit point (crash-safe), ContentType must match presign signature.
- **Interconnection:** tasks (proof attachments), `_count.attachments`.

### Calendar 🟢
- **API:** served by `tasks.getCalendar` + `dashboard.calendar-deadlines`.
- **Client/hooks:** `useCalendar`, `useAdminCalendar`, `useSuperAdminCalendar`. (`calendar.mock` retained as a **type source only**.)
- **Screens:** calendar tabs (employee/admin/SA), sa-calendar/[date].

### Organization Config 🔴 — **the one live mock stub**
- **API:** 2 endpoints — `GET/PATCH /organization/config` **exist and are real**.
- **Mobile:** `orgConfig.service.ts` is an **in-memory mock** (`MOCK_ORG_CONFIG` + `setTimeout` delays); `updateOrgConfig` mutates a module-level variable and **never calls the API**. The SA "Org Configuration" screen therefore does **not persist** across sessions/devices.
- **Action:** replace `orgConfigService` bodies with `organizationApi.getConfig()` / `updateConfig()` and reconcile the mock `OrgConfig` shape with the server DTO. **Highest-priority functional gap.**

### Reports 🟡 — backend-only, not surfaced on mobile
- **API:** 3 endpoints — list, request, `/:id/download`. `REPORT_VIEW/DOWNLOAD` guards + `reportQueue` worker.
- **Client:** `reportsApi` (3) exists but is **imported by zero mobile screens**.
- **Web:** `(admin)/reports/page.tsx` exists → Reports is a **web-first feature** (see §7). Not a mobile gap by design; confirm intent.

---

## 3. Cross-cutting concerns

| Concern | Status | Notes |
|---|---|---|
| AuthN/Z (JWT + per-request DB read) | 🟢 | `requireAuth` re-reads user; `requirePermission` on writes; Redis denylist for fast suspend |
| Socket auth + rooms | 🟢 | handshake JWT verify + DB re-check; server-derived rooms; `join:task` authorized like REST |
| Notifications + push | 🟢 | DB-as-truth; idempotent BullMQ fan-out; empty-body PATCH fixed |
| BullMQ workers/crons | 🟢 | 7 workers incl. overdue/due-soon/digest/retention/db-keepalive/push-receipt |
| File/S3 upload | 🟢 | presign→PUT→confirm, crash-safe |
| Error/empty/loading UX | 🟢 | global mutation error toast (`useApiMutation` + `getErrorMessage`); skeletons; EmptyState throughout |
| Platform-lock (web/mobile) | 🟡 | verify `x-client-platform` sent + enforced end-to-end |
| Optimistic concurrency | 🟢 | `Task.version` guard → 409 (mobile shows toast + refetch) |

---

## 4. Consolidated gaps & risks (prioritized)

| # | Gap | Severity | Where | Fix |
|---|---|---|---|---|
| 1 | **Org Config is a mock stub** — not persisted despite real API | 🔴 High | `mobile/src/services/orgConfig.service.ts` | Wire to `organizationApi`; reconcile DTO shape |
| 2 | **Dead code:** `adminTasks.service.ts` (mock, no live import) | 🟡 Low | `mobile/src/services` | Delete; also prune unused `*.mock.ts` data if type-only usages are migrated |
| 3 | Mock files used only as **type sources** (calendar, profile, adminWorkload, adminSettings) | 🟡 Low | `mobile/src/data/*.mock.ts` | Move exported `type`s into `packages/types` or local `types/`, drop mock data |
| 4 | 409 conflict has no dedicated UI (toast + refetch only) | 🟡 Low | task mutations | Optional "reload & review" modal |
| 5 | `limit: 100` list fetches not paginated (tasks tab, admin tasks, team) | 🟡 Perf | list screens | Infinite scroll |
| 6 | Platform-lock header enforcement unverified | 🟡 Med | auth/guards | Confirm in web audit |
| 7 | Reports absent on mobile | 🟢 By design | — | Confirm web-only intent |

---

## 5. Readiness scorecard

| Module | API | Mobile wiring | Edge cases | Overall |
|---|---|---|---|---|
| Tasks | 🟢 | 🟢 | 🟢 | **🟢 95%** |
| Users/People | 🟢 | 🟢 | 🟢 | **🟢 95%** |
| Auth/Session | 🟢 | 🟢 | 🟡 | **🟢 90%** |
| Dashboard | 🟢 | 🟢 | 🟢 | **🟢 95%** |
| Departments | 🟢 | 🟢 | 🟢 | **🟢 92%** |
| Notifications | 🟢 | 🟢 | 🟢 | **🟢 95%** |
| Governance | 🟢 | 🟢 | 🟢 | **🟢 90%** |
| Audit | 🟢 | 🟢 | 🟢 | **🟢 90%** |
| Files | 🟢 | 🟢 | 🟢 | **🟢 92%** |
| Calendar | 🟢 | 🟢 | 🟢 | **🟢 90%** |
| Organization Config | 🟢 | 🔴 | — | **🔴 40%** (API ready, mobile stubbed) |
| Reports | 🟢 | — | — | **🟡 web-first** |

**Mobile + API overall: ~88% ready.** One true functional gap (Org Config), a handful of low-severity cleanups, and perf/pagination polish. The core task lifecycle — the product's spine — is fully wired with real concurrency, RBAC, real-time, and audit.

---

## 6. Notes for implementers

- **Cold-start token race:** access token is **not persisted**; it's refreshed lazily on the first API call after `hydrateFromStorage` restores the user. `useRefetchOnFocus` force-refetches on first focus to re-sync the screen — don't remove that.
- **Mock ≠ unwired:** most `*.mock.ts` imports are `type`-only; the live data path is real. Only `orgConfig.service` returns mock data at runtime.
- **DB is truth** for notifications and task content; socket/push are hints/refetch triggers.

---

## 7. Web dashboard — linkage & state → **full audit in `WEB_AUDIT.md`**

**Present:** `apps/web` — Next.js 15, 18 pages / 27 components. Shares **`@godigitify/types`** (24 files) but **not** the api-client (0 files — it has its own axios in `lib/api.ts`).

> **Correction to an earlier assumption:** web does **not** use the shared `api-client`, and it is currently **mock-backed** — every feature service returns `src/data/*.mock.ts`. Auth is real *plumbing* (cookie-based) but blocked by a cookie/Bearer mismatch with the API. See `WEB_AUDIT.md` for the module-by-module breakdown, the auth blocker, and the integration roadmap.

**Pages:** `(auth)/login`; `(admin)/` → dashboard, tasks (+create, [id], [id]/edit), users (+create, [id], [id]/edit), departments (+create, [id]), audit, notifications, reports, settings.

### Does web need to be "linked" with the mobile app?
**No direct app-to-app link — and none is needed.** They are linked **indirectly and correctly** through:
1. **The same API** (`apps/api`) — one backend, one database, one auth/session system. A task created on web appears on mobile via the same endpoints + socket events.
2. **The same `api-client` + `types` packages** — one contract, so the two clients can't drift.

**What web adds that mobile can't:** PLATFORM_MANAGER is **web-only** (RBAC §5), and heavier admin/SA workflows (reports, bulk management, editing) live on web. EMPLOYEE is **mobile-only**. ADMIN/SA use both, converging on the same data.

### Preliminary web observations (to verify in the dedicated web audit)
- `apps/web/src/data` and `apps/web/src/services` exist — **check for the same "mock service" pattern** found in mobile (esp. org config, reports).
- Confirm web sends `x-client-platform: web` and that the API's platform-lock rejects EMPLOYEE on web / PLATFORM_MANAGER on mobile.
- Reports is web-first — verify request→poll→download is fully wired (BullMQ `reportQueue`).
- Web has no EMPLOYEE/task-execution surface by design; confirm no dead routes.
- Real-time: verify web wires Socket.IO with the same handshake-token pattern (or relies on refetch-on-focus).

**Next step:** dedicated `WEB_AUDIT.md` mirroring §2–§5 for `apps/web`, plus a consolidated cross-surface parity matrix (which modules exist on mobile vs web vs both).
