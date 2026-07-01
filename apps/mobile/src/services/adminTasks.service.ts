/**
 * Admin Task Operations Service
 *
 * Mock implementation — swap body of each method for real API calls.
 * Signatures are identical to what the production API client will expose.
 */

import dayjs from 'dayjs';
import {
  MOCK_TASKS,
  MOCK_USERS,
  isTaskOverdue,
  type MockTask,
} from '../data/tasks.mock';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdminTaskScope = 'managed' | 'assigned';

export type AdminTaskFilter = 'ALL' | 'TO_REVIEW' | 'CROSS_DEPT' | 'OVERDUE';

export type AdminTaskGroup = {
  id: string;
  label: string;
  count: number;
  tasks: MockTask[];
  accentColor: string;
};

export type AdminTaskStats = {
  total: number;
  toReview: number;
  crossDept: number;
  overdue: number;
  assignedToMe: number;
};

export type RevisionNote = {
  note: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ADMIN_DEPT_ID = 'dept_01';
const ADMIN_CREATOR_ID = MOCK_USERS.akumar.id;

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getManagedTasks(): MockTask[] {
  return MOCK_TASKS.filter(
    (t) =>
      t.department.id === ADMIN_DEPT_ID ||
      t.creator.id === ADMIN_CREATOR_ID,
  );
}

function getAssignedToMeTasks(): MockTask[] {
  return MOCK_TASKS.filter(
    (t) => t.assignee.id === ADMIN_CREATOR_ID && t.creator.id !== ADMIN_CREATOR_ID,
  );
}

function applyFilter(tasks: MockTask[], filter: AdminTaskFilter, search: string): MockTask[] {
  let result = tasks;

  switch (filter) {
    case 'TO_REVIEW':
      result = result.filter((t) => t.status === 'UNDER_REVIEW');
      break;
    case 'CROSS_DEPT':
      result = result.filter(
        (t) => t.creator.id === ADMIN_CREATOR_ID && t.department.id !== ADMIN_DEPT_ID,
      );
      break;
    case 'OVERDUE':
      result = result.filter(isTaskOverdue);
      break;
    default:
      break;
  }

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.assignee.name.toLowerCase().includes(q) ||
        t.department.name.toLowerCase().includes(q),
    );
  }

  return result;
}

