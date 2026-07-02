/**
 * Super Admin Tasks (Oversight) Service — org-wide rollups, escalations,
 * governance task tracking, staff load & staff task drill-through.
 *
 * Mock implementation. Replace method bodies with real API calls when the
 * backend is ready:
 *   GET  /dashboard/org-stats?scope=tasks
 *   GET  /departments?includeTaskHealth=1
 *   GET  /departments/:id?includeTaskHealth=1
 *   GET  /tasks/escalations
 *   GET  /tasks?creatorId=me&scope=governance
 *   POST /tasks (governance)
 *   PATCH /tasks/:id/approve | /tasks/:id/revise
 *   GET  /users/:id/task-load
 *   GET  /users/:id/tasks
 * Signatures are stable — UI never imports MOCK_* directly, only this
 * service or the hooks in useSuperAdminTasks.ts.
 */

import dayjs from 'dayjs';

import type { TaskPriority } from '@godigitify/types';

import { type MockTask } from '../data/tasks.mock';
import {
  MOCK_DEPT_TASK_HEALTH,
  MOCK_ESCALATIONS,
  MOCK_GOVERNANCE_TASKS,
  MOCK_STAFF_LOAD,
  MOCK_STAFF_TASKS,
  MOCK_WEEKLY_THROUGHPUT,
  ESCALATION_TYPE_META,
  SA_SELF_USER,
  GOVERNANCE_ASSIGNABLE_ADMINS,
  type DeptTaskHealth,
  type StaffLoadSummary,
  type StatusDistribution,
  type WeeklyThroughputPoint,
} from '../data/superAdminTasks.mock';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrgTaskOverview = {
  activeCount: number;
  overdueCount: number;
  overduePercent: number;
  completedThisWeek: number;
  onTimeRate: number;
  statusDistribution: StatusDistribution;
  weeklyThroughput: WeeklyThroughputPoint[];
  departmentCount: number;
};

export type ResolvedEscalation = {
  id: string;
  typeLabel: string;
  badgeBg: string;
  badgeColor: string;
  barColor: string;
  departmentId: string;
  departmentName: string;
  headline: string;
  ownerId: string;
  ownerName: string;
  ownerInitials: string;
  ownerActioned: boolean;
  detectedAt: string;
};

export type GovernanceTaskGroup = {
  id: 'needs_approval' | 'in_progress' | 'awaiting_accept';
  label: string;
  count: number;
  tasks: MockTask[];
};

