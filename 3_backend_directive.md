# 03 — Fastify Backend API Directive
### Godigitify Nexus · API Server
**Version:** 1.0 | **Stack:** Fastify v5 · TypeScript · Prisma · PostgreSQL · Redis · Socket.IO

---

## DIRECTIVE GOAL
Build a production-grade REST + WebSocket API. Every endpoint is authenticated, RBAC-protected,
validated, rate-limited, logged, and tested. This directive is the single source of truth for
API design, database schema patterns, auth flows, and backend architecture decisions.

---

## 1. API Workspace Structure

```
apps/api/
├── src/
│   ├── server.ts                     # Fastify server bootstrap
│   ├── app.ts                        # Plugin registration + route mounting
│   ├── config/
│   │   ├── env.ts                    # Zod-validated env parsing (fail fast on bad config)
│   │   ├── database.ts               # Prisma client singleton
│   │   ├── redis.ts                  # Redis client (ioredis)
│   │   └── logger.ts                 # Pino logger config
│   ├── plugins/
│   │   ├── auth.plugin.ts            # JWT verification decorator
│   │   ├── rbac.plugin.ts            # Permission checker decorator
│   │   ├── rateLimit.plugin.ts       # Rate limiting config
│   │   ├── cors.plugin.ts
│   │   ├── multipart.plugin.ts       # File upload (fastify-multipart)
│   │   └── socket.plugin.ts          # Socket.IO integration
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schema.ts        # Fastify JSON schema for validation
│   │   ├── users/
│   │   │   ├── users.routes.ts
│   │   │   ├── users.controller.ts
│   │   │   └── users.service.ts
│   │   ├── tasks/
│   │   │   ├── tasks.routes.ts
│   │   │   ├── tasks.controller.ts
│   │   │   ├── tasks.service.ts
│   │   │   └── tasks.schema.ts
│   │   ├── departments/
│   │   ├── comments/
│   │   ├── notifications/
│   │   │   ├── notifications.routes.ts
│   │   │   ├── notifications.service.ts
│   │   │   └── push.service.ts       # Expo push notification sender
│   │   ├── files/
│   │   │   ├── files.routes.ts
│   │   │   └── files.service.ts      # Presigned URL generation + metadata save
│   │   ├── dashboard/
│   │   │   ├── dashboard.routes.ts
│   │   │   └── dashboard.service.ts  # Aggregation queries with Redis caching
│   │   └── reports/
│   │       ├── reports.routes.ts
│   │       └── reports.service.ts    # PDF generation with Puppeteer/PDFKit
│   ├── middlewares/
│   │   ├── errorHandler.ts           # Global error → ApiError formatter
│   │   └── requestLogger.ts
│   ├── shared/
│   │   ├── types/
│   │   │   └── fastify.d.ts          # Augment FastifyRequest with user, permissions
│   │   ├── guards/
│   │   │   ├── requireAuth.guard.ts
│   │   │   └── requirePermission.guard.ts
│   │   └── decorators/
│   │       └── cache.decorator.ts    # Redis cache-aside decorator
│   ├── jobs/                         # Background jobs (BullMQ)
│   │   ├── queue.ts                  # BullMQ queue definitions
│   │   ├── workers/
│   │   │   ├── notification.worker.ts
│   │   │   ├── report.worker.ts
│   │   │   └── recurringTask.worker.ts
│   │   └── processors/
│   │       └── overdueTask.processor.ts
│   └── utils/
│       ├── jwt.utils.ts
│       ├── bcrypt.utils.ts
│       ├── response.utils.ts         # Standardized success/error response builders
│       └── audit.utils.ts           # Audit log writer
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
│   ├── unit/
│   │   └── tasks.service.test.ts
│   └── integration/
│       └── auth.routes.test.ts
├── Dockerfile
├── tsconfig.json
└── package.json
```

---

## 2. Core Dependencies

