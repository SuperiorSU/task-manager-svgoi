# 07 — Security Checklist
### Godigitify Nexus · Security, Auth, RBAC & API Hardening
**Version:** 1.0 | **Standard:** OWASP Top 10 · BRD Section 8

---

## DIRECTIVE GOAL
Security is baked in from day one — not audited at the end.
This checklist is run at three points: before starting a module, before PR review, before deployment.
Every item has a WHY so developers understand the threat, not just the rule.

---

## Layer 1 — Authentication Security

### 1.1 Password Storage
```
✅ REQUIRED
□ Passwords hashed with bcrypt (cost factor 12 minimum)
□ Never store plaintext or reversible-encrypted passwords
□ Never log passwords anywhere (request logs, error logs, audit logs)
□ Password validation enforced server-side regardless of client-side validation

Implementation:
import bcrypt from 'bcryptjs';
const BCRYPT_ROUNDS = 12; // ~250ms per hash — acceptable for login, prevents brute force
const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
const valid = await bcrypt.compare(plaintext, hash);
```

### 1.2 JWT Token Design
```
✅ REQUIRED
□ Access token: short-lived (15 min). Signed with HS256 minimum, RS256 preferred for prod.
□ Refresh token: longer-lived (7 days). Stored as bcrypt hash in DB — never plaintext.
□ Refresh token rotation: on every /auth/refresh call, old token is revoked, new pair issued.
□ JWT payload: userId, role, sessionId only — never embed permissions (can go stale)
□ JWT secret: minimum 256-bit random string, never committed to repo
□ On password change: revoke ALL refresh tokens for that user
□ On account deactivation: revoke ALL refresh tokens immediately

Token payload structure:
{
  sub: userId,         // Subject
  role: 'ADMIN',       // For quick role checks (permissions fetched from DB)
  sid: sessionId,      // Allows per-session revocation
  iat: timestamp,
  exp: timestamp
}

❌ NEVER embed permissions array in JWT — they're stale the moment you update DB
```

### 1.3 Token Storage (Client)
```
✅ REQUIRED — Mobile App:
□ Access token: Zustand memory store ONLY (cleared on app close — by design)
□ Refresh token: expo-secure-store (Keychain on iOS, Keystore on Android)
□ User profile cache: expo-secure-store (not AsyncStorage)

✅ REQUIRED — Web Admin:
□ Access token: httpOnly cookie with Secure + SameSite=Strict flags
□ Refresh token: httpOnly cookie (separate, longer expiry)
□ Never localStorage, never sessionStorage for tokens

Why: XSS attacks cannot access httpOnly cookies. AsyncStorage is plaintext on disk.
```

### 1.4 Session Management
```
✅ REQUIRED
□ Concurrent session limit: configurable per deployment (default: 5 devices)
□ Inactivity timeout: configurable (default: 30 min for web, 7 days for mobile)
□ "Sign out all devices" feature: revokes all refresh tokens for the user
□ Login event writes audit log: userId, IP, userAgent, timestamp, success/fail
□ 5 consecutive failed logins: 15-minute lockout (stored in Redis with TTL)

Redis lockout key pattern:
login_attempts:{userId}   → count (TTL 15 min, reset on success)
login_lockout:{userId}    → '1' (TTL 15 min)
```

### 1.5 Password Reset Flow
```
✅ REQUIRED
□ Reset token: cryptographically random 32-byte hex string (not JWT)
□ Token stored as SHA-256 hash in DB (never plaintext)
□ Token TTL: 15 minutes
□ Single-use: token deleted immediately on use
□ On reset: revoke all active refresh tokens for the user
□ Email enumeration protection: same response whether email exists or not
  ("If this email is registered, you'll receive a reset link")
□ Rate limit reset requests: 3 per hour per email address

Implementation:
import crypto from 'crypto';
const rawToken = crypto.randomBytes(32).toString('hex');
const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
// Send rawToken in email, store tokenHash in DB
// On verification: hash the received token and compare
```

---

## Layer 2 — Authorization & RBAC

