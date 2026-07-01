/**
 * Org Directory Service — Super Admin "Create User & Department" module.
 *
 * Mock implementation — in-memory mutable store, mirroring team.service.ts's
 * pattern. Replace method bodies with real API calls when the backend is
 * ready:
 *   GET  /users?scope=org              → getUsers
 *   GET  /departments?includeStats=1   → getDepartments
 *   GET  /users?role=ADMIN             → getAdmins (head-of-department picker)
 *   GET  /departments (id,name only)   → getAllDepartmentRefs
 *   GET  /users/check-id?id=X          → isStaffIdTaken
 *   GET  /departments/check-code?code=X → isDeptCodeTaken
 *   POST /users                        → createUser
 *   POST /departments                  → createDepartment
 * Signatures are stable: UI never imports MOCK_* directly.
 */

import {
  MOCK_ORG_USERS,
  MOCK_ORG_DEPARTMENTS,
  ADMIN_AVATAR_PALETTE,
  EMPLOYEE_AVATAR_PALETTE,
  type OrgUser,
  type OrgDepartment,
  type CreateOrgUserPayload,
  type CreateOrgDepartmentPayload,
} from '../data/orgDirectory.mock';
import { superAdminDashboardService } from './superAdminDashboard.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrgUserFilter = 'ALL' | 'ADMINS' | 'EMPLOYEES' | 'SUSPENDED';

export type OrgUserListResult = {
  users: OrgUser[];
  total: number;
  admins: number;
  employees: number;
  suspended: number;
};

export type OrgDepartmentWithStats = OrgDepartment & {
  headName?: string;
  memberCount: number;
  completionRate: number;
};

export type OrgDepartmentListResult = {
  departments: OrgDepartmentWithStats[];
  total: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

let _users: OrgUser[] = [...MOCK_ORG_USERS];
let _departments: OrgDepartment[] = [...MOCK_ORG_DEPARTMENTS];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function matchesUserSearch(user: OrgUser, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    user.name.toLowerCase().includes(q) ||
    user.staffId.toLowerCase().includes(q) ||
    user.email.toLowerCase().includes(q)
  );
}

function matchesUserFilter(user: OrgUser, filter: OrgUserFilter): boolean {
  switch (filter) {
    case 'ALL': return true;
    case 'ADMINS': return user.role === 'ADMIN' && user.status === 'ACTIVE';
    case 'EMPLOYEES': return user.role === 'EMPLOYEE' && user.status === 'ACTIVE';
    case 'SUSPENDED': return user.status === 'SUSPENDED';
  }
}

const nextId = (prefix: string) => `${prefix}_${Date.now()}_${Math.round(Math.random() * 999)}`;

// ─── Service methods ──────────────────────────────────────────────────────────

export const orgDirectoryService = {
  /** Org-wide user list — filtered + searched. SA sees every department. */
  async getUsers(filter: OrgUserFilter, search: string): Promise<OrgUserListResult> {
    await delay(400);

    const users = _users
      .filter((u) => matchesUserFilter(u, filter))
      .filter((u) => matchesUserSearch(u, search));

    return {
      users,
      total: _users.length,
      admins: _users.filter((u) => u.role === 'ADMIN' && u.status === 'ACTIVE').length,
      employees: _users.filter((u) => u.role === 'EMPLOYEE' && u.status === 'ACTIVE').length,
      suspended: _users.filter((u) => u.status === 'SUSPENDED').length,
    };
  },

  /** Org-wide department list with head name, member count, completion %. */
  async getDepartments(search: string): Promise<OrgDepartmentListResult> {
    await delay(400);

    // Reuse the dashboard's live completion-rate computation — same numbers
    // everywhere in the app, never a second parallel formula.
    const comparison = await superAdminDashboardService.getDepartmentComparison();
    const completionByDept = new Map(comparison.map((c) => [c.departmentId, c.completionRate]));

    const q = search.toLowerCase();
    const departments = _departments
      .filter((d) => !q || d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q))
      .map((dept) => {
        const head = _users.find((u) => u.id === dept.headUserId);
        return {
          ...dept,
          ...(head ? { headName: head.name } : {}),
          memberCount: _users.filter((u) => u.departments.some((d) => d.id === dept.id)).length,
          completionRate: completionByDept.get(dept.id) ?? 0,
        };
      });

    return { departments, total: _departments.length };
  },

  /** Active admins — candidates for the "Department head" picker. */
  async getAdmins(): Promise<OrgUser[]> {
    await delay(200);
    return _users.filter((u) => u.role === 'ADMIN' && u.status === 'ACTIVE');
  },

  /** Lightweight department refs for the "Departments managed" / department pickers. */
  async getAllDepartmentRefs(): Promise<{ id: string; name: string }[]> {
    await delay(150);
    return _departments.map((d) => ({ id: d.id, name: d.name }));
  },

  /** Validate staff ID uniqueness (real API: GET /users/check-id?id=X). */
  async isStaffIdTaken(staffId: string): Promise<boolean> {
    await delay(200);
    return _users.some((u) => u.staffId.toLowerCase() === staffId.toLowerCase());
  },

  /** Validate department code uniqueness (real API: GET /departments/check-code?code=X). */
  async isDeptCodeTaken(code: string): Promise<boolean> {
    await delay(200);
    return _departments.some((d) => d.code.toLowerCase() === code.toLowerCase());
  },

  /** Create a user — SA can choose either role and assign any department(s). */
  async createUser(payload: CreateOrgUserPayload): Promise<OrgUser> {
    await delay(800);

    const departments = _departments
      .filter((d) => payload.departmentIds.includes(d.id))
      .map((d) => ({ id: d.id, name: d.name }));

    const palette =
      payload.role === 'ADMIN'
        ? ADMIN_AVATAR_PALETTE
        : EMPLOYEE_AVATAR_PALETTE[_users.length % EMPLOYEE_AVATAR_PALETTE.length]!;

    const newUser: OrgUser = {
      id: nextId('org_usr'),
      name: payload.name,
      initials: payload.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join(''),
      avatarBg: palette.avatarBg,
      avatarText: palette.avatarText,
      staffId: payload.staffId,
      email: payload.email,
      ...(payload.phone ? { phone: payload.phone } : {}),
      designation: payload.designation ?? '',
      role: payload.role,
      departments,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    _users = [newUser, ..._users];
    return newUser;
  },

  /** Create a department — seeds identity, head and defaults. */
  async createDepartment(payload: CreateOrgDepartmentPayload): Promise<OrgDepartment> {
    await delay(800);

    const newDept: OrgDepartment = {
      id: nextId('org_dept'),
      name: payload.name,
      code: payload.code.toUpperCase(),
      ...(payload.headUserId ? { headUserId: payload.headUserId } : {}),
      workingDays: payload.workingDays,
      workingHours: payload.workingHours,
      weeklyHoliday: payload.weeklyHoliday,
      defaultPriority: payload.defaultPriority,
      defaultDueWindowDays: payload.defaultDueWindowDays,
      createdInSession: true,
    };

    _departments = [newDept, ..._departments];
    return newDept;
  },
};
