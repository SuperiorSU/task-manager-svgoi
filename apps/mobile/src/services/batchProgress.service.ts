/**
 * Batch / Group Progress Service
 *
 * A "batch" is what the Create Task flow produces when an Admin duplicates
 * one task to multiple people (FR-23) — N independent, single-assignee task
 * copies that share a `batchId`. Nothing here introduces a new multi-assignee
 * task model; it purely aggregates existing MockTask records for reporting.
 *
 * Mock implementation — swap the body of each method for real API calls
 * (e.g. GET /tasks?batchId=… ) when the backend is ready. Signatures mirror
 * what the production API client will expose.
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import type { TaskPriority } from '@godigitify/types';
import { MOCK_TASKS, type MockTask, type MockDepartment } from '../data/tasks.mock';
import { adminTasksService } from './adminTasks.service';

dayjs.extend(relativeTime);

// ─── Types ────────────────────────────────────────────────────────────────────

export type BatchMemberStatus = 'NOT_STARTED' | 'ACTIVE' | 'REVIEW' | 'DONE' | 'CANCELLED';

export type BatchMemberProgress = {
  task: MockTask;
  status: BatchMemberStatus;
  statusLabel: string;
  subLabel: string;
  isAtRisk: boolean;
  proofCount: number;
};

export type BatchSegment = {
  status: BatchMemberStatus;
  label: string;
  count: number;
  percent: number;
  color: string;
};

export type BatchProgressSummary = {
  batchId: string;
  title: string;
  priority: TaskPriority;
  department: MockDepartment;
  dueDate: string;
  isolationNote: string;
  totalMembers: number;
  doneCount: number;
  segments: BatchSegment[];
  members: BatchMemberProgress[];
  atRiskCount: number;
};

export type BatchSortBy = 'status' | 'name';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Status derivation ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  BatchMemberStatus,
  { label: string; barColor: string }
> = {
  REVIEW:      { label: 'REVIEW',   barColor: '#7C3AED' },
  DONE:        { label: 'DONE',     barColor: '#16A34A' },
  ACTIVE:      { label: 'ACTIVE',   barColor: '#F59E0B' },
  NOT_STARTED: { label: 'TO DO',    barColor: '#CBD5E1' },
  CANCELLED:   { label: 'CANCELLED', barColor: '#94A3B8' },
};

// Priority used when sorting the roster by "Status" — needs-decision first.
const STATUS_SORT_ORDER: Record<BatchMemberStatus, number> = {
  REVIEW: 0,
  ACTIVE: 1,
  NOT_STARTED: 2,
  DONE: 3,
  CANCELLED: 4,
};

function deriveStatus(task: MockTask): BatchMemberStatus {
  switch (task.status) {
    case 'UNDER_REVIEW': return 'REVIEW';
    case 'COMPLETED': return 'DONE';
    case 'IN_PROGRESS':
    case 'ACCEPTED': return 'ACTIVE';
    case 'CANCELLED': return 'CANCELLED';
    case 'PENDING':
    default: return 'NOT_STARTED';
  }
}

function deriveSubLabel(task: MockTask, status: BatchMemberStatus, proofCount: number): { subLabel: string; isAtRisk: boolean } {
  switch (status) {
    case 'REVIEW': {
      const lastActivity = task.activity[task.activity.length - 1];
      const ts = lastActivity?.createdAt ?? task.createdAt;
      return { subLabel: `Submitted ${dayjs(ts).fromNow()} · ${proofCount} file${proofCount === 1 ? '' : 's'}`, isAtRisk: false };
    }
    case 'DONE': {
      const ts = task.completedAt ?? task.createdAt;
      const onTime = task.completedAt ? dayjs(task.completedAt).isBefore(dayjs(task.dueDate)) : true;
      return { subLabel: `Approved ${dayjs(ts).fromNow()} · ${onTime ? 'on time' : 'late'}`, isAtRisk: false };
    }
    case 'ACTIVE': {
      if (proofCount === 0) {
        return { subLabel: 'Accepted · no upload yet', isAtRisk: true };
      }
      return { subLabel: `Accepted · ${proofCount} file${proofCount === 1 ? '' : 's'} uploaded`, isAtRisk: false };
    }
    case 'NOT_STARTED': {
      const idleDays = dayjs().diff(dayjs(task.createdAt), 'day');
      if (idleDays >= 1) {
        return { subLabel: `Not opened · ${idleDays} day${idleDays === 1 ? '' : 's'} idle`, isAtRisk: true };
      }
      return { subLabel: 'Not started yet', isAtRisk: false };
    }
    case 'CANCELLED':
    default:
      return { subLabel: 'Cancelled', isAtRisk: false };
  }
}

function toMemberProgress(task: MockTask): BatchMemberProgress {
  const status = deriveStatus(task);
  const proofCount = task.attachments.filter((a) => a.isProof).length;
  const { subLabel, isAtRisk } = deriveSubLabel(task, status, proofCount);
  return {
    task,
    status,
    statusLabel: STATUS_CONFIG[status].label,
    subLabel,
    isAtRisk,
    proofCount,
  };
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

export function sortBatchMembers(members: BatchMemberProgress[], sortBy: BatchSortBy): BatchMemberProgress[] {
  const sorted = [...members];
  if (sortBy === 'name') {
    sorted.sort((a, b) => a.task.assignee.name.localeCompare(b.task.assignee.name));
  } else {
    sorted.sort((a, b) => STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status]);
  }
  return sorted;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const batchProgressService = {
  /**
   * Helper: does this task belong to a duplicated batch? Returns the
   * batchId if so — used by the task detail screen to surface a
   * "View batch progress" entry point.
   */
  getBatchIdForTask(taskId: string): string | undefined {
    return MOCK_TASKS.find((t) => t.id === taskId)?.batchId;
  },

  /**
   * GET /tasks/batch/:batchId
   * Aggregates every member copy that shares a batchId into a single
   * progress summary (overall completion + per-member roster).
   */
  async getBatchSummary(batchId: string): Promise<BatchProgressSummary | null> {
    await delay(400);
    const tasks = MOCK_TASKS.filter((t) => t.batchId === batchId);
    if (tasks.length === 0) return null;

    const first = tasks[0]!;
    const members = tasks.map(toMemberProgress);

    const counts: Record<BatchMemberStatus, number> = {
      REVIEW: 0, DONE: 0, ACTIVE: 0, NOT_STARTED: 0, CANCELLED: 0,
    };
    members.forEach((m) => { counts[m.status] += 1; });

    const total = members.length;
    const segments: BatchSegment[] = (['DONE', 'REVIEW', 'ACTIVE', 'NOT_STARTED', 'CANCELLED'] as const)
      .filter((status) => counts[status] > 0)
      .map((status) => ({
        status,
        label: STATUS_CONFIG[status].label,
        count: counts[status],
        percent: (counts[status] / total) * 100,
        color: STATUS_CONFIG[status].barColor,
      }));

    return {
      batchId,
      title: first.title,
      priority: first.priority,
      department: first.department,
      dueDate: first.dueDate,
      isolationNote: "Each copy is private — members can't see one another's tasks or proof.",
      totalMembers: total,
      doneCount: counts.DONE,
      segments,
      members,
      atRiskCount: members.filter((m) => m.isAtRisk).length,
    };
  },

  /**
   * POST /tasks/batch/:batchId/nudge
   * Sends a reminder push notification to every member behind schedule.
   * Mock: writes a TaskActivity entry to each at-risk member's task.
   */
  async nudgeStragglers(batchId: string): Promise<{ notifiedCount: number }> {
    await delay(600);
    const tasks = MOCK_TASKS.filter((t) => t.batchId === batchId);
    const members = tasks.map(toMemberProgress).filter((m) => m.isAtRisk);

    members.forEach((m) => {
      m.task.activity.push({
        id: `act_${Date.now()}_${m.task.id}`,
        action: 'UPDATE',
        description: 'Reminder sent by admin — please update your progress',
        actor: m.task.creator,
        createdAt: dayjs().toISOString(),
      });
    });

    return { notifiedCount: members.length };
  },

  /**
   * Approve / request revision on one member's copy — delegates to the
   * same admin task service used for single-assignee review, since a
   * batch member's task is a normal MockTask under the hood.
   */
  approveMember: (taskId: string) => adminTasksService.approveTask(taskId),
  requestMemberRevision: (taskId: string, note: string) => adminTasksService.requestRevision(taskId, note),
};