### 2.1 RBAC Enforcement Rules
```
✅ REQUIRED — these are non-negotiable
□ RBAC checked at the API layer — NEVER trust client-side permission state
□ Every protected route has a requirePermission() preHandler
□ Super Admin bypass: explicitly coded (if role === 'SUPER_ADMIN') — not implicit
□ Admin dept-scoping: Admin can only see/manage users/tasks in their department
□ Cross-department access: forbidden for ADMIN, always logged when attempted

Department scoping pattern:
// Bad: trusts client-supplied departmentId
const tasks = await db.task.findMany({ where: { departmentId: req.body.departmentId }});

// Good: injects user's department from verified JWT
const tasks = await db.task.findMany({
  where: {
    departmentId: req.user.role === 'SUPER_ADMIN'
      ? req.query.departmentId  // SA can filter any dept
      : req.user.departmentId   // Admin sees own dept only
  }
});
```

### 2.2 Object-Level Authorization (IDOR Prevention)
```
✅ REQUIRED — Prevents Insecure Direct Object Reference
□ Never fetch a task/user/file by ID alone — always scope to requester's access
□ Pattern: fetch → check ownership → respond

// Bad: returns task to anyone who knows the ID
const task = await db.task.findUnique({ where: { id: params.id }});

// Good: only returns if requester is assignee, creator, or admin in that dept
const task = await db.task.findFirst({
  where: {
    id: params.id,
    OR: [
      { assigneeId: req.user.id },
      { creatorId: req.user.id },
      ...(req.user.role !== 'EMPLOYEE'
        ? [{ department: { id: req.user.departmentId } }]
        : [])
    ]
  }
});
if (!task) return sendError(reply, 404, 'NOT_FOUND', 'Task not found');
// Note: return 404, not 403 — don't confirm the resource exists
```

### 2.3 Permission Matrix Enforcement
```
Endpoint                          Required Permission        Notes
POST /tasks                       task:create               Admin, SA only
GET /tasks                        task:read:all or own      Filtered by role
PATCH /tasks/:id/status           task:update:status        Own task only (Employee)
PATCH /tasks/:id                  task:update:all           Admin+ only
DELETE /tasks/:id                 task:delete               SA only (soft delete)
POST /tasks/:id/assign            task:assign               Admin+ only
POST /tasks/bulk                  task:bulk                 Admin+ only
GET /users                        user:read                 Admin+
POST /users                       user:create               Admin+
PATCH /users/:id/deactivate       user:deactivate           Admin+ (own dept only for Admin)
GET /reports                      report:view               Admin+
GET /audit                        audit:view                SA only
GET /admin/config                 system:config             SA only
```

---

## Layer 3 — API Security

### 3.1 Input Validation
```
✅ REQUIRED — every endpoint
□ Fastify JSON Schema on ALL request bodies, params, and query strings
□ removeAdditional: 'all' in Fastify AJV config (strip unknown fields)
□ String fields: maxLength enforced (task title ≤ 200, description ≤ 5000)
□ Numeric fields: min/max enforced
□ Enum fields: strict allowed values list
□ File uploads: mimeType allowlist (image/jpeg, image/png, application/pdf only)
□ File size: enforced at multipart middleware level, not just application level

Why: Validates at the framework level before reaching controller code.
Overly large payloads never reach business logic.
```

### 3.2 Rate Limiting Strategy
```
✅ REQUIRED
□ Auth endpoints: 10 req/min per IP (brute force protection)
□ Password reset: 3 req/hour per email (enumeration + spam protection)
□ General API: 200 req/min per authenticated user
□ File upload: 20 req/min per user
□ Report generation: 5 req/min per user (heavy computation)
□ Push token registration: 10 req/day per user

Rate limit response: 429 with Retry-After header
Rate limit keys stored in Redis with appropriate TTL
```

### 3.3 CORS Configuration
```
✅ REQUIRED
□ Explicit origin allowlist — never '*' in production
□ Allowed origins: web admin domain + mobile (null origin for Expo dev)
□ Allowed methods: GET, POST, PATCH, DELETE, OPTIONS
□ Allowed headers: Content-Type, Authorization
□ Credentials: true (required for httpOnly cookies)
□ Preflight cache: 86400 seconds

Production config:
origin: ['https://admin.svgoi.godigitify.com'],
credentials: true,
methods: ['GET', 'POST', 'PATCH', 'DELETE'],
```