export type CreateGovernanceTaskPayload = {
  title: string;
  description: string;
  assigneeId: string;
  priority: TaskPriority;
  dueDate: string; // ISO
  requireProof: boolean;
  requireApproval: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sumDistribution(entries: { statusDistribution: StatusDistribution }[]): StatusDistribution {
  return entries.reduce<StatusDistribution>(
    (acc, e) => ({
      pending: acc.pending + e.statusDistribution.pending,
      inProgress: acc.inProgress + e.statusDistribution.inProgress,
      review: acc.review + e.statusDistribution.review,
      overdue: acc.overdue + e.statusDistribution.overdue,
    }),
    { pending: 0, inProgress: 0, review: 0, overdue: 0 },
  );
}

function weightedOnTimeRate(depts: DeptTaskHealth[]): number {
  const totalActive = depts.reduce((sum, d) => sum + d.activeCount, 0);
  if (!totalActive) return 0;
  const weighted = depts.reduce((sum, d) => sum + d.onTimeRate * d.activeCount, 0);
  return Math.round(weighted / totalActive);
}

function sortByRisk(depts: DeptTaskHealth[]): DeptTaskHealth[] {
  return [...depts].sort((a, b) => a.onTimeRate - b.onTimeRate);
}

function findDept(deptId: string): DeptTaskHealth {
  const dept = MOCK_DEPT_TASK_HEALTH.find((d) => d.departmentId === deptId);
  if (!dept) throw new Error('Department not found');
  return dept;
}

function findStaff(staffId: string): StaffLoadSummary {
  const staff = MOCK_STAFF_LOAD.find((s) => s.staffId === staffId);
  if (!staff) throw new Error('Staff member not found');
  return staff;
}

/** Farhan Khan's aggregate is derived live from his authored task records —
 * every other staff member's numbers are authored directly (see mock file). */
function hydrateStaffLoad(staff: StaffLoadSummary): StaffLoadSummary {
  const tasks = MOCK_STAFF_TASKS[staff.staffId];
  if (!tasks) return staff;

  const overdue = tasks.filter((t) => dayjs(t.dueDate).isBefore(dayjs()) && t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
  const distribution: StatusDistribution = { pending: 0, inProgress: 0, review: 0, overdue: overdue.length };
  for (const t of tasks) {
    if (overdue.includes(t)) continue;
    if (t.status === 'PENDING' || t.status === 'ACCEPTED') distribution.pending += 1;
    else if (t.status === 'IN_PROGRESS') distribution.inProgress += 1;
    else if (t.status === 'UNDER_REVIEW') distribution.review += 1;
  }

  return {
    ...staff,
    activeCount: tasks.length,
    overdueCount: overdue.length,
    statusDistribution: distribution,
  };
}

const ESCALATION_HEADLINE: Record<
  keyof typeof ESCALATION_TYPE_META,
  (deptName: string, count: number) => string
> = {
  OVERDUE_CLUSTER: (deptName, count) => `${deptName} · ${count} tasks overdue > 3 days`,
  REVIEW_STALLED: (deptName, count) => `${deptName} · ${count} submissions awaiting review > 48h`,
  PENDING_ACCEPT_STALLED: (deptName, count) => `${deptName} · ${count} tasks pending acceptance > 24h`,
};

const ESCALATION_COUNT_SOURCE: Record<keyof typeof ESCALATION_TYPE_META, keyof StatusDistribution> = {
  OVERDUE_CLUSTER: 'overdue',
  REVIEW_STALLED: 'review',
  PENDING_ACCEPT_STALLED: 'pending',
};

function resolveEscalation(entry: (typeof MOCK_ESCALATIONS)[number]): ResolvedEscalation {
  const dept = findDept(entry.departmentId);
  const meta = ESCALATION_TYPE_META[entry.type];
  const count = dept.statusDistribution[ESCALATION_COUNT_SOURCE[entry.type]];
  const owner = GOVERNANCE_ASSIGNABLE_ADMINS.find((a) => a.id === entry.ownerId);

  return {
    id: entry.id,
    typeLabel: meta.label,
    badgeBg: meta.badgeBg,
    badgeColor: meta.badgeColor,
    barColor: meta.barColor,
    departmentId: dept.departmentId,
    departmentName: dept.departmentName,
    headline: ESCALATION_HEADLINE[entry.type](dept.departmentName, count),
    ownerId: entry.ownerId,
    ownerName: owner?.name ?? dept.adminName,
    ownerInitials: owner?.initials ?? dept.adminInitials,
    ownerActioned: entry.ownerActioned,
    detectedAt: entry.detectedAt,
  };
}

function groupGovernanceTasks(tasks: MockTask[]): GovernanceTaskGroup[] {
  const needsApproval = tasks.filter((t) => t.status === 'UNDER_REVIEW');
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'ACCEPTED');
  const awaitingAccept = tasks.filter((t) => t.status === 'PENDING');

  const groups: GovernanceTaskGroup[] = [];
  if (needsApproval.length) {
    groups.push({ id: 'needs_approval', label: 'Needs your approval', count: needsApproval.length, tasks: needsApproval });
  }
  if (inProgress.length) {
    groups.push({ id: 'in_progress', label: 'In progress', count: inProgress.length, tasks: inProgress });
  }
  if (awaitingAccept.length) {
    groups.push({ id: 'awaiting_accept', label: 'Awaiting accept', count: awaitingAccept.length, tasks: awaitingAccept });
  }
  return groups;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const superAdminTasksService = {
  async getOrgOverview(): Promise<OrgTaskOverview> {
    await delay(300);

    const statusDistribution = sumDistribution(MOCK_DEPT_TASK_HEALTH);
    const activeCount = MOCK_DEPT_TASK_HEALTH.reduce((sum, d) => sum + d.activeCount, 0);
    const overdueCount = MOCK_DEPT_TASK_HEALTH.reduce((sum, d) => sum + d.overdueCount, 0);
    const completedThisWeek = MOCK_WEEKLY_THROUGHPUT.reduce((sum, p) => sum + p.completed, 0);

    return {
      activeCount,
      overdueCount,
      overduePercent: activeCount ? Math.round((overdueCount / activeCount) * 1000) / 10 : 0,
      completedThisWeek,
      onTimeRate: weightedOnTimeRate(MOCK_DEPT_TASK_HEALTH),
      statusDistribution,
      weeklyThroughput: MOCK_WEEKLY_THROUGHPUT,
      departmentCount: MOCK_DEPT_TASK_HEALTH.length,
    };
  },

  async getDepartmentHealth(): Promise<DeptTaskHealth[]> {
    await delay(300);
    return sortByRisk(MOCK_DEPT_TASK_HEALTH);
  },

  async getDepartmentDetail(deptId: string): Promise<{ dept: DeptTaskHealth; staffLoad: StaffLoadSummary[] }> {
    await delay(300);
    const dept = findDept(deptId);
    const staffLoad = MOCK_STAFF_LOAD.filter((s) => s.departmentId === deptId)
      .map(hydrateStaffLoad)
      .sort((a, b) => b.overdueCount - a.overdueCount || b.activeCount - a.activeCount);
    return { dept, staffLoad };
  },

  async getEscalations(): Promise<ResolvedEscalation[]> {
    await delay(300);
    return MOCK_ESCALATIONS.map(resolveEscalation);
  },

  async getGovernanceTaskGroups(): Promise<GovernanceTaskGroup[]> {
    await delay(300);
    return groupGovernanceTasks(MOCK_GOVERNANCE_TASKS);
  },

  async getGovernanceTask(taskId: string): Promise<MockTask> {
    await delay(200);
    const task = MOCK_GOVERNANCE_TASKS.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');
    return task;
  },

  async getAssignableAdmins() {
    await delay(150);
    return GOVERNANCE_ASSIGNABLE_ADMINS;
  },

  async createGovernanceTask(payload: CreateGovernanceTaskPayload): Promise<MockTask> {
    await delay(500);
    const assignee = GOVERNANCE_ASSIGNABLE_ADMINS.find((a) => a.id === payload.assigneeId);
    if (!assignee) throw new Error('Assignee not found');

    const task: MockTask = {
      id: `gov_${Date.now()}`,
      title: payload.title,
      description: payload.description,
      status: 'PENDING',
      priority: payload.priority,
      dueDate: payload.dueDate,
      createdAt: dayjs().toISOString(),
      isRecurring: false,
      progress: 0,
      department: assignee.departments[0] ?? { id: 'dept_00', name: 'Org-wide' },
      project: { id: 'proj_gov', name: 'Governance' },
      creator: SA_SELF_USER,
      assignee: { id: assignee.id, name: assignee.name, designation: assignee.designation, initials: assignee.initials },
      labels: ['Governance'],
      subtasks: [],
      attachments: [],
      activity: [
        {
          id: `act_${Date.now()}`,
          action: 'CREATE',
          description: 'You assigned this task',
          actor: SA_SELF_USER,
          createdAt: dayjs().toISOString(),
        },
      ],
      comments: [],
    };

    MOCK_GOVERNANCE_TASKS.unshift(task);
    return task;
  },

  async approveGovernanceTask(taskId: string): Promise<void> {
    await delay(700);
    const task = MOCK_GOVERNANCE_TASKS.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');
    if (task.status !== 'UNDER_REVIEW') throw new Error('Task is not under review');
    task.status = 'COMPLETED';
    task.completedAt = dayjs().toISOString();
    task.activity.push({
      id: `act_${Date.now()}`,
      action: 'STATUS_CHANGED',
      description: 'You approved and marked this task completed',
      actor: SA_SELF_USER,
      metadata: { from: 'UNDER_REVIEW', to: 'COMPLETED' },
      createdAt: dayjs().toISOString(),
    });
  },

  async requestGovernanceRevision(taskId: string, note: string): Promise<void> {
    await delay(700);
    const task = MOCK_GOVERNANCE_TASKS.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');
    if (task.status !== 'UNDER_REVIEW') throw new Error('Task is not under review');
    task.status = 'IN_PROGRESS';
    task.activity.push({
      id: `act_${Date.now()}`,
      action: 'STATUS_CHANGED',
      description: `You requested revision: ${note || 'Please review and resubmit'}`,
      actor: SA_SELF_USER,
      metadata: { from: 'UNDER_REVIEW', to: 'IN_PROGRESS' },
      createdAt: dayjs().toISOString(),
    });
  },

  async getStaffLoad(staffId: string): Promise<StaffLoadSummary> {
    await delay(300);
    return hydrateStaffLoad(findStaff(staffId));
  },

  async getStaffTasks(staffId: string): Promise<MockTask[]> {
    await delay(300);
    return MOCK_STAFF_TASKS[staffId] ?? [];
  },

  async getStaffTask(staffId: string, taskId: string): Promise<MockTask> {
    await delay(200);
    const task = (MOCK_STAFF_TASKS[staffId] ?? []).find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');
    return task;
  },
};
