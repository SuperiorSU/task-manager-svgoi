/**
 * Admin Workload & Task History Service — team capacity rollup and
 * per-member task history for the Admin's own department.
 *
 * Real API: GET /dashboard/workload (dept-scoped server-side for ADMIN) for
 * per-employee assigned/completed/overdue counts, GET /users for designation/
 * avatar-source data, GET /tasks?assigneeId= for per-member history.
 */

import { usersApi, dashboardApi, tasksApi } from '@godigitify/api-client';
import type { RichTask } from '@godigitify/types';

import { useAuthStore } from '../stores/auth.store';
import { getInitials } from '../utils/initial';
import {
  WORKLOAD_CAPACITY_TARGET,
  tierForCapacityPercent,
  paletteForInitials,
  type WorkloadTier,
} from '../data/adminWorkload.mock';

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

async function computeTeamWorkload(): Promise<TeamWorkloadOverview> {
  const authUser = useAuthStore.getState().user;
  const departmentId = authUser?.departmentId ?? '';
  const departmentName = authUser?.department?.name ?? '';

  const [{ data: entries }, { data: usersRes }] = await Promise.all([
    dashboardApi.getWorkload(),
    usersApi.getList({ departmentId, role: 'EMPLOYEE', isActive: true, limit: 100 }),
  ]);

  const designationByUserId = new Map(usersRes.items.map((u) => [u.id, u.designation ?? '']));

  const members: WorkloadMember[] = entries
    .map((entry): WorkloadMember => {
      const initials = getInitials(entry.name);
      const palette = paletteForInitials(initials);
      // dashboard's `assigned` counts every non-cancelled task (including
      // completed ones) — "active" work in progress is assigned minus completed.
      const activeCount = Math.max(entry.assigned - entry.completed, 0);
      const capacityPercent = Math.round((activeCount / WORKLOAD_CAPACITY_TARGET) * 100);
      return {
        userId: entry.userId,
        name: entry.name,
        initials,
        designation: designationByUserId.get(entry.userId) ?? '',
        avatarBg: palette.bg,
        avatarFg: palette.fg,
        activeCount,
        completedCount: entry.completed,
        overdueCount: entry.overdue,
        capacityTarget: WORKLOAD_CAPACITY_TARGET,
        capacityPercent,
        tier: tierForCapacityPercent(capacityPercent),
      };
    })
    .sort((a, b) => b.capacityPercent - a.capacityPercent);

  const active = members.reduce((sum, m) => sum + m.activeCount, 0);
  const avgPerPerson = members.length ? Math.round((active / members.length) * 10) / 10 : 0;

  return {
    departmentName,
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
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const adminWorkloadService = {
  getTeamWorkload: computeTeamWorkload,

  async getMemberWorkload(userId: string): Promise<MemberWorkloadDetail> {
    const overview = await computeTeamWorkload();
    const member = overview.members.find((m) => m.userId === userId);
    if (!member) throw new Error('Team member not found');
    return { ...member, departmentName: overview.departmentName };
  },

  async getMemberTasks(userId: string): Promise<RichTask[]> {
    const authUser = useAuthStore.getState().user;
    const { data } = await tasksApi.getList({
      assigneeId: userId,
      ...(authUser?.departmentId ? { departmentId: authUser.departmentId } : {}),
      limit: 100, // backend's taskFiltersSchema caps limit at 100 — 200 fails AJV validation (400)
      sortBy: 'createdAt',
      order: 'desc',
    });
    return data;
  },
};