### 3.4 SQL Injection Prevention
```
✅ REQUIRED (Prisma handles most of this, but still verify)
□ Never use raw SQL strings with template literals: db.$queryRaw`SELECT...${userInput}`
□ If raw queries needed: use db.$queryRaw with Prisma.sql tagged template (parameterized)
□ Never pass user input directly to orderBy without allowlist validation

// Bad
const field = req.query.sortBy; // Could be "id; DROP TABLE users;"
await db.$queryRaw`SELECT * FROM tasks ORDER BY ${field}`;

// Good
const ALLOWED_SORT_FIELDS = ['title', 'dueDate', 'priority', 'status'] as const;
const sortBy = ALLOWED_SORT_FIELDS.includes(req.query.sortBy) ? req.query.sortBy : 'dueDate';
```

### 3.5 XSS Prevention
```
✅ REQUIRED
□ Never render unsanitized HTML from user input (task descriptions, comments)
□ Task descriptions: strip HTML on save (allow markdown only)
□ Comment @mentions: sanitize before storage and before display
□ File names: sanitize before saving to storage (path traversal prevention)
□ API responses: Content-Type: application/json always (never text/html)

File name sanitization:
const safeName = fileName
  .replace(/[^a-zA-Z0-9.\-_]/g, '_')  // Allow only safe chars
  .replace(/\.{2,}/g, '.')             // No path traversal (..)
  .slice(0, 255);                       // Length limit
```

### 3.6 File Upload Security
```
✅ REQUIRED
□ Validate MIME type server-side (not from client header — read magic bytes)
□ Generate a new UUID filename on storage — never use original filename as key
□ Store files outside webroot / in object storage (Supabase/S3)
□ Signed URLs for download: time-limited (15 min), per-user
□ Never expose direct storage URL — always proxy through API with auth check
□ File size limit enforced at multipart middleware: 10MB max
□ Virus scan: integrate ClamAV or cloud scanning for PDFs

Storage key pattern: uploads/{taskId}/{uuid}.{ext}
Never: uploads/{taskId}/{originalFileName}
```

### 3.7 Security Headers
```
✅ REQUIRED on all API responses
□ X-Content-Type-Options: nosniff
□ X-Frame-Options: DENY
□ X-XSS-Protection: 1; mode=block
□ Referrer-Policy: strict-origin-when-cross-origin
□ Content-Security-Policy: (web only) — strict policy

On web admin (Next.js), add to next.config.ts:
headers: [{
  source: '/(.*)',
  headers: [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=()' },
  ]
}]
```

---

## Layer 4 — Data Protection

### 4.1 PII Handling
```
✅ REQUIRED
□ PII fields in DB: encrypt at rest where legally required (name, email, phone)
□ PII in logs: mask email to j***@domain.com, mask phone to ****1234
□ PII in audit logs: store user ID only, join at query time — don't embed names
□ Data retention: implement soft-delete with automated purge after retention period
□ Never return passwordHash in any API response — use Prisma select explicitly

Prisma safe user select:
const safeUserSelect = {
  id: true, name: true, email: true, role: true,
  departmentId: true, avatarUrl: true, isActive: true,
  // passwordHash: NEVER
} satisfies Prisma.UserSelect;
```

### 4.2 Audit Log Immutability
```
✅ REQUIRED
□ AuditLog and TaskActivity records: no UPDATE or DELETE endpoints exist
□ DB-level: add CHECK constraint or trigger preventing updates to these tables
□ Application-level: no service method exists for editing audit records
□ Super Admin UI: read-only view of audit logs
□ Log tampering attempt: itself logged as a security event

The audit trail IS the accountability system per BRD FR-66.
If it can be edited, it's worthless.
```

### 4.3 Environment & Secrets
```
✅ REQUIRED
□ All secrets in environment variables — never in code, never in config files
□ .env files: gitignored always, committed .env.example has no values
□ Production secrets: managed via Railway/Render secret manager or Vault
□ JWT secrets: minimum 256-bit (32 random bytes), rotated if compromised
□ Database password: minimum 20 characters, rotated quarterly
□ No secrets in Docker build args (they appear in image layers)

Generating a secure secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Layer 5 — Infrastructure Security

### 5.1 Database
```
✅ REQUIRED
□ DB not publicly accessible — only reachable from API server via VPC/private network
□ DB user: principle of least privilege (no superuser for application)
□ Connection pooling: PgBouncer or Prisma Accelerate (never open unlimited connections)
□ DB connection string: never logged (contains password)
□ Automated backups: daily, 30-day retention, encrypted
□ Point-in-time recovery: enabled