```json
{
  "dependencies": {
    "fastify": "^5.0.0",
    "@fastify/jwt": "^9.0.0",
    "@fastify/cors": "^10.0.0",
    "@fastify/rate-limit": "^10.0.0",
    "@fastify/multipart": "^9.0.0",
    "@fastify/swagger": "^9.0.0",
    "@fastify/swagger-ui": "^5.0.0",
    "@prisma/client": "^6.0.0",
    "ioredis": "^5.4.0",
    "bullmq": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.23.0",
    "pino": "^9.0.0",
    "pino-pretty": "^13.0.0",
    "socket.io": "^4.8.0",
    "expo-server-sdk": "^3.10.0",
    "nodemailer": "^6.9.0",
    "@aws-sdk/client-s3": "^3.0.0",
    "@aws-sdk/s3-request-presigner": "^3.0.0",
    "dayjs": "^1.11.0",
    "node-cron": "^3.0.0"
  },
  "devDependencies": {
    "prisma": "^6.0.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/nodemailer": "^6.4.0",
    "vitest": "^2.0.0",
    "@godigitify/types": "workspace:*"
  }
}
```

---

## 3. Fastify Server Bootstrap

```typescript
// src/server.ts
import Fastify from 'fastify';
import { env } from './config/env';
import { buildApp } from './app';

async function main() {
  const app = Fastify({
    logger: env.NODE_ENV === 'production'
      ? { level: 'info' }
      : { level: 'debug', transport: { target: 'pino-pretty' } },
    ajv: {
      customOptions: {
        removeAdditional: 'all',    // Strip unknown fields
        coerceTypes: 'array',
        useDefaults: true,
      },
    },
  });

  await buildApp(app);

  await app.listen({
    port: env.PORT,
    host: '0.0.0.0',               // Required for Docker
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

```typescript
// src/config/env.ts — Fail fast on missing/invalid config
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  FROM_EMAIL: z.string().email(),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

