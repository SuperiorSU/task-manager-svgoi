// ─── Super Admin Audit Module — Mock Data ──────────────────────────────────────
// Org-wide immutable activity log (HTML reference screens 50-52: "Audit log —
// full screen", "Audit event detail — record", "Audit log filters — sheet").
// Mirrors the Prisma AuditLog model (03_backend_directive.md §4) and the
// AUDIT_VIEW_ORG permission scope (07_security_compliance_directive.md §2.3
// — Super Admin sees read-only, org-scoped audit; system-wide audit is
// PLATFORM_MANAGER territory and is out of scope here).
//
// Swap USE_MOCK = false and point audit.service.ts methods at GET /audit,
// GET /audit/:id, GET /audit/actors when the backend is ready. Shapes are
// stable — UI never imports MOCK_* directly, only the service/hooks.

import type { Feather } from '@expo/vector-icons';

export const USE_MOCK = true;

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuditCategory = 'USER' | 'TASK' | 'DEPARTMENT' | 'SECURITY' | 'SYSTEM';

export type AuditActorRole = 'SUPER_ADMIN' | 'ADMIN' | 'SYSTEM';

export type AuditActor = {
  id: string;
  name: string;
  initials: string;
  role: AuditActorRole;
  employeeId?: string;
};

export type AuditDetailField = {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
};

export type AuditEvent = {
  id: string; // e.g. "AUD-91274"
  category: AuditCategory;
  headline: string; // detail-screen title, e.g. "Admin account created"
  description: string; // list-row text, e.g. "You created admin — A. Sharma"
  boldRanges: [start: number, end: number][];
  icon: keyof typeof Feather.glyphMap;
  iconBg: string;
  iconColor: string;
  actor: AuditActor;
  departmentId: string | null;
  departmentName: string | null;
  contextLabel: string; // list-row meta, e.g. "10:24 · Chemistry"
  createdAt: string; // ISO
  details: AuditDetailField[];
  integrityHash: string; // e.g. "4f9a…c17e"
};

export type AuditDateRange = 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'CUSTOM';

// ─── Category metadata — single source of truth for chips + badges ───────────

export const AUDIT_CATEGORY_META: Record<AuditCategory, { label: string; badgeBg: string; badgeColor: string }> = {
  USER: { label: 'USER', badgeBg: '#EEF2FF', badgeColor: '#4F46E5' },
  TASK: { label: 'TASK', badgeBg: '#EFF6FF', badgeColor: '#1D4ED8' },
  DEPARTMENT: { label: 'DEPARTMENT', badgeBg: '#EEF2FF', badgeColor: '#4F46E5' },
  SECURITY: { label: 'SECURITY', badgeBg: '#FEF2F2', badgeColor: '#B91C1C' },
  SYSTEM: { label: 'SYSTEM', badgeBg: '#F0FDF4', badgeColor: '#15803D' },
};

// Quick-filter chip set on the main log screen (subset of the full filter
// sheet taxonomy — matches HTML screen 50's chip row exactly).
export const AUDIT_QUICK_CATEGORIES: { value: AuditCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'USER', label: 'Users' },
  { value: 'TASK', label: 'Tasks' },
  { value: 'SECURITY', label: 'Security' },
];

// Full category set in the filter sheet (screen 52).
export const AUDIT_FILTER_CATEGORIES: { value: AuditCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'USER', label: 'Users' },
  { value: 'TASK', label: 'Tasks' },
  { value: 'DEPARTMENT', label: 'Departments' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'SYSTEM', label: 'System' },
];

export const AUDIT_DATE_RANGE_OPTIONS: { value: AuditDateRange; label: string }[] = [
  { value: 'TODAY', label: 'Today' },
  { value: 'LAST_7_DAYS', label: '7 days' },
  { value: 'LAST_30_DAYS', label: '30 days' },
  { value: 'CUSTOM', label: 'Custom' },
];

// ─── Actors ───────────────────────────────────────────────────────────────────
// The current Super Admin ("You") plus a handful of other admin-tier
// accounts referenced across events. Not the full MOCK_USERS roster —
// audit actors are specifically people with account/security-affecting
// permissions (Admin+), matching AUDIT_VIEW_ORG's scope.

export const MOCK_AUDIT_SELF: AuditActor = {
  id: 'actor_self',
  name: 'S. Verma',
  initials: 'SV',
  role: 'SUPER_ADMIN',
  employeeId: 'SVGOI-0001',
};

export const MOCK_AUDIT_ACTORS: AuditActor[] = [
  MOCK_AUDIT_SELF,
  { id: 'actor_menon', name: 'R. Menon', initials: 'RM', role: 'ADMIN', employeeId: 'SVGOI-0118' },
  { id: 'actor_das', name: 'P. Das', initials: 'PD', role: 'ADMIN', employeeId: 'SVGOI-0204' },
  { id: 'actor_sharma', name: 'A. Sharma', initials: 'AS', role: 'ADMIN', employeeId: 'SVGOI-0342' },
  { id: 'actor_system', name: 'System', initials: 'SY', role: 'SYSTEM' },
];

// ─── Mock events ────────────────────────────────────────────────────────────
// Spans "Today", "Yesterday" and older days across all 5 categories and all
// 5 real MOCK_DEPARTMENTS (see tasks.mock.ts) for realistic filter/search
// demo coverage.

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d: number, h = 9) => new Date(Date.now() - d * 24 * 60 * 60 * 1000 - h * 60 * 60 * 1000).toISOString();

