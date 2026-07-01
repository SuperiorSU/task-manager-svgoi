/**
 * Team Management Service
 *
 * Mock implementation — replace each method body with real API calls.
 * Signatures are stable: UI never imports MOCK_* directly.
 */

import {
  MOCK_TEAM_MEMBERS,
  ADMIN_DEPT,
  type TeamMember,
  type CreateMemberPayload,
  type TeamMemberRole,
} from '../data/team.mock';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TeamFilter = 'ALL' | 'EMPLOYEES' | 'ADMINS' | 'SUSPENDED';

export type TeamListResult = {
  members: TeamMember[];
  activeCount: number;
  suspendedCount: number;
};

export type TeamStats = {
  activeCount: number;
  suspendedCount: number;
  totalCount: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// In-memory store to support suspend/reactivate/create during the session
let _members: TeamMember[] = [...MOCK_TEAM_MEMBERS];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function matchesSearch(member: TeamMember, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    member.name.toLowerCase().includes(q) ||
    member.employeeId.toLowerCase().includes(q) ||
    member.email.toLowerCase().includes(q) ||
    member.designation.toLowerCase().includes(q)
  );
}

function matchesFilter(member: TeamMember, filter: TeamFilter): boolean {
  switch (filter) {
    case 'ALL':       return true;
    case 'EMPLOYEES': return member.role === 'EMPLOYEE' && member.isActive;
    case 'ADMINS':    return member.role === 'ADMIN' && member.isActive;
    case 'SUSPENDED': return !member.isActive;
  }
}

// ─── Service methods ──────────────────────────────────────────────────────────

export const teamService = {
  /**
   * Fetch filtered + searched team list.
   * Admin: scoped to own department (ADMIN_DEPT).
   * SA: pass departmentId=undefined to get all members.
   */
  async getTeamList(
    filter: TeamFilter,
    search: string,
    departmentId?: string,
  ): Promise<TeamListResult> {
    await delay(400);

    const scoped = departmentId
      ? _members.filter((m) => m.department.id === departmentId)
      : _members;

    const members = scoped
      .filter((m) => matchesFilter(m, filter))
      .filter((m) => matchesSearch(m, search));

    const activeCount = scoped.filter((m) => m.isActive).length;
    const suspendedCount = scoped.filter((m) => !m.isActive).length;

    return { members, activeCount, suspendedCount };
  },

  /**
   * Fetch a single member by ID.
   * Returns null if not found or out of scope.
   */
  async getMemberById(id: string): Promise<TeamMember | null> {
    await delay(300);
    return _members.find((m) => m.id === id) ?? null;
  },

  /**
   * Suspend a member — logs them out immediately on real API.
   */
  async suspendMember(id: string): Promise<void> {
    await delay(600);
    _members = _members.map((m) =>
      m.id === id ? { ...m, isActive: false } : m,
    );
  },

  /**
   * Reactivate a suspended member.
   */
  async reactivateMember(id: string): Promise<void> {
    await delay(600);
    _members = _members.map((m) =>
      m.id === id ? { ...m, isActive: true } : m,
    );
  },

  /**
   * Trigger a password reset email.
   * Real API: revokes all sessions + sends 15-min reset link.
   */
  async resetPassword(id: string): Promise<void> {
    await delay(700);
    // Real: POST /users/:id/reset-password
  },

  /**
   * Create a new team member.
   * Admin: role locked to EMPLOYEE, department locked to own dept.
   */
  async createMember(payload: CreateMemberPayload): Promise<TeamMember> {
    await delay(800);

    const dept = ADMIN_DEPT; // Admin: always own dept
    const newMember: TeamMember = {
      id: `mbr_${Date.now()}`,
      name: payload.name,
      initials: payload.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join(''),
      avatarColor: '#1A5CF8',
      employeeId: payload.employeeId,
      email: payload.email,
      ...(payload.phone ? { phone: payload.phone } : {}),
      designation: payload.designation ?? '',
      role: payload.role,
      department: dept,
      isActive: true,
      joinedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      taskStats: { assigned: 0, completed: 0, overdue: 0, onTimeRate: 0 },
      recentTasks: [],
    };

    _members = [newMember, ..._members];
    return newMember;
  },

  /**
   * Update member profile fields.
   */
  async updateMember(
    id: string,
    fields: { name?: string; phone?: string; designation?: string },
  ): Promise<TeamMember> {
    await delay(600);
    _members = _members.map((m) =>
      m.id === id ? { ...m, ...fields } : m,
    );
    const updated = _members.find((m) => m.id === id);
    if (!updated) throw new Error('Member not found');
    return updated;
  },

  /** Validate employee ID uniqueness (real API: GET /users/check-id?id=X) */
  async isEmployeeIdTaken(employeeId: string): Promise<boolean> {
    await delay(200);
    return _members.some(
      (m) => m.employeeId.toLowerCase() === employeeId.toLowerCase(),
    );
  },
};