function groupTasks(tasks: MockTask[]): AdminTaskGroup[] {
  const reviewTasks = tasks.filter((t) => t.status === 'UNDER_REVIEW');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const pendingTasks = tasks.filter(
    (t) => t.status === 'PENDING' || t.status === 'ACCEPTED',
  );
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const cancelledTasks = tasks.filter((t) => t.status === 'CANCELLED');

  const groups: AdminTaskGroup[] = [];

  if (reviewTasks.length > 0) {
    groups.push({
      id: 'review',
      label: 'Needs your review',
      count: reviewTasks.length,
      tasks: reviewTasks,
      accentColor: '#7C3AED',
    });
  }
  if (inProgressTasks.length > 0) {
    groups.push({
      id: 'in_progress',
      label: 'In progress',
      count: inProgressTasks.length,
      tasks: inProgressTasks,
      accentColor: '#94A3B8',
    });
  }
  if (pendingTasks.length > 0) {
    groups.push({
      id: 'pending',
      label: 'Pending',
      count: pendingTasks.length,
      tasks: pendingTasks,
      accentColor: '#94A3B8',
    });
  }
  if (completedTasks.length > 0) {
    groups.push({
      id: 'completed',
      label: 'Completed',
      count: completedTasks.length,
      tasks: completedTasks,
      accentColor: '#22C55E',
    });
  }
  if (cancelledTasks.length > 0) {
    groups.push({
      id: 'cancelled',
      label: 'Cancelled',
      count: cancelledTasks.length,
      tasks: cancelledTasks,
      accentColor: '#94A3B8',
    });
  }

  return groups;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const adminTasksService = {
  /**
   * GET /tasks?scope=managed&filter=…&search=…
   * Returns grouped task list for the admin task screen.
   */
  getGroupedTasks: async (
    scope: AdminTaskScope,
    filter: AdminTaskFilter,
    search: string,
  ): Promise<AdminTaskGroup[]> => {
    await delay(350);
    const baseTasks = scope === 'managed' ? getManagedTasks() : getAssignedToMeTasks();
    const filtered = applyFilter(baseTasks, filter, search);
    return groupTasks(filtered);
  },

  /**
   * GET /admin/tasks/stats
   * Returns badge counts for filter chips.
   */
  getTaskStats: async (): Promise<AdminTaskStats> => {
    await delay(150);
    const managed = getManagedTasks();
    const assignedToMe = getAssignedToMeTasks();
    return {
      total: managed.length,
      toReview: managed.filter((t) => t.status === 'UNDER_REVIEW').length,
      crossDept: managed.filter(
        (t) => t.creator.id === ADMIN_CREATOR_ID && t.department.id !== ADMIN_DEPT_ID,
      ).length,
      overdue: managed.filter(isTaskOverdue).length,
      assignedToMe: assignedToMe.length,
    };
  },

  /**
   * PATCH /tasks/:id/approve
   * Approves a task (UNDER_REVIEW → COMPLETED).
   * Only the task creator (Admin/SA) can call this.
   */
  approveTask: async (taskId: string): Promise<void> => {
    await delay(700);
    const task = MOCK_TASKS.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');
    if (task.status !== 'UNDER_REVIEW') throw new Error('Task is not under review');
    // In mock: mutate in-place so UI can reflect the change
    task.status = 'COMPLETED';
    task.activity.push({
      id: `act_${Date.now()}`,
      action: 'STATUS_CHANGED',
      description: 'Task approved and marked as completed',
      actor: MOCK_USERS.akumar,
      metadata: { from: 'UNDER_REVIEW', to: 'COMPLETED' },
      createdAt: dayjs().toISOString(),
    });
  },

  /**
   * PATCH /tasks/:id/revise
   * Requests revision (UNDER_REVIEW → IN_PROGRESS).
   * Only the task creator can call this.
   */
  requestRevision: async (taskId: string, note: string): Promise<void> => {
    await delay(700);
    const task = MOCK_TASKS.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');
    if (task.status !== 'UNDER_REVIEW') throw new Error('Task is not under review');
    task.status = 'IN_PROGRESS';
    task.activity.push({
      id: `act_${Date.now()}`,
      action: 'STATUS_CHANGED',
      description: `Revision requested: ${note || 'Please review and resubmit'}`,
      actor: MOCK_USERS.akumar,
      metadata: { from: 'UNDER_REVIEW', to: 'IN_PROGRESS' },
      createdAt: dayjs().toISOString(),
    });
  },

  /**
   * PATCH /tasks/:id/cancel
   * Cancels a task. Creator or SA only.
   */
  cancelTask: async (taskId: string): Promise<void> => {
    await delay(600);
    const task = MOCK_TASKS.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');
    if (['COMPLETED', 'CANCELLED'].includes(task.status)) {
      throw new Error('Cannot cancel a completed or already-cancelled task');
    }
    task.status = 'CANCELLED';
    task.activity.push({
      id: `act_${Date.now()}`,
      action: 'STATUS_CHANGED',
      description: 'Task cancelled by admin',
      actor: MOCK_USERS.akumar,
      metadata: { from: task.status, to: 'CANCELLED' },
      createdAt: dayjs().toISOString(),
    });
  },

  /**
   * Helper: is the current admin the creator of a task?
   * Used by task detail to decide which action bar to render.
   */
  isAdminCreator: (task: MockTask): boolean => {
    return task.creator.id === ADMIN_CREATOR_ID;
  },

  /**
   * Helper: is this task cross-departmental from the admin's perspective?
   * True when admin created the task for a department other than their own.
   */
  isCrossDept: (task: MockTask): boolean => {
    return task.creator.id === ADMIN_CREATOR_ID && task.department.id !== ADMIN_DEPT_ID;
  },
};