export const env = schema.parse(process.env);
```

---

## 4. Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ──────────────────────────────────────────────────────────
enum Role {
  PLATFORM_MANAGER   // Godigitify infrastructure role — web only, no task ops
  SUPER_ADMIN        // Org-level admin — mobile + web, full org access
  ADMIN              // Dept manager — mobile + web, dept-scoped + cross-dept assignment
  EMPLOYEE           // Operational staff — mobile only, own tasks only
}

enum TaskStatus {
  PENDING
  ACCEPTED
  IN_PROGRESS
  UNDER_REVIEW
  COMPLETED
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum NotificationType {
  TASK_ASSIGNED
  TASK_STATUS_CHANGED
  TASK_DUE_SOON
  TASK_OVERDUE
  COMMENT_ADDED
  CLARIFICATION_REQUESTED
  CLARIFICATION_RESPONDED
  TASK_COMPLETED
  TASK_REASSIGNED
}

enum AuditAction {
  CREATE
  READ
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  LOGIN_FAILED
  PASSWORD_CHANGED
  ROLE_CHANGED
  STATUS_CHANGED
  ASSIGNED
  REASSIGNED
}

// ─── CORE MODELS ────────────────────────────────────────────────────

model Department {
  id          String   @id @default(cuid())
  name        String   @unique
  code        String   @unique
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  head        User?    @relation("DeptHead", fields: [headId], references: [id])
  headId      String?
  users       User[]   @relation("DeptMembers")
  tasks       Task[]

  @@index([code])
}

model User {
  id              String   @id @default(cuid())
  email           String   @unique
  passwordHash    String
  name            String
  employeeId      String?  @unique
  phone           String?
  avatarUrl       String?
  designation     String?
  role            Role     @default(EMPLOYEE)
  isActive        Boolean  @default(true)
  lastLoginAt     DateTime?
  passwordChangedAt DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  department      Department? @relation("DeptMembers", fields: [departmentId], references: [id])
  departmentId    String?
  headOfDept      Department? @relation("DeptHead")

  manager         User?   @relation("Reports", fields: [managerId], references: [id])
  managerId       String?
  reports         User[]  @relation("Reports")

  assignedTasks   Task[]  @relation("TaskAssignee")
  createdTasks    Task[]  @relation("TaskCreator")
  taskComments    Comment[]
  notifications   Notification[]
  pushTokens      PushToken[]
  auditLogs       AuditLog[]
  taskActivities  TaskActivity[]

  permissions     UserPermission[]

  @@index([email])
  @@index([departmentId])
  @@index([role])
}

model UserPermission {
  id         String @id @default(cuid())
  user       User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId     String
  permission String

  @@unique([userId, permission])
  @@index([userId])
}

model Task {
  id           String       @id @default(cuid())
  title        String
  description  String?
  status       TaskStatus   @default(PENDING)
  priority     TaskPriority @default(MEDIUM)
  dueDate      DateTime
  isRecurring  Boolean      @default(false)
  recurringConfig Json?      // { frequency: 'daily'|'weekly'|'monthly', endDate: Date }
  parentTaskId String?      // For recurring task instances
  isDeleted    Boolean      @default(false)
  isCrossDept  Boolean      @default(false)  // TRUE when assignee is in a different dept than creator
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  acceptedAt   DateTime?
  completedAt  DateTime?

  creator      User         @relation("TaskCreator", fields: [creatorId], references: [id])
  creatorId    String
  assignee     User         @relation("TaskAssignee", fields: [assigneeId], references: [id])
  assigneeId   String
  department   Department?  @relation(fields: [departmentId], references: [id])
  departmentId String?

  comments     Comment[]
  attachments  FileAttachment[]
  activities   TaskActivity[]
  notifications Notification[]

  @@index([assigneeId])
  @@index([creatorId])
  @@index([departmentId])
  @@index([status])
  @@index([dueDate])
  @@index([priority])
  // Composite index for common query patterns
  @@index([assigneeId, status])
  @@index([departmentId, status])
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  isEdited  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskId    String
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  parent    Comment? @relation("Replies", fields: [parentId], references: [id])
  parentId  String?
  replies   Comment[] @relation("Replies")
  mentions  CommentMention[]

  @@index([taskId])
}

model CommentMention {
  id        String  @id @default(cuid())
  comment   Comment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  commentId String
  userId    String

  @@unique([commentId, userId])
}

model FileAttachment {
  id           String   @id @default(cuid())
  fileName     String
  fileSize     Int      // bytes
  mimeType     String
  storageKey   String   // Storage path/key (not public URL)
  isProof      Boolean  @default(false)  // Completion proof vs reference attachment
  downloadCount Int     @default(0)
  createdAt    DateTime @default(now())

  task         Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskId       String
  uploadedBy   String   // User ID

  @@index([taskId])
}

model TaskActivity {
  id          String      @id @default(cuid())
  action      AuditAction
  description String
  metadata    Json?       // Before/after values for field changes
  createdAt   DateTime    @default(now())

  task        Task        @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskId      String
  actor       User        @relation(fields: [actorId], references: [id])
  actorId     String

  @@index([taskId])
  @@index([createdAt])
}

model Notification {
  id        String           @id @default(cuid())
  type      NotificationType
  title     String
  body      String
  data      Json?            // Extra context (task ID, etc.)
  isRead    Boolean          @default(false)
  readAt    DateTime?
  createdAt DateTime         @default(now())

  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  task      Task?            @relation(fields: [taskId], references: [id])
  taskId    String?

  @@index([userId, isRead])
  @@index([createdAt])
}

model PushToken {
  id        String   @id @default(cuid())
  token     String   @unique
  platform  String   // 'ios' | 'android'
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String

  @@index([userId])
}

model AuditLog {
  id         String      @id @default(cuid())
  action     AuditAction
  entityType String      // 'Task', 'User', 'Department'
  entityId   String
  description String
  ipAddress  String?
  userAgent  String?
  metadata   Json?
  createdAt  DateTime    @default(now())

  actor      User?       @relation(fields: [actorId], references: [id])
  actorId    String?

  @@index([actorId])
  @@index([entityType, entityId])
  @@index([createdAt])
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  revokedAt DateTime?

  @@index([userId])
  @@index([token])
}
```