Prisma connection limit for serverless:
datasource db {
  url = env("DATABASE_URL")
  // Add ?connection_limit=5&pool_timeout=2 for serverless deploys
}
```

### 5.2 Redis
```
✅ REQUIRED
□ Redis: password-protected (requirepass in config)
□ Redis: not publicly accessible — internal network only
□ Redis TLS: enabled in production
□ Keys: use descriptive namespaced patterns (auth:session:*, cache:dashboard:*)
□ TTL: every key has a TTL — no immortal keys except permanent config
□ Sensitive data in Redis (session): encrypted before storage
```

### 5.3 Docker / Deployment
```
✅ REQUIRED
□ Non-root user in Dockerfile (USER node)
□ Multi-stage build: dev dependencies not in production image
□ No secrets in Dockerfile or docker-compose.yml
□ Base image: node:20-alpine (minimal attack surface)
□ Health check endpoint: GET /health (no auth required, returns 200)
□ Graceful shutdown: handle SIGTERM to drain connections before exit

Dockerfile pattern:
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nodeuser
USER nodeuser
WORKDIR /app
COPY --from=builder --chown=nodeuser:nodejs /app/dist ./dist
COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

---

## Layer 6 — Pre-Deployment Security Checklist

Run this before every production deployment:

```
AUTHENTICATION
□ All /auth/* endpoints have rate limiting
□ JWT secrets are ≥ 256-bit random values set in env
□ Refresh token rotation is working (test: use same refresh token twice — second use fails)
□ Logout clears refresh token from DB
□ Password reset tokens are single-use and expire in 15 min

AUTHORIZATION  
□ Every non-public route has requireAuth preHandler
□ Every admin route has requirePermission preHandler
□ Employee cannot access other employees' tasks (test IDOR manually)
□ Admin cannot access other department's data (test cross-dept access)

API HARDENING
□ CORS origin list is explicit (no wildcards)
□ Rate limiting is on all auth endpoints
□ File upload validates MIME type from magic bytes
□ No raw SQL with user input (grep for $queryRawUnsafe)

DATA
□ No passwordHash in any API response (grep API responses in tests)
□ No secrets in git history (git log -p | grep -i secret)
□ .env is in .gitignore (verify: git status shows .env as untracked)
□ Audit logs cannot be modified (test: attempt PATCH on audit endpoint → 405)

HEADERS
□ Security headers present on all responses
□ HTTPS enforced (HTTP → HTTPS redirect in reverse proxy)
□ Cookie flags: httpOnly=true, Secure=true, SameSite=Strict

INFRA
□ DB not publicly accessible (test: nc -zv db-host 5432 from external)
□ Redis not publicly accessible
□ Docker container runs as non-root user
□ Health check endpoint responds 200
```

---

## Layer 7 — Incident Response

```
If a security issue is discovered:

1. CONTAIN: Revoke all active sessions (clear RefreshToken table + Redis session keys)
2. ASSESS: Check audit logs for scope of compromise
3. COMMUNICATE: Notify SVGOI SPOC within 2 hours
4. PATCH: Fix + deploy hotfix branch (never main)
5. VERIFY: Confirm fix in staging before production push
6. DOCUMENT: Write incident report with timeline, impact, remediation

Emergency session revocation SQL:
UPDATE "RefreshToken" SET "revokedAt" = NOW() WHERE "revokedAt" IS NULL;
DEL redis-cli: FLUSHDB (only the session DB, not the cache DB)
```

---

## DOs and DON'Ts — Security

### ✅ DO
- Treat **every API input as hostile** until validated
- Use **parameterized queries** exclusively (Prisma handles this)
- Return **404 not 403** when a resource exists but the user can't access it (IDOR prevention)
- Store **file names as UUIDs** in storage — sanitize originals before display
- Rate-limit **every endpoint** — even "harmless" ones can be used for enumeration
- Write **one integration test per auth scenario** (token expired, no token, wrong role)
- Log **every security event** to the audit trail (failed logins, permission denials)

### ❌ DON'T
- Never use `Math.random()` for any security purpose — use `crypto.randomBytes()`
- Never expose **stack traces** in production API error responses
- Never use **wildcard CORS** (`origin: '*'`) in production
- Never store **tokens in localStorage** on web
- Never **trust the MIME type** from the client's file upload header — read magic bytes
- Never skip **RBAC checks** because "the UI already prevents it" — UI is bypassable
- Never embed **email or phone** in URLs (query params are logged)
- Never **log request bodies** in production without scrubbing sensitive fields