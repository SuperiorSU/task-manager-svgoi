/**
 * Org Directory mock data — Super Admin "Create User & Department" module
 * (HTML reference screens 53-56: Create User SA, Create Department SA,
 * People — Users view, People — Departments view).
 *
 * Org-wide, cross-department, both roles (ADMIN + EMPLOYEE) — distinct from
 * team.mock.ts, which is the Admin module's own single-department roster
 * (screens 33/37, Employee-only, dept-locked). Kept as an independent store
 * so this module never touches Admin's Team module.
 *
 * Departments reuse the same ids/names as MOCK_DEPARTMENTS (tasks.mock.ts) so
 * department completion % (computed via superAdminDashboardService) and
 * every other dashboard stay consistent — no parallel fake department list.
 * Working-schedule / task-default presets are reused from adminSettings.mock
 * (Admin's own Department Settings screen, §47) for the same value vocabulary.
 *
 * Swap USE_MOCK = false and point orgDirectory.service.ts methods at
 * GET/POST /users and GET/POST /departments when the backend is ready.
 */

import { MOCK_DEPARTMENTS, MOCK_USERS } from './tasks.mock';
import {
  WORKING_DAYS_OPTIONS,
  WORKING_HOURS_OPTIONS,
  WEEKLY_HOLIDAY_OPTIONS,
  DUE_WINDOW_OPTIONS,
  DEFAULT_PRIORITY_OPTIONS,
  type TaskPriorityKey,
} from './adminSettings.mock';

export const USE_MOCK = true;

export {
  WORKING_DAYS_OPTIONS,
  WORKING_HOURS_OPTIONS,
  WEEKLY_HOLIDAY_OPTIONS,
  DUE_WINDOW_OPTIONS,
  DEFAULT_PRIORITY_OPTIONS,
};
export type { TaskPriorityKey };

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrgRole = 'ADMIN' | 'EMPLOYEE';
export type OrgUserStatus = 'ACTIVE' | 'SUSPENDED';

export type OrgDepartmentRef = { id: string; name: string };

export type OrgUser = {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  avatarText: string;
  staffId: string;
  email: string;
  phone?: string;
  designation: string;
  role: OrgRole;
  /** Employee: exactly one entry. Admin: one or more (can manage multiple depts). */
  departments: OrgDepartmentRef[];
  status: OrgUserStatus;
  createdAt: string;
};

export type OrgDepartment = {
  id: string;
  name: string;
  code: string;
  headUserId?: string;
  workingDays: string;
  workingHours: string;
  weeklyHoliday: string;
  defaultPriority: TaskPriorityKey;
  defaultDueWindowDays: number;
  /** True only for departments created during this session — drives the "NEW" badge. */
  createdInSession: boolean;
};

export type CreateOrgUserPayload = {
  name: string;
  staffId: string;
  email: string;
  phone?: string;
  designation?: string;
  role: OrgRole;
  departmentIds: string[];
};

export type CreateOrgDepartmentPayload = {
  name: string;
  code: string;
  headUserId?: string;
  workingDays: string;
  workingHours: string;
  weeklyHoliday: string;
  defaultPriority: TaskPriorityKey;
  defaultDueWindowDays: number;
};

// ─── User detail — account security + activity (SA "User detail", screen 68) ─
// Kept as separate id-keyed maps rather than new OrgUser fields — additive,
// doesn't touch createUser()'s payload shape or the 12 authored entries above.

export type OrgUserActivityKind = 'ACCOUNT_CREATED' | 'ROLE_CHANGED' | 'PASSWORD_RESET' | 'SUSPENDED' | 'REACTIVATED';

export type OrgUserActivityEvent = {
  id: string;
  kind: OrgUserActivityKind;
  description: string;
  createdAt: string; // ISO
};

export const ORG_USER_ACTIVITY_META: Record<OrgUserActivityKind, { dotColor: string; ringColor: string }> = {
  ACCOUNT_CREATED: { dotColor: '#94A3B8', ringColor: '#E2E8F0' },
  ROLE_CHANGED: { dotColor: '#4F46E5', ringColor: '#C7D2FE' },
  PASSWORD_RESET: { dotColor: '#F59E0B', ringColor: '#FDE68A' },
  SUSPENDED: { dotColor: '#60A5FA', ringColor: '#BFDBFE' },
  REACTIVATED: { dotColor: '#22C55E', ringColor: '#BBF7D0' },
};

// ─── Avatar palette (two-tone: light bg + saturated text, per HTML) ───────────
// Admin/head tier always uses the navy-indigo pair (matches the "ADMIN" role
// badge). Employees rotate through a small pastel set for visual variety.

export const ADMIN_AVATAR_PALETTE = { avatarBg: '#EEF2FF', avatarText: '#4F46E5' };

export const EMPLOYEE_AVATAR_PALETTE: { avatarBg: string; avatarText: string }[] = [
  { avatarBg: '#EFF6FF', avatarText: '#1D4ED8' },
  { avatarBg: '#FDF2F8', avatarText: '#9D174D' },
  { avatarBg: '#F0FDF4', avatarText: '#15803D' },
  { avatarBg: '#FFFBEB', avatarText: '#B45309' },
  { avatarBg: '#F5F3FF', avatarText: '#6D28D9' },
];

const now = new Date();
const past = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();

// ─── Departments (reuse MOCK_DEPARTMENTS ids/names) ───────────────────────────

const DEPT_CODE: Record<string, string> = {
  dept_01: 'PHY',
  dept_02: 'IT',
  dept_03: 'ADM',
  dept_04: 'ACAD',
  dept_05: 'CSE',
};

const HEAD_BY_DEPT: Record<string, string> = {
  dept_01: MOCK_USERS.akumar.id,
  dept_02: MOCK_USERS.sunil.id,
  dept_03: MOCK_USERS.nisha.id,
  dept_04: 'org_usr_012',
  dept_05: MOCK_USERS.rsingh.id,
};

export const MOCK_ORG_DEPARTMENTS: OrgDepartment[] = MOCK_DEPARTMENTS.map((dept) => ({
  id: dept.id,
  name: dept.name,
  code: DEPT_CODE[dept.id] ?? dept.id.toUpperCase(),
  ...(HEAD_BY_DEPT[dept.id] ? { headUserId: HEAD_BY_DEPT[dept.id] } : {}),
  workingDays: 'MON_SAT',
  workingHours: '9_5',
  weeklyHoliday: 'SUNDAY',
  defaultPriority: 'MEDIUM',
  defaultDueWindowDays: 3,
  createdInSession: false,
}));

const deptRef = (id: string): OrgDepartmentRef => {
  const dept = MOCK_ORG_DEPARTMENTS.find((d) => d.id === id)!;
  return { id: dept.id, name: dept.name };
};

// ─── Users (reuse MOCK_USERS ids/names/designations where they overlap) ───────

export const MOCK_ORG_USERS: OrgUser[] = [
  {
    id: MOCK_USERS.akumar.id,
    name: MOCK_USERS.akumar.name,
    initials: MOCK_USERS.akumar.initials,
    ...ADMIN_AVATAR_PALETTE,
    staffId: 'SVGOI-0002',
    email: 'a.kumar@svgoi.ac.in',
    phone: '+91 98200 11122',
    designation: MOCK_USERS.akumar.designation,
    role: 'ADMIN',
    departments: [deptRef('dept_01')],
    status: 'ACTIVE',
    createdAt: past(720),
  },
  {
    id: MOCK_USERS.rajan.id,
    name: MOCK_USERS.rajan.name,
    initials: MOCK_USERS.rajan.initials,
    avatarBg: EMPLOYEE_AVATAR_PALETTE[0]!.avatarBg,
    avatarText: EMPLOYEE_AVATAR_PALETTE[0]!.avatarText,
    staffId: 'SVGOI-0041',
    email: 'rajan.sharma@svgoi.ac.in',
    phone: '+91 98765 43210',
    designation: MOCK_USERS.rajan.designation,
    role: 'EMPLOYEE',
    departments: [deptRef('dept_01')],
    status: 'ACTIVE',
    createdAt: past(420),
  },
  {
    id: MOCK_USERS.priya.id,
    name: MOCK_USERS.priya.name,
    initials: MOCK_USERS.priya.initials,
    avatarBg: EMPLOYEE_AVATAR_PALETTE[1]!.avatarBg,
    avatarText: EMPLOYEE_AVATAR_PALETTE[1]!.avatarText,
    staffId: 'SVGOI-0133',
    email: 'priya.mehta@svgoi.ac.in',
    designation: MOCK_USERS.priya.designation,
    role: 'EMPLOYEE',
    departments: [deptRef('dept_01')],
    status: 'ACTIVE',
    createdAt: past(250),
  },
  {
    id: MOCK_USERS.sunil.id,
    name: MOCK_USERS.sunil.name,
    initials: MOCK_USERS.sunil.initials,
    ...ADMIN_AVATAR_PALETTE,
    staffId: 'SVGOI-0004',
    email: 's.verma@svgoi.ac.in',
    phone: '+91 90000 11223',
    designation: MOCK_USERS.sunil.designation,
    role: 'ADMIN',
    departments: [deptRef('dept_02')],
    status: 'ACTIVE',
    createdAt: past(610),
  },
  {
    id: MOCK_USERS.farhan.id,
    name: MOCK_USERS.farhan.name,
    initials: MOCK_USERS.farhan.initials,
    avatarBg: EMPLOYEE_AVATAR_PALETTE[2]!.avatarBg,
    avatarText: EMPLOYEE_AVATAR_PALETTE[2]!.avatarText,
    staffId: 'SVGOI-0151',
    email: 'farhan.khan@svgoi.ac.in',
    designation: MOCK_USERS.farhan.designation,
    role: 'EMPLOYEE',
    departments: [deptRef('dept_02')],
    status: 'ACTIVE',
    createdAt: past(140),
  },
  {
    id: MOCK_USERS.nisha.id,
    name: MOCK_USERS.nisha.name,
    initials: MOCK_USERS.nisha.initials,
    ...ADMIN_AVATAR_PALETTE,
    staffId: 'SVGOI-0005',
    email: 'nisha.patel@svgoi.ac.in',
    phone: '+91 91234 56789',
    designation: MOCK_USERS.nisha.designation,
    role: 'ADMIN',
    departments: [deptRef('dept_03')],
    status: 'ACTIVE',
    createdAt: past(560),
  },
  {
    id: MOCK_USERS.suresh.id,
    name: MOCK_USERS.suresh.name,
    initials: MOCK_USERS.suresh.initials,
    avatarBg: EMPLOYEE_AVATAR_PALETTE[3]!.avatarBg,
    avatarText: EMPLOYEE_AVATAR_PALETTE[3]!.avatarText,
    staffId: 'SVGOI-0342',
    email: 'suresh.verma@svgoi.ac.in',
    designation: MOCK_USERS.suresh.designation,
    role: 'EMPLOYEE',
    departments: [deptRef('dept_03')],
    status: 'SUSPENDED',
    createdAt: past(820),
  },
  {
    id: MOCK_USERS.rsingh.id,
    name: MOCK_USERS.rsingh.name,
    initials: MOCK_USERS.rsingh.initials,
    ...ADMIN_AVATAR_PALETTE,
    staffId: 'SVGOI-0006',
    email: 'r.singh@svgoi.ac.in',
    phone: '+91 99887 76655',
    designation: MOCK_USERS.rsingh.designation,
    role: 'ADMIN',
    departments: [deptRef('dept_05')],
    status: 'ACTIVE',
    createdAt: past(690),
  },
  {
    id: MOCK_USERS.anita.id,
    name: MOCK_USERS.anita.name,
    initials: MOCK_USERS.anita.initials,
    avatarBg: EMPLOYEE_AVATAR_PALETTE[4]!.avatarBg,
    avatarText: EMPLOYEE_AVATAR_PALETTE[4]!.avatarText,
    staffId: 'SVGOI-0231',
    email: 'anita.patel@svgoi.ac.in',
    phone: '+91 91234 22334',
    designation: MOCK_USERS.anita.designation,
    role: 'EMPLOYEE',
    departments: [deptRef('dept_05')],
    status: 'ACTIVE',
    createdAt: past(680),
  },
  {
    id: MOCK_USERS.meena.id,
    name: MOCK_USERS.meena.name,
    initials: MOCK_USERS.meena.initials,
    avatarBg: EMPLOYEE_AVATAR_PALETTE[0]!.avatarBg,
    avatarText: EMPLOYEE_AVATAR_PALETTE[0]!.avatarText,
    staffId: 'SVGOI-0244',
    email: 'meena.kulkarni@svgoi.ac.in',
    designation: MOCK_USERS.meena.designation,
    role: 'EMPLOYEE',
    departments: [deptRef('dept_05')],
    status: 'SUSPENDED',
    createdAt: past(180),
  },
  {
    id: MOCK_USERS.deepa.id,
    name: MOCK_USERS.deepa.name,
    initials: MOCK_USERS.deepa.initials,
    avatarBg: EMPLOYEE_AVATAR_PALETTE[2]!.avatarBg,
    avatarText: EMPLOYEE_AVATAR_PALETTE[2]!.avatarText,
    staffId: 'SVGOI-0287',
    email: 'deepa.nair@svgoi.ac.in',
    designation: MOCK_USERS.deepa.designation,
    role: 'EMPLOYEE',
    departments: [deptRef('dept_04')],
    status: 'ACTIVE',
    createdAt: past(90),
  },
  // Authored — no existing Academic Office head in MOCK_USERS.
  {
    id: 'org_usr_012',
    name: 'Meera Iyer',
    initials: 'MI',
    ...ADMIN_AVATAR_PALETTE,
    staffId: 'SVGOI-0012',
    email: 'meera.iyer@svgoi.ac.in',
    phone: '+91 90123 44556',
    designation: 'Head of Academic Office',
    role: 'ADMIN',
    departments: [deptRef('dept_04')],
    status: 'ACTIVE',
    createdAt: past(300),
  },
];

// ─── Derived security + activity seed data (deterministic, per user) ─────────

const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
const IP_POOL = ['10.4.2.9', '10.4.1.18', '10.4.3.44', '10.4.2.61', '10.4.5.12'];

export const MOCK_ORG_USER_SECURITY: Record<string, { lastActiveAt: string; lastActiveIp: string }> =
  Object.fromEntries(
    MOCK_ORG_USERS.map((u, i) => [
      u.id,
      {
        // Suspended accounts can't sign in — their last session predates suspension.
        lastActiveAt: u.status === 'SUSPENDED' ? past(9) : hoursAgo(1 + i * 3),
        lastActiveIp: IP_POOL[i % IP_POOL.length]!,
      },
    ])
  );

const activityEventId = (userId: string, idx: number) => `act_${userId}_${idx}`;

export const MOCK_ORG_USER_ACTIVITY: Record<string, OrgUserActivityEvent[]> = Object.fromEntries(
  MOCK_ORG_USERS.map((u) => {
    // Newest first — mirrors the immutable-ledger ordering used everywhere else.
    const events: OrgUserActivityEvent[] = [
      { id: activityEventId(u.id, 0), kind: 'ACCOUNT_CREATED', description: 'Account created', createdAt: u.createdAt },
    ];
    if (u.status === 'SUSPENDED') {
      events.unshift({
        id: activityEventId(u.id, 1),
        kind: 'SUSPENDED',
        description: `Suspended account · staff ID ${u.staffId}`,
        createdAt: past(6),
      });
    } else if (u.role === 'EMPLOYEE') {
      events.unshift({
        id: activityEventId(u.id, 1),
        kind: 'PASSWORD_RESET',
        description: 'Password reset link sent by Super Admin',
        createdAt: past(30),
      });
    }
    return [u.id, events];
  })
);