---

## 5. Auth Module

### auth.service.ts — Key patterns
```typescript
// Token rotation strategy:
// - Access token: 15 min, stored in memory on client
// - Refresh token: 7 days, stored in SecureStore (mobile) / httpOnly cookie (web)
// - On refresh: old token revoked in DB, new pair issued
// - On logout: refresh token revoked, access token expires naturally

// Login flow:
// 1. Validate credentials
// 2. Check account active
// 3. Generate access + refresh token pair
// 4. Store refresh token hash in RefreshToken table (not plaintext)
// 5. Update lastLoginAt
// 6. Write audit log
// 7. Return tokens + user object (never return passwordHash)

// Refresh flow:
// 1. Verify refresh token signature
// 2. Check token exists in DB and not revoked
// 3. Check token not expired
// 4. Revoke old token (rotation)
// 5. Issue new token pair

// Password reset flow:
// 1. Generate time-limited signed token (15 min expiry)
// 2. Send email with reset link
// 3. On reset: verify token, hash new password, revoke all refresh tokens for user
```

---

## 6. RBAC Implementation

```typescript
// src/shared/guards/requirePermission.guard.ts
// Four-tier permission system — checked server-side on EVERY protected endpoint

export const PERMISSIONS = {
  // Task permissions
  TASK_CREATE: 'task:create',
  TASK_READ_ALL: 'task:read:all',
  TASK_READ_OWN: 'task:read:own',
  TASK_UPDATE_ALL: 'task:update:all',
  TASK_UPDATE_STATUS: 'task:update:status',
  TASK_DELETE: 'task:delete',
  TASK_ASSIGN: 'task:assign',
  TASK_ASSIGN_CROSSDEPT: 'task:assign:crossdept',  // Admin → other dept
  TASK_REASSIGN: 'task:reassign',
  TASK_BULK_OPS: 'task:bulk',
  TASK_APPROVE: 'task:approve',     // UNDER_REVIEW → COMPLETED
  TASK_CANCEL: 'task:cancel',       // ANY → CANCELLED (only creator or SA)

  // User permissions
  USER_CREATE_ADMIN: 'user:create:admin',      // SA only
  USER_CREATE_EMPLOYEE: 'user:create:employee', // SA + Admin (own dept)
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_SUSPEND: 'user:suspend',
  USER_REACTIVATE: 'user:reactivate',
  USER_HARD_DELETE: 'user:delete:hard',        // PLATFORM_MANAGER only

  // Department permissions
  DEPT_MANAGE: 'dept:manage',

  // Report permissions
  REPORT_VIEW_OWN: 'report:view:own',
  REPORT_VIEW_DEPT: 'report:view:dept',
  REPORT_VIEW_ORG: 'report:view:org',
  REPORT_DOWNLOAD: 'report:download',

  // Audit & system (PLATFORM_MANAGER only)
  AUDIT_VIEW_ORG: 'audit:view:org',        // SA: own org task audit
  AUDIT_VIEW_SYSTEM: 'audit:view:system',  // PM only: system-wide audit
  LOG_MANAGE: 'log:manage',                // PM only
  SYSTEM_CONFIG: 'system:config',          // PM only
  ORG_MANAGE: 'org:manage',               // PM only
} as const;

// Default permission sets by role
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  PLATFORM_MANAGER: [
    PERMISSIONS.USER_HARD_DELETE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.AUDIT_VIEW_SYSTEM,
    PERMISSIONS.LOG_MANAGE,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.ORG_MANAGE,
    // Note: NO task permissions — PM is not an operational role
  ],
  SUPER_ADMIN: [
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ_ALL,
    PERMISSIONS.TASK_UPDATE_ALL,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.TASK_ASSIGN_CROSSDEPT,
    PERMISSIONS.TASK_REASSIGN,
    PERMISSIONS.TASK_BULK_OPS,
    PERMISSIONS.TASK_APPROVE,
    PERMISSIONS.TASK_CANCEL,
    PERMISSIONS.USER_CREATE_ADMIN,
    PERMISSIONS.USER_CREATE_EMPLOYEE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_SUSPEND,
    PERMISSIONS.USER_REACTIVATE,
    PERMISSIONS.DEPT_MANAGE,
    PERMISSIONS.REPORT_VIEW_OWN,
    PERMISSIONS.REPORT_VIEW_DEPT,
    PERMISSIONS.REPORT_VIEW_ORG,
    PERMISSIONS.REPORT_DOWNLOAD,
    PERMISSIONS.AUDIT_VIEW_ORG,
  ],
  ADMIN: [
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ_ALL,       // Scoped to dept at service layer
    PERMISSIONS.TASK_UPDATE_ALL,     // Scoped to own tasks at service layer
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.TASK_ASSIGN_CROSSDEPT,  // Admin can assign to other depts
    PERMISSIONS.TASK_REASSIGN,
    PERMISSIONS.TASK_BULK_OPS,
    PERMISSIONS.TASK_APPROVE,
    PERMISSIONS.TASK_CANCEL,         // Own created tasks only
    PERMISSIONS.USER_CREATE_EMPLOYEE,  // Own dept only, enforced at service layer
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,         // Own dept only
    PERMISSIONS.USER_SUSPEND,        // Own dept only
    PERMISSIONS.USER_REACTIVATE,     // Own dept only
    PERMISSIONS.REPORT_VIEW_OWN,
    PERMISSIONS.REPORT_VIEW_DEPT,
    PERMISSIONS.REPORT_DOWNLOAD,
  ],
  EMPLOYEE: [
    PERMISSIONS.TASK_READ_OWN,
    PERMISSIONS.TASK_UPDATE_STATUS,
    PERMISSIONS.REPORT_VIEW_OWN,
  ],
};

// IMPORTANT: Permissions grant the door; service-layer scoping enforces the room.
// e.g. ADMIN has USER_SUSPEND but the service checks departmentId before executing.
```

```typescript
// Route-level permission check usage:
// tasks.routes.ts
fastify.post('/', {
  preHandler: [requireAuth, requirePermission(PERMISSIONS.TASK_CREATE)],
  schema: createTaskSchema,
}, tasksController.create);

fastify.patch('/:id/status', {
  preHandler: [requireAuth, requirePermission(PERMISSIONS.TASK_UPDATE_STATUS)],
  schema: updateStatusSchema,
}, tasksController.updateStatus);
```

---

## 7. Redis Caching Strategy

```typescript
// Dashboard stats: cached 5 min (frequently read, less frequent writes)
// User list: cached 10 min with department-level invalidation
// Notification unread count: cached 30 sec
// Task detail: NOT cached (real-time accuracy required)

// Cache key patterns:
// dashboard:stats:{orgId}:{period}
// users:list:{deptId}
// notifications:unread:{userId}

// Cache invalidation on write:
// On task status change → invalidate dashboard:stats:*
// On user update → invalidate users:list:{deptId}
// On new notification → invalidate notifications:unread:{userId}

export const cache = {
  get: async <T>(key: string): Promise<T | null> => {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  },
  set: async (key: string, data: unknown, ttlSeconds = 300) => {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  },
  del: async (...keys: string[]) => {
    if (keys.length) await redis.del(...keys);
  },
  delPattern: async (pattern: string) => {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  },
};
```

---

## 8. Task Service — Core Business Logic

```typescript
// src/modules/tasks/tasks.service.ts

// Status transition matrix — enforced server-side
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['COMPLETED', 'IN_PROGRESS'], // Can push back to in-progress
  COMPLETED: [],                               // Terminal state
  CANCELLED: [],                               // Terminal state
};

export const canTransitionTo = (from: TaskStatus, to: TaskStatus): boolean => {
  return VALID_TRANSITIONS[from].includes(to);
};

// createTask: creates task + writes TaskActivity + sends push notification
// updateStatus: validates transition + updates + writes activity + sends notification
// reassignTask: updates assignee + preserves history + notifies new assignee
// Overdue detection runs as a cron job via BullMQ, not on-request
```

---

## 9. BullMQ Background Jobs

```typescript
// src/jobs/queue.ts
import { Queue } from 'bullmq';

export const notificationQueue = new Queue('notifications', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export const reportQueue = new Queue('reports', { connection: redis });
export const recurringTaskQueue = new Queue('recurring-tasks', { connection: redis });

// Cron job: check overdue tasks every hour
// Cron job: send 24h/12h/1h due date reminders
// Cron job: generate recurring task instances
```

---

## 10. API Response Standards

```typescript
// src/utils/response.utils.ts
import type { FastifyReply } from 'fastify';
import type { ApiResponse, ApiError } from '@godigitify/types';

export const sendSuccess = <T>(
  reply: FastifyReply,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>
) => {
  return reply.status(statusCode).send({ success: true, data, ...(meta && { meta }) });
};

export const sendError = (
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, string[]>
) => {
  return reply.status(statusCode).send({
    success: false,
    error: { code, message, ...(details && { details }) },
  });
};

// Standard error codes
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
```

---

## 11. Rate Limiting Configuration

```typescript
// Different rate limits per route category
// Auth routes: 10 req/minute (prevent brute force)
// General API: 200 req/minute per user
// File upload: 20 req/minute
// Reports: 10 req/minute (heavy computation)

// Registration:
await fastify.register(rateLimit, {
  global: false, // Apply per-route or per-plugin
});

// On auth routes:
fastify.register(async (instance) => {
  instance.addHook('onRequest', fastify.rateLimit({
    max: 10,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: () => sendError(reply, 429, 'RATE_LIMITED', 'Too many requests'),
  }));
});
```

---

## 12. DOs and DON'Ts — Backend

### ✅ DO
- Validate **every request** with JSON Schema (Fastify) or Zod — never trust input
- Return **standardized ApiResponse/ApiError** shapes from every endpoint
- Write **TaskActivity records** for every task mutation — immutable audit trail
- Use **Prisma transactions** for operations that touch multiple tables
- Cache **dashboard/analytics queries** in Redis — never run aggregations on every request
- Use **BullMQ** for push notifications, emails, PDF generation — never block the request
- Enforce **RBAC at the route level** with preHandler hooks
- Set **database query timeouts** to prevent slow queries from blocking the pool
- Use **pagination** on all list endpoints (default limit 20, max 100)
- Use **composite indexes** on frequently queried column combinations
- Soft-delete with `isDeleted` flag — never hard-delete task data
- Hash **refresh tokens** before storing in DB (SHA-256)

### ❌ DON'T
- Never return **passwordHash** in any API response — use Prisma `omit` or select explicitly
- Never store **plaintext tokens** in the database
- Never do **N+1 queries** — always use Prisma `include` or explicit joins
- Never use `SELECT *` — always select only needed fields
- Never expose **internal error messages** to the client in production
- Never skip **input sanitization** on comment content (XSS via @mentions)
- Never run **report generation synchronously** — always queue as background job
- Never delete **audit logs** or **task activity records** — they are compliance records
- Never mix **business logic** in routes/controllers — it lives in services only
- Never skip **database migrations** — never modify schema directly in production