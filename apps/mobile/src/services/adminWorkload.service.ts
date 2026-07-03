/**
 * Admin Workload & Task History Service — team capacity rollup and
 * per-member task history for the Admin's own department.
 *
 * Mock implementation. Replace method bodies with real API calls when the
 * backend is ready:
 *   GET /users?departmentId=&includeTaskLoad=1   → getTeamWorkload
 *   GET /users/:id?includeTaskLoad=1              → getMemberWorkload
 *   GET /users/:id/tasks?departmentId=            → getMemberTasks
 * Signatures are stable — UI never imports MOCK_* directly, only this
 * service or the hooks in useAdminWorkload.ts.
 */

import {
  MOCK_TASKS,
  MOCK_USERS,
  isTaskOverdue,
  type MockTask,
} from '../data/tasks.mock';
import { MOCK_TEAM_MEMBERS } from '../data/team.mock';
import {
  ADMIN_DEPT,
  WORKLOAD_CAPACITY_TARGET,
  tierForCapacityPercent,
  paletteForInitials,
  type WorkloadTier,
} from '../data/adminWorkload.mock';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkloadMember = {
  userId: string;
  name: string;
  initials: string;
  designation: string;
  avatarBg: string;
  avatarFg: string;
  activeCount: number;
  completedCount: number;
  overdueCount: number;
  capacityTarget: number;
  capacityPercent: number; // can exceed 100
  tier: WorkloadTier;
};

export type MemberWorkloadDetail = WorkloadMember & { departmentName: string };

export type TeamWorkloadBanner = {
  memberId: string;
  memberName: string;
  percent: number;
  suggestion: string;
};

export type TeamWorkloadOverview = {
  departmentName: string;
  memberCount: number;
  members: WorkloadMember[]; // sorted by capacity, high → low
  totals: {
    active: number;
    avgPerPerson: number;
    overloadedCount: number;
    freeCount: number;
  };
  banner: TeamWorkloadBanner | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeWorkloadMembers(): WorkloadMember[] {
  const deptTasks = MOCK_TASKS.filter((t) => t.department.id === ADMIN_DEPT.id);

  const byAssignee = new Map<string, MockTask[]>();
  for (const task of deptTasks) {
    const list = byAssignee.get(task.assignee.id);
    if (list) list.push(task);
    else byAssignee.set(task.assignee.id, [task]);
  }

  const users = Object.values(MOCK_USERS);
  const members: WorkloadMember[] = [];

  for (const [userId, tasks] of byAssignee) {
    const user = users.find((u) => u.id === userId);
    if (!user) continue;

    const active = tasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
    const completed = tasks.filter((t) => t.status === 'COMPLETED');
    const overdue = tasks.filter(isTaskOverdue);
    const capacityPercent = Math.round((active.length / WORKLOAD_CAPACITY_TARGET) * 100);
    const palette = paletteForInitials(user.initials);

    members.push({
      userId,
      name: user.name,
      initials: user.initials,
      designation: user.designation,
      avatarBg: palette.bg,
      avatarFg: palette.fg,
      activeCount: active.length,
      completedCount: completed.length,
      overdueCount: overdue.length,
      capacityTarget: WORKLOAD_CAPACITY_TARGET,
      capacityPercent,
      tier: tierForCapacityPercent(capacityPercent),
    });
  }

  return members.sort((a, b) => b.capacityPercent - a.capacityPercent);
}

function buildBanner(members: WorkloadMember[]): TeamWorkloadBanner | null {
  const overloaded = members.find((m) => m.tier === 'OVER');
  if (!overloaded) return null;

  const relief = members
    .filter((m) => m.userId !== overloaded.userId && (m.tier === 'FREE' || m.tier === 'BALANCED'))
    .sort((a, b) => a.capacityPercent - b.capacityPercent)
    .slice(0, 2)
    .map((m) => m.name.split(' ')[0]);

  const suggestion = relief.length
    ? `Consider reassigning tasks to ${relief.join(' or ')}.`
    : 'Consider redistributing tasks across the team.';

  return {
    memberId: overloaded.userId,
    memberName: overloaded.name,
    percent: overloaded.capacityPercent,
    suggestion,
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const adminWorkloadService = {
  async getTeamWorkload(): Promise<TeamWorkloadOverview> {
    await delay(300);
    const members = computeWorkloadMembers();
    const active = members.reduce((sum, m) => sum + m.activeCount, 0);
    const avgPerPerson = members.length ? Math.round((active / members.length) * 10) / 10 : 0;

    return {
      departmentName: ADMIN_DEPT.name,
      memberCount: members.length,
      members,
      totals: {
        active,
        avgPerPerson,
        overloadedCount: members.filter((m) => m.tier === 'OVER').length,
        freeCount: members.filter((m) => m.tier === 'FREE').length,
      },
      banner: buildBanner(members),
    };
  },

  async getMemberWorkload(userId: string): Promise<MemberWorkloadDetail> {
    await delay(250);
    const member = computeWorkloadMembers().find((m) => m.userId === userId);
    if (!member) throw new Error('Team member not found');
    return { ...member, departmentName: ADMIN_DEPT.name };
  },

  async getMemberTasks(userId: string): Promise<MockTask[]> {
    await delay(300);
    return MOCK_TASKS.filter(
      (t) => t.department.id === ADMIN_DEPT.id && t.assignee.id === userId,
    );
  },

  /**
   * Bridges into the separate Team/People mock roster (team.mock.ts, its
   * own `mbr_*` id space) so a workload member — sourced from
   * tasks.mock.ts's `usr_*` ids — can link to the existing Employee Profile
   * screen (`/(app)/people/:id`). Matches by name since the two mock
   * sources aren't id-linked; returns null (no link shown) when a member
   * has no corresponding people-directory record rather than guessing.
   */
  async resolveProfileId(memberName: string): Promise<string | null> {
    await delay(100);
    return MOCK_TEAM_MEMBERS.find((m) => m.name === memberName)?.id ?? null;
  },
};
