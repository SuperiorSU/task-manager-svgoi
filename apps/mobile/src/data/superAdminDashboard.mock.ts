// ─── Super Admin Dashboard — Mock Data ─────────────────────────────────────────
// Org-wide rollups for the Super Admin Dashboard (HTML reference screens
// 48-49, "Super Admin Dashboard Part 1/2"). Task-derived numbers (totals,
// completion, department comparison) are computed from the shared
// MOCK_TASKS/MOCK_DEPARTMENTS/MOCK_USERS in tasks.mock.ts inside the service
// layer, so they stay consistent with every other dashboard in the app.
// Only genuinely new data — system headcounts and the audit feed, neither of
// which has an existing mock model — is authored here.
//
// Swap USE_MOCK = false and point superAdminDashboard.service.ts methods at
// GET /dashboard/org-stats, GET /dashboard/system-health, GET /departments
// (with completion aggregation) and GET /audit when the backend is ready.
// Shapes mirror the Prisma AuditLog model (03_backend_directive.md §4) so the
// swap requires no UI changes.

export const USE_MOCK = true;

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrgStats = {
  totalTasks: number;
  departments: number;
  orgCompleted: number;
  orgOverdue: number;
  inFlight: number;
  completionRate: number; // 0-100
};

export type SystemHealth = {
  activeUsers: number;
  admins: number;
  departments: number;
};

export type DepartmentComparisonEntry = {
  departmentId: string;
  departmentName: string;
  completionRate: number; // 0-100
  taskCount: number;
};

export type AuditEventCategory =
  | 'USER_CREATED'
  | 'USER_SUSPENDED'
  | 'DEPARTMENT_CREATED'
  | 'SYSTEM';

export type AuditEvent = {
  id: string;
  category: AuditEventCategory;
  description: string; // plain text; bold spans are applied by the UI via `boldRanges`
  boldRanges: [start: number, end: number][];
  contextLabel: string; // e.g. "10 min ago · IP 10.4.2.18"
  createdAt: string;
};

// ─── Authored reference data (no existing source model) ──────────────────────
// Headcounts derived from the shared MOCK_USERS roster: designations
// containing "Head of" are treated as dept-admin-tier accounts.

export const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'audit_001',
    category: 'USER_CREATED',
    description: 'You created admin account — A. Sharma (Chemistry)',
    boldRanges: [
      [0, 3],
      [24, 33],
    ],
    contextLabel: '10 min ago · IP 10.4.2.18',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'audit_002',
    category: 'USER_SUSPENDED',
    description: 'R. Menon suspended employee — SVGOI-0342',
    boldRanges: [[0, 8]],
    contextLabel: '1 hr ago · Mathematics',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'audit_003',
    category: 'DEPARTMENT_CREATED',
    description: 'You created department — Robotics Lab',
    boldRanges: [
      [0, 3],
      [23, 35],
    ],
    contextLabel: '3 hr ago · 2 admins assigned',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'audit_004',
    category: 'SYSTEM',
    description: 'System backup completed — all databases',
    boldRanges: [[27, 40]],
    contextLabel: 'Yesterday · 02:00 · automated',
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
];
