# 09 — Architecture Review & Remediation Directive

**System:** TaskFlow SVGOI · **Scale:** ~300–500 employees, single org (multi-tenant-ready)
**Stack:** TurboRepo · Expo SDK 54 · Next.js 15 · Fastify v5 · Prisma + PostgreSQL · Redis · Socket.IO · BullMQ
**Author:** Staff-level architecture review · **Consumer:** Opus 4.8 (implementation agent)

---

## 0. How to use this document

This is an **implementation directive**, not a discussion. Every finding below has:
- a **concrete failure scenario** (what actually breaks in prod),
- the **root cause with file:line references** to the real code,
- a **code-level fix** (Prisma snippet / Fastify middleware / service pattern) that can be applied directly,
- **DO / DON'T** guardrails so the fix isn't undone later.

Implement in the **Priority order (§1)**. Do not batch unrelated migrations. Each numbered risk maps to one PR.

**Ground truth already verified in the codebase (do not re-litigate these):**
- `requireAuth` **already** re-reads the user from DB on every HTTP request (`apps/api/src/shared/guards/requireAuth.guard.ts:28`), so role/permission changes reflect on the *next HTTP call*. The gap is **long-lived connections and the access-token window**, not HTTP RBAC.
- Access token TTL is `15m`, refresh `7d` (`apps/api/src/config/env.ts:15`). Refresh tokens are revocable (`RefreshToken.revokedAt`), **access tokens are not**.
- Tasks are soft-deleted (`isDeleted`), users deactivated (`isActive`). Hard-delete is not wired for tasks/users, but **departments have no such guard**.

---

## 1. Top 5 risks — ranked by likelihood of a production incident

| # | Risk | Likelihood | Blast radius | Effort |
|---|------|-----------|--------------|--------|
| **1** | **Socket.IO has no authentication** — any client subscribes to any user's private channel | **Certain** (exploitable today) | Cross-user data leak (notifications, task events) | S |
| **2** | **Dead `sid` claim** — a revoked/suspended user keeps a valid access token for up to 15m | **High** | Suspended user acts for 15m; no forced logout | M |
| **3** | **Last-write-wins on assignment/status** — no row lock or version column | **High** under concurrent Admin load | Lost updates, double-notify, ghost assignees | M |
| **4** | **No platform-locking** — PM can log in on mobile, Employee on web | **Medium** | RBAC-model violation, PM creds on a device | S |
| **5** | **Push fan-out not idempotent on retry** + department hard-delete orphans | **Medium** | Duplicate push; orphaned tasks | M |

`S`=hours, `M`=1–2 days.

---

## 2. RISK #1 — Socket.IO is unauthenticated (CRITICAL, fix first)

### Failure scenario
`apps/api/src/plugins/socket.plugin.ts:29-39`: the server accepts **any** WebSocket connection and honors `join:user` / `join:task` with a **client-supplied** id and **no verification**:

```ts
socket.on('join:user', (userId: string) => { void socket.join(`user:${userId}`); });
```