export const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'AUD-91274',
    category: 'USER',
    headline: 'Admin account created',
    description: 'You created admin — A. Sharma',
    boldRanges: [[0, 3], [16, 25]],
    icon: 'user-plus',
    iconBg: AUDIT_CATEGORY_META.USER.badgeBg,
    iconColor: AUDIT_CATEGORY_META.USER.badgeColor,
    actor: MOCK_AUDIT_SELF,
    departmentId: 'dept_02',
    departmentName: 'IT Department',
    contextLabel: '10:24 · IT Department',
    createdAt: hoursAgo(1.5),
    details: [
      { label: 'Timestamp', value: '24 Jun 2026, 10:24:07 IST' },
      { label: 'Target', value: 'A. Sharma · IT Department' },
      { label: 'Assigned role', value: 'ADMIN', accent: true },
      { label: 'IP address', value: '10.4.2.18', mono: true },
      { label: 'Device', value: 'Web · Chrome / macOS' },
    ],
    integrityHash: '4f9a…c17e',
  },
  {
    id: 'AUD-91268',
    category: 'SECURITY',
    headline: 'Employee account suspended',
    description: 'R. Menon suspended employee — SVGOI-0342',
    boldRanges: [[0, 8]],
    icon: 'x-circle',
    iconBg: AUDIT_CATEGORY_META.SECURITY.badgeBg,
    iconColor: AUDIT_CATEGORY_META.SECURITY.badgeColor,
    actor: MOCK_AUDIT_ACTORS[1]!,
    departmentId: 'dept_04',
    departmentName: 'Academic Office',
    contextLabel: '09:12 · Academic Office',
    createdAt: hoursAgo(2.7),
    details: [
      { label: 'Timestamp', value: '24 Jun 2026, 09:12:41 IST' },
      { label: 'Target', value: 'SVGOI-0342 · Academic Office', mono: false },
      { label: 'Reason', value: 'Repeated policy violation' },
      { label: 'IP address', value: '10.4.7.51', mono: true },
      { label: 'Device', value: 'Web · Safari / macOS' },
    ],
    integrityHash: '8b2e…5a91',
  },
  {
    id: 'AUD-91255',
    category: 'DEPARTMENT',
    headline: 'Department created',
    description: 'You created department — Robotics Lab',
    boldRanges: [[0, 3], [20, 32]],
    icon: 'briefcase',
    iconBg: AUDIT_CATEGORY_META.DEPARTMENT.badgeBg,
    iconColor: AUDIT_CATEGORY_META.DEPARTMENT.badgeColor,
    actor: MOCK_AUDIT_SELF,
    departmentId: null,
    departmentName: 'Robotics Lab',
    contextLabel: '08:40 · 2 admins assigned',
    createdAt: hoursAgo(4.2),
    details: [
      { label: 'Timestamp', value: '24 Jun 2026, 08:40:19 IST' },
      { label: 'Target', value: 'Robotics Lab (new department)' },
      { label: 'Admins assigned', value: '2', accent: true },
      { label: 'IP address', value: '10.4.2.18', mono: true },
      { label: 'Device', value: 'Web · Chrome / macOS' },
    ],
    integrityHash: 'c710…2fd4',
  },
  {
    id: 'AUD-91201',
    category: 'TASK',
    headline: 'Task priority changed',
    description: 'P. Das changed priority — Critical → High',
    boldRanges: [[0, 6]],
    icon: 'list',
    iconBg: AUDIT_CATEGORY_META.TASK.badgeBg,
    iconColor: AUDIT_CATEGORY_META.TASK.badgeColor,
    actor: MOCK_AUDIT_ACTORS[2]!,
    departmentId: 'dept_01',
    departmentName: 'Physics',
    contextLabel: '16:30 · "Lab safety report"',
    createdAt: daysAgo(1, 7.5),
    details: [
      { label: 'Timestamp', value: '23 Jun 2026, 16:30:52 IST' },
      { label: 'Target', value: '"Lab safety report" · Physics' },
      { label: 'Priority', value: 'Critical → High', accent: true },
      { label: 'IP address', value: '10.4.3.92', mono: true },
      { label: 'Device', value: 'Mobile · iOS' },
    ],
    integrityHash: '19ac…7be2',
  },
  {
    id: 'AUD-91188',
    category: 'SYSTEM',
    headline: 'System backup completed',
    description: 'System backup completed — all databases',
    boldRanges: [[27, 40]],
    icon: 'download',
    iconBg: AUDIT_CATEGORY_META.SYSTEM.badgeBg,
    iconColor: AUDIT_CATEGORY_META.SYSTEM.badgeColor,
    actor: MOCK_AUDIT_ACTORS[4]!,
    departmentId: null,
    departmentName: null,
    contextLabel: '02:00 · automated',
    createdAt: daysAgo(1, 22),
    details: [
      { label: 'Timestamp', value: '23 Jun 2026, 02:00:00 IST' },
      { label: 'Target', value: 'All databases' },
      { label: 'Trigger', value: 'Scheduled (daily)' },
      { label: 'Duration', value: '4m 12s' },
    ],
    integrityHash: 'e02f…9c3a',
  },
  {
    id: 'AUD-91142',
    category: 'USER',
    headline: 'Employee account created',
    description: 'You created employee — K. Venkat',
    boldRanges: [[0, 3], [19, 28]],
    icon: 'user-plus',
    iconBg: AUDIT_CATEGORY_META.USER.badgeBg,
    iconColor: AUDIT_CATEGORY_META.USER.badgeColor,
    actor: MOCK_AUDIT_SELF,
    departmentId: 'dept_05',
    departmentName: 'CS & Electronics',
    contextLabel: '11:05 · CS & Electronics',
    createdAt: daysAgo(2, 4),
    details: [
      { label: 'Timestamp', value: '22 Jun 2026, 11:05:33 IST' },
      { label: 'Target', value: 'K. Venkat · CS & Electronics' },
      { label: 'Assigned role', value: 'EMPLOYEE', accent: true },
      { label: 'IP address', value: '10.4.2.18', mono: true },
      { label: 'Device', value: 'Web · Chrome / macOS' },
    ],
    integrityHash: '3d61…be0c',
  },
  {
    id: 'AUD-91098',
    category: 'SECURITY',
    headline: 'Failed login attempts — lockout triggered',
    description: 'System locked account — SVGOI-0118 after 5 failed attempts',
    boldRanges: [[16, 21]],
    icon: 'lock',
    iconBg: AUDIT_CATEGORY_META.SECURITY.badgeBg,
    iconColor: AUDIT_CATEGORY_META.SECURITY.badgeColor,
    actor: MOCK_AUDIT_ACTORS[4]!,
    departmentId: 'dept_04',
    departmentName: 'Academic Office',
    contextLabel: '19:47 · Academic Office',
    createdAt: daysAgo(3, 6),
    details: [
      { label: 'Timestamp', value: '21 Jun 2026, 19:47:02 IST' },
      { label: 'Target', value: 'SVGOI-0118 · Academic Office' },
      { label: 'Failed attempts', value: '5', accent: true },
      { label: 'Lockout duration', value: '15 minutes' },
      { label: 'IP address', value: '103.21.58.4', mono: true },
    ],
    integrityHash: 'a5f8…10d7',
  },
  {
    id: 'AUD-91050',
    category: 'DEPARTMENT',
    headline: 'Department settings updated',
    description: 'You updated settings — Physics working hours',
    boldRanges: [[0, 3], [17, 40]],
    icon: 'briefcase',
    iconBg: AUDIT_CATEGORY_META.DEPARTMENT.badgeBg,
    iconColor: AUDIT_CATEGORY_META.DEPARTMENT.badgeColor,
    actor: MOCK_AUDIT_SELF,
    departmentId: 'dept_01',
    departmentName: 'Physics',
    contextLabel: '14:12 · Physics',
    createdAt: daysAgo(4, 5),
    details: [
      { label: 'Timestamp', value: '20 Jun 2026, 14:12:44 IST' },
      { label: 'Target', value: 'Physics department settings' },
      { label: 'Field changed', value: 'Working hours: 9-5 → 8-4', accent: true },
      { label: 'IP address', value: '10.4.2.18', mono: true },
      { label: 'Device', value: 'Web · Chrome / macOS' },
    ],
    integrityHash: '77b3…4e19',
  },
  {
    id: 'AUD-90994',
    category: 'TASK',
    headline: 'Task cancelled',
    description: 'A. Sharma cancelled task — "Server room re-cabling"',
    boldRanges: [[0, 9]],
    icon: 'list',
    iconBg: AUDIT_CATEGORY_META.TASK.badgeBg,
    iconColor: AUDIT_CATEGORY_META.TASK.badgeColor,
    actor: MOCK_AUDIT_ACTORS[3]!,
    departmentId: 'dept_02',
    departmentName: 'IT Department',
    contextLabel: '13:02 · IT Department',
    createdAt: daysAgo(5, 8),
    details: [
      { label: 'Timestamp', value: '19 Jun 2026, 13:02:09 IST' },
      { label: 'Target', value: '"Server room re-cabling" · IT Department' },
      { label: 'Reason', value: 'Vendor unavailable' },
      { label: 'IP address', value: '10.4.5.14', mono: true },
      { label: 'Device', value: 'Mobile · Android' },
    ],
    integrityHash: 'd291…88a6',
  },
  {
    id: 'AUD-90920',
    category: 'USER',
    headline: 'Employee account reactivated',
    description: 'You reactivated employee — SVGOI-0087',
    boldRanges: [[0, 3], [20, 30]],
    icon: 'user-check',
    iconBg: AUDIT_CATEGORY_META.USER.badgeBg,
    iconColor: AUDIT_CATEGORY_META.USER.badgeColor,
    actor: MOCK_AUDIT_SELF,
    departmentId: 'dept_03',
    departmentName: 'Admin Office',
    contextLabel: '10:51 · Admin Office',
    createdAt: daysAgo(7, 3),
    details: [
      { label: 'Timestamp', value: '17 Jun 2026, 10:51:27 IST' },
      { label: 'Target', value: 'SVGOI-0087 · Admin Office' },
      { label: 'Previous status', value: 'Suspended → Active', accent: true },
      { label: 'IP address', value: '10.4.2.18', mono: true },
      { label: 'Device', value: 'Web · Chrome / macOS' },
    ],
    integrityHash: '5c7d…f320',
  },
  {
    id: 'AUD-90855',
    category: 'SYSTEM',
    headline: 'Password policy updated',
    description: 'System applied config — minimum password length 12',
    boldRanges: [[16, 22]],
    icon: 'settings',
    iconBg: AUDIT_CATEGORY_META.SYSTEM.badgeBg,
    iconColor: AUDIT_CATEGORY_META.SYSTEM.badgeColor,
    actor: MOCK_AUDIT_ACTORS[4]!,
    departmentId: null,
    departmentName: null,
    contextLabel: '00:00 · scheduled rollout',
    createdAt: daysAgo(10, 0),
    details: [
      { label: 'Timestamp', value: '14 Jun 2026, 00:00:00 IST' },
      { label: 'Target', value: 'Org-wide password policy' },
      { label: 'Field changed', value: 'Min length: 8 → 12', accent: true },
    ],
    integrityHash: 'f109…3bc5',
  },
];