An attacker (or a curious employee with the app's socket URL) connects and emits `join:user` with the Super Admin's id. From that moment they receive **every** `notification:new` and `notification:count` event emitted to `user:{saId}` — task titles, assignee names, clarification text. Same for `join:task` on any task id. This is a live IDOR over the real-time channel. `notifyUsers` (`apps/api/src/modules/notifications/notifications.service.ts`) emits straight into these rooms trusting membership is legitimate.

### Root cause
No `io.use()` auth middleware; rooms are joined from unauthenticated, unvalidated client input.

### Fix — authenticate the handshake, derive rooms server-side
```ts
// apps/api/src/plugins/socket.plugin.ts
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/database.js';

export const registerSocket = fp(async (app: FastifyInstance) => {
  const io = new Server(app.server, { /* cors, transports as-is */ });

  // 1) Verify the JWT on the handshake. Reject unauthenticated sockets.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('unauthorized'));
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; role: string; sid: string };
      // Re-validate against DB — token may be from a since-suspended user (see Risk #2).
      const user = await prisma.user.findUnique({
        where: { id: payload.sub, isActive: true },
        select: { id: true, role: true, departmentId: true },
      });
      if (!user) return next(new Error('unauthorized'));
      socket.data.user = user;
      socket.data.sid = payload.sid;
      return next();
    } catch {
      return next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as { id: string; role: string; departmentId: string | null };
    // 2) The personal room is derived from the VERIFIED id, never from client input.
    void socket.join(`user:${user.id}`);

    // 3) join:task must be authorized against the same visibility rule as GET /tasks/:id.
    socket.on('join:task', async (taskId: string) => {
      const canView = await userCanViewTask(taskId, user); // reuse tasksService.getById scoping
      if (canView) void socket.join(`task:${taskId}`);
    });
    socket.on('leave:task', (taskId: string) => void socket.leave(`task:${taskId}`));
    // 4) DELETE the client-driven join:user handler entirely.
  });

  app.decorate('io', io); socketRegistry.io = io;
  app.addHook('onClose', async () => { socketRegistry.io = null; await io.close(); });
});
```

**Client changes:** pass the access token in the handshake, not a `join:user` emit.
- Mobile (`apps/mobile/src/hooks/useSocket.ts`) and web: `io(url, { auth: { token: accessToken } })`. On token refresh, call `socket.auth = { token }; socket.disconnect().connect();`.
- Remove every client `socket.emit('join:user', ...)`.

### DO / DON'T
- **DO** derive `user:{id}` and dept rooms from the **verified** JWT only.
- **DO** authorize `join:task` with the *same* scoping function as the REST read path (extract `tasksService.getById`'s visibility `where` into a reusable `taskVisibilityWhere(user)` and use it in both places — single source of truth).
- **DON'T** trust any id sent by the client over the socket, ever.
- **DON'T** emit sensitive bodies into rooms you haven't authorized; keep push/socket payloads to `{type, taskId}` + generic copy (already the pattern in `templates.ts` — preserve it).

---

## 3. RISK #2 — The `sid` claim is dead; suspended users keep a live token for 15m

### Failure scenario
Login signs `{ sub, role, sid }` (`apps/api/src/modules/auth/auth.service.ts:97`) but **there is no Session table and `requireAuth` never checks `sid`**. When SA suspends a user (`isActive=false`) or an Admin's cross-dept grant is revoked, the **next HTTP request** is correctly rejected (DB re-read at `requireAuth.guard.ts:28`) — **but**:
- the user's **already-open socket** keeps streaming events (fixed structurally by Risk #1's DB re-check on handshake, but existing sockets stay connected),
- any in-flight optimistic client action within the token window still *looks* authorized to the client.

The real hole: **you cannot force-invalidate a specific session.** Suspend revokes refresh tokens (`auth.service.ts:185`), but the 15-minute access token remains cryptographically valid. Overview §13 explicitly requires "suspend → logged out within seconds." Current behavior is "within 15 minutes on HTTP, indefinitely on socket."

### Fix — make `sid` real with a Redis session denylist + socket eviction
No new SQL table needed; use the Redis you already run.

```ts
// On suspend / password-change / role-change / grant-revoke:
// 1) revoke refresh tokens (already done), AND
// 2) add every active sid for that user to a denylist with the access-token TTL.
await redis.set(`revoked:sid:${sid}`, '1', 'EX', 15 * 60); // = JWT_ACCESS_EXPIRES_IN seconds
// simpler + broader: revoke the whole user until now+15m
await redis.set(`revoked:user:${userId}`, Date.now().toString(), 'EX', 15 * 60);
```

```ts
// apps/api/src/shared/guards/requireAuth.guard.ts — after jwtVerify, before/with the DB read:
const revokedAt = await redis.get(`revoked:user:${payload.sub}`);
if (revokedAt) return sendError(reply, 401, ErrorCodes.UNAUTHORIZED, 'Session revoked');
```

```ts
// Force-close live sockets immediately on suspend (server-initiated):
socketRegistry.io?.in(`user:${userId}`).disconnectSockets(true);
```

Wire these three lines into `users.service.ts` `deactivateUser` / role-change / grant-revoke paths.

### DO / DON'T
- **DO** treat suspend/role-change/grant-revoke as a single "session-invalidation event": revoke refresh tokens **+** set the Redis denylist **+** disconnect live sockets, in that order.
- **DO** keep access-token TTL short (15m is fine); the denylist covers the residual window.
- **DON'T** lengthen the access token to reduce DB reads — the per-request DB read is already there and is the correct source of truth.
- **DON'T** rely on the client to "log itself out" on suspend; enforce server-side.

---

## 4. RISK #3 — Assignment & status writes are last-write-wins (no locking)

### Failure scenario
`tasksService.assign` and `bulkUpdateStatus` (`apps/api/src/modules/tasks/tasks.service.ts`) do a `findFirst` (scope check) then a separate `update` — **two statements, no transaction, no row lock**. Concurrent case:

> Admin A (Physics) and Admin B (CS) both open task T (a cross-dept task). A reassigns T to Emp-X; B, a half-second later, reassigns to Emp-Y. Both pass the scope check against the *pre-write* row. Both `update`. **T ends on Emp-Y** (last commit wins), **A's decision is silently lost**, and `notifyUsers` fires **twice** — Emp-X is told "assigned to you" then never told it was taken away; the previous-assignee notification is computed against a stale `task.assigneeId`.

Same class of bug on `updateStatus`: two actors moving `UNDER_REVIEW → COMPLETED` and `UNDER_REVIEW → IN_PROGRESS` concurrently both pass `VALID_TRANSITIONS` against the old status.

### Fix — optimistic concurrency with a `version` column + guarded update inside a transaction
```prisma
// apps/api/prisma/schema.prisma — model Task
model Task {
  // ...existing...
  version Int @default(0)   // optimistic-lock token
}
```

```ts
// Pattern for every state-mutating task op (assign / updateStatus / bulkUpdateStatus):
await prisma.$transaction(async (tx) => {
  const task = await tx.task.findFirst({ where: { id, isDeleted: false, /* + scope */ } });
  if (!task) throw notFound();
  // ...validate transition / assignee...
  const res = await tx.task.updateMany({
    where: { id, version: task.version },      // <-- fails if someone else wrote first
    data:  { assigneeId: newAssigneeId, version: { increment: 1 } },
  });
  if (res.count === 0) {
    throw Object.assign(new Error('This task was just modified by someone else. Reload and retry.'),
      { statusCode: 409, code: 'CONFLICT' });
  }
  // write activity + resolve notification recipients from the FRESH row inside the tx
});
```

Notifications (`notifyUsers`) and `TaskActivity` writes must be **inside the same transaction** (or fired only after `res.count === 1`) so a conflicting write never emits.

For the cross-dept "same employee, conflicting department" question: the conflicting resource is the **task**, not the employee — an employee can hold many tasks. The version guard on the task row resolves it deterministically: first commit wins, second gets a `409` and re-fetches.

### DO / DON'T
- **DO** wrap read-check-write in `prisma.$transaction` and guard the write with `where: { version }`.
- **DO** surface `409 CONFLICT` to the client and have the mobile app refetch + show "Task changed, review again" (never silently retry a mutation — see Risk #5).
- **DON'T** use `SELECT … FOR UPDATE` (pessimistic) here — under 500 users the contention is low and optimistic is cheaper and deadlock-free.
- **DON'T** compute notification recipients from a row read *before* the guarded update.

---

## 5. RISK #4 — No platform-locking (PM web-only / Employee mobile-only not enforced)

### Failure scenario
The RBAC model says PLATFORM_MANAGER is web-only and EMPLOYEE is mobile-only (overview §11), but **nothing enforces it**. There is no `platform` claim and no client-type check (`grep` for platform/clientType in auth = none). A PLATFORM_MANAGER can log in through the mobile app (putting infra-level creds on a device — the exact risk §11 calls out), and an Employee can drive the web admin.

### Fix — stamp platform at login, enforce once in middleware (no per-route duplication)
```ts
// Client sends its platform on every request (set once in the API client):
//   mobile: headers['x-client-platform'] = 'mobile'
//   web:    headers['x-client-platform'] = 'web'

// apps/api/src/shared/guards/platformLock.guard.ts  (register globally, after requireAuth)
const ROLE_PLATFORM: Record<string, 'web' | 'mobile' | 'both'> = {
  PLATFORM_MANAGER: 'web',
  SUPER_ADMIN: 'both',
  ADMIN: 'both',
  EMPLOYEE: 'mobile',
};

export const enforcePlatformLock = async (req: FastifyRequest, reply: FastifyReply) => {
  const allowed = ROLE_PLATFORM[req.user.role] ?? 'both';
  if (allowed === 'both') return;
  const client = req.headers['x-client-platform'];
  if (client !== allowed) {
    return sendError(reply, 403, ErrorCodes.FORBIDDEN, 'This account cannot be used on this platform');
  }
};
```
Register it in `buildApp` as an `onRequest`/`preHandler` decorator that runs after `requireAuth` for all authenticated routes, **and** replicate the check in the Socket.IO `io.use` handshake (reject `EMPLOYEE` on web origin, `PLATFORM_MANAGER` on mobile). Also block it at the **login** service so the failure is immediate and friendly, not mid-session.

### DO / DON'T
- **DO** enforce in exactly two choke points: the global auth preHandler and the socket handshake. One table (`ROLE_PLATFORM`), zero per-route logic.
- **DO** treat a spoofed/missing header as "deny for locked roles" (fail closed).
- **DON'T** rely on the header alone for security-critical separation — it's a UX/policy lock, not a secret. The real protection is that PM/Employee simply have no useful routes on the wrong surface; this makes the intent explicit and auditable.

---

## 6. RISK #5 — Push fan-out isn't idempotent on retry; department hard-delete orphans

### 6a. Duplicate push on BullMQ retry
`notificationQueue` runs `attempts: 3` (`apps/api/src/jobs/queue.ts`). `notifyUsers` writes the in-app `Notification` row **synchronously in the request** and emits the socket event there, then enqueues a **separate** `send` job for push. If that job sends to some Expo tokens then throws (network blip on chunk 2 of 3), BullMQ retries the **whole** job → tokens in chunk 1 get the push **twice**. The in-app row and socket event are fine (created once, in-request); only push duplicates.

**Fix — idempotency key + per-chunk receipt tracking:**
```ts
// When enqueuing, attach a stable jobId so a duplicate enqueue is a no-op:
await notificationQueue.add('send', payload, { jobId: `notif:${notificationId}` });

// In the worker, record which tokens were already delivered for this notificationId
// in Redis (SADD) before sending each chunk; on retry, skip tokens already in the set.
const sentKey = `notif:sent:${notificationId}`;
const already = new Set(await redis.smembers(sentKey));
const pending = tokens.filter((t) => !already.has(t));
// ...send pending..., then: await redis.sadd(sentKey, ...justSent); redis.expire(sentKey, 3600);
```

**Reconciliation of the "socket fired optimistically, job failed" question:** in this codebase the socket event and DB row are written **together in the request**, so they never diverge from each other — the only async artifact is push. Therefore the mobile client must treat the **DB (`GET /notifications`) as truth** and the socket `notification:new` as a *hint to refetch the unread count*, not as the notification's canonical content. Concretely: on `notification:new`, the client invalidates the notifications query rather than optimistically inserting a row it constructs locally. That removes ghost/duplicate rows entirely.

### 6b. Department hard-delete orphans tasks/users
`Task.department` and `User.department` are optional relations with **no explicit `onDelete`** (`schema.prisma:220`, `:165`). Prisma's default for an optional relation on Postgres is `SetNull`. So a hard `department.delete()` silently sets `departmentId = null` on live tasks and users — an Admin loses their scope, dept-scoped queries drop those tasks, reports break, with no audit trail.

**Fix — forbid hard-delete; soft-delete departments like everything else:**
```prisma
model Department {
  // ...existing...
  isActive Boolean @default(true)   // already present — USE it, never .delete()
  // Make the intent explicit so a stray delete is a DB-level error, not silent SetNull:
}
model Task {
  department   Department? @relation(fields: [departmentId], references: [id], onDelete: Restrict)
}
model User {
  department   Department? @relation("DeptMembers", fields: [departmentId], references: [id], onDelete: Restrict)
}
```
With `onDelete: Restrict`, an accidental hard-delete throws instead of orphaning. Department "removal" must go through `isActive=false` + a migration/guard that reassigns or blocks while tasks reference it.

### DO / DON'T
- **DO** make `notification:new` a *refetch trigger*; treat the DB as canonical for notification content.
- **DO** give every push job a deterministic `jobId` and track delivered tokens in Redis.
- **DON'T** hard-delete departments (or any scoping entity). Soft-delete only, matching the §13 "never hard-delete" rule which currently omits departments.
- **DON'T** blindly retry assignment/status mutations (Risk #3) — only *idempotent* side effects (push, digest) are retry-safe.

---

## 7. Prisma schema review — indexing & the grant model

### 7a. Over-indexing on `Task` (write amplification on the hot table)
`Task` has 10 indexes (`schema.prisma:230-239`). At 500 users every task write maintains all 10. Trim:

| Index | Verdict |
|-------|---------|
| `@@index([assigneeId, status])` | **Keep** — the Employee "my tasks by status" path |
| `@@index([departmentId, status])` | **Keep** — the Admin dept board |
| `@@index([assigneeId])` | **Drop** — redundant; the composite's leading column covers it |
| `@@index([departmentId])` | **Drop** — same reason |
| `@@index([status])` | **Drop** — low cardinality (6 values), planner won't use it standalone |
| `@@index([priority])` | **Drop** — 4 values, never selective enough to be chosen |
| `@@index([isGovernance])` | **Drop** — boolean; use a partial index only if governance queries are hot: `@@index([isGovernance], where: isGovernance = true)` (raw SQL / partial) |
| `@@index([dueDate])` | **Keep** — the overdue/due-soon cron scans this range |
| `@@index([creatorId])` | **Keep** — "assigned out by me" (cross-dept) |
| `@@index([batchId])` | **Keep** — batch summary |

Add one you're missing: the cron overdue scan filters `status NOT IN (...) AND dueDate < now` — a composite **`@@index([status, dueDate])`** serves it far better than `dueDate` alone.

### 7b. Cross-department grant model is under-specified
Grants live in `UserPermission` as opaque permission **strings** (`schema.prisma:189`) — there's no representation of *which* departments an Admin may assign into, no grantor, no expiry, no audit. "Admin can assign cross-dept" is currently all-or-nothing per the org flag. If you ever need "Admin X may assign into Physics + Chemistry only," model it explicitly:

```prisma
model CrossDeptGrant {
  id            String     @id @default(cuid())
  admin         User       @relation("Grantee", fields: [adminId], references: [id], onDelete: Cascade)
  adminId       String
  department    Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  departmentId  String
  grantedBy     String     // SA/PM user id — audit
  expiresAt     DateTime?  // optional time-boxed grant
  createdAt     DateTime   @default(now())
  @@unique([adminId, departmentId])
  @@index([adminId])
}
```
Then `assign()` checks membership against this table (and its revocation participates in the Risk #2 session-invalidation event). Until that's needed, **at minimum add an audit trail** when grants change — today a revoke is invisible.

### DO / DON'T
- **DO** drop redundant single-column indexes whose leading column is already the head of a composite.
- **DO** add `@@index([status, dueDate])` for the cron.
- **DON'T** index booleans/low-cardinality columns standalone; use partial indexes if truly needed.
- **DON'T** encode structured authz (which departments) as flat permission strings if per-department granularity is on the roadmap.

---

## 8. Redis outage failure modes (shared by Socket.IO adapter + BullMQ + cache + sessions)

Redis is now load-bearing for: BullMQ, the rate limiter, the notification throttle, the (new) session denylist, and (if added) the Socket.IO adapter. A brief outage:

| Subsystem | Failure mode if Redis blips | Required behavior |
|-----------|------------------------------|-------------------|
| BullMQ workers | jobs stall; `bullRedis` reconnects (`maxRetriesPerRequest: null` already set) | **Acceptable** — jobs resume; ensure `removeOnFail` keeps failures for inspection |
| Rate limiter | plugin already falls back to in-memory (`rateLimit.plugin.ts`) | **Keep** — fail-open on limiting is fine |
| Session denylist (Risk #2) | `redis.get` throws | **Fail-open on the denylist but keep the DB `isActive` check** — a suspended user is still caught by the DB read; only the *fast* revocation degrades. Wrap the denylist read in try/catch returning "not revoked." |
| Notification throttle | dedup key unavailable | Fail-open (send) — a rare duplicate push beats a dropped one |
| Socket.IO adapter (if multi-instance) | cross-instance broadcast stops | Single API instance at this scale → **don't add the Redis adapter yet**; it's premature. Revisit only when you run >1 API replica |

**Idempotent reconnection (mobile Expo vs web):**
- **Mobile:** on `AppState` `active` and on socket `reconnect`, re-run the handshake with a *fresh* access token (refresh first if near expiry), then **refetch** notifications/task queries via React Query invalidation — never replay buffered socket events. The DB is truth (Risk #6a).
- **Web (Next.js):** same handshake-with-token on reconnect; because web can have multiple tabs, key the personal room off `user:{id}` (already the case) so all tabs converge; rely on refetch-on-focus.

---

## 9. User-load posture (~300–500 employees)

This is a **small** system — most "scale" advice is premature. What actually matters at this size:

- **Concurrency, not throughput.** Peak is a few dozen simultaneous writers (Admins assigning at shift start). Risk #3 (optimistic locking) is the real scaling fix, not sharding/replicas.
- **One API instance is enough.** Do **not** add the Socket.IO Redis adapter, read replicas, or horizontal scaling now — they add failure surface for no benefit. Note the trigger to revisit: sustained >70% CPU on the single instance, or >150 concurrent sockets.
- **Connection pooling:** Prisma + Supabase pooler is already in use (`?pgbouncer=true`). Keep Prisma's connection limit modest (pooler-friendly); do **not** raise it chasing phantom throughput.
- **The crons are the heaviest recurring load**, not user traffic. Ensure the overdue/due-soon/digest jobs page in bounded batches (already specified in the notification work) and are backed by `@@index([status, dueDate])` (§7a).
- **Push is the only true fan-out.** 500 recipients × Expo chunking is trivial; the risk is duplication (Risk #6a), not volume.
- **Do NOT prematurely add:** GraphQL, a message bus beyond BullMQ, a separate WebSocket service, per-tenant DBs. Multi-tenancy is "ready" via `orgId` scoping, not separate infra.

---

## 10. Implementation order for Opus 4.8 (one PR per item)

1. **Risk #1 — Socket auth.** Add `io.use` JWT verify; derive rooms server-side; delete `join:user`; update mobile/web handshake to pass `auth.token`; authorize `join:task`. *(Highest severity, smallest change.)*
2. **Risk #2 — Session invalidation.** Redis `revoked:user:{id}` denylist + `requireAuth` check + `disconnectSockets` on suspend/role-change/grant-revoke. Wrap denylist read fail-open.
3. **Risk #4 — Platform lock.** `x-client-platform` header from both clients; `enforcePlatformLock` global preHandler + socket handshake + login guard.
4. **Risk #3 — Optimistic locking.** Add `Task.version`; migrate; wrap `assign`/`updateStatus`/`bulkUpdateStatus` in `$transaction` with `updateMany({ where:{ version } })`; return `409`; move notify/activity inside the guarded path; mobile handles `409` with refetch.
5. **Risk #5 — Idempotency + dept guard.** `jobId` on push jobs + Redis delivered-token set; mobile `notification:new` → invalidate-and-refetch; `onDelete: Restrict` on Department relations; forbid hard-delete.
6. **§7a — Index trim** (separate migration; verify query plans in staging before/after with `EXPLAIN`).

**Global DON'Ts (apply to every PR):**
- Don't trust client-supplied ids/roles/platform over verified JWT + DB.
- Don't retry mutating jobs; only idempotent side effects.
- Don't hard-delete scoping entities.
- Don't add horizontal-scale infra (Redis socket adapter, replicas) at this user count.
- Don't compute authz or notification recipients from a stale pre-write read.

**Global DOs:**
- One source of truth per concern: DB for authz/notification content, verified JWT for identity, Redis for fast revocation/throttle/idempotency.
- Reuse the task-visibility `where` in REST and socket paths (extract once).
- Fail closed on authz/platform; fail open on rate-limit/throttle/denylist-read.
