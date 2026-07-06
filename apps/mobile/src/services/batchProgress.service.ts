/**
 * Batch / Group Progress — display-shape transform.
 *
 * A "batch" is what the Create Task flow produces when an Admin duplicates
 * one task to multiple people (FR-23) — N independent, single-assignee task
 * copies that share a `batchId`. GET /tasks/batch/:id (via `useBatchProgress`
 * → `tasksApi.getBatchSummary`) returns the real members (`RichTask[]`) plus
 * a `TaskBatch` header record; this file only reshapes that response into
 * the friendlier 5-bucket status taxonomy + per-member sub-labels the batch
 * screens render — no mock data.
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import type { RichTask, TaskPriority, BatchProgressSummary as ApiBatchProgressSummary } from '@godigitify/types';

dayjs.extend(relativeTime);

// ─── Display types ────────────────────────────────────────────────────────────

export type BatchMemberStatus = 'NOT_STARTED' | 'ACTIVE' | 'REVIEW' | 'DONE' | 'CANCELLED';

export type BatchMemberProgress = {
  task: RichTask;
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
  department: RichTask['department'];
  dueDate: string;
  isolationNote: string;
  totalMembers: number;
  doneCount: number;
  segments: BatchSegment[];
  members: BatchMemberProgress[];
  atRiskCount: number;
};

export type BatchSortBy = 'status' | 'name';

// ─── Status derivation ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BatchMemberStatus, { label: string; barColor: string }> = {
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

function deriveStatus(task: RichTask): BatchMemberStatus {
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

/**
 * `_count.attachments` is a total (references + proof combined) — RichTask's
 * list shape doesn't break that down further, and fetching each member's
 * attachments individually would be an N+1 call per batch. Close enough for
 * a roster sub-label; the member-copy screen (which fetches one task's real
 * attachments via useTaskAttachments) is the source of truth for proof count.
 */
function deriveSubLabel(
  task: RichTask,
  status: BatchMemberStatus,
  attachmentCount: number
): { subLabel: string; isAtRisk: boolean } {
  switch (status) {
    case 'REVIEW': {
      return {
        subLabel: `Submitted ${dayjs(task.updatedAt).fromNow()} · ${attachmentCount} file${attachmentCount === 1 ? '' : 's'}`,
        isAtRisk: false,
      };
    }
    case 'DONE': {
      const ts = task.completedAt ?? task.updatedAt;
      const onTime = task.completedAt ? dayjs(task.completedAt).isBefore(dayjs(task.dueDate)) : true;
      return { subLabel: `Approved ${dayjs(ts).fromNow()} · ${onTime ? 'on time' : 'late'}`, isAtRisk: false };
    }
    case 'ACTIVE': {
      if (attachmentCount === 0) {
        return { subLabel: 'Accepted · no upload yet', isAtRisk: true };
      }
      return { subLabel: `Accepted · ${attachmentCount} file${attachmentCount === 1 ? '' : 's'} uploaded`, isAtRisk: false };
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

function toMemberProgress(task: RichTask): BatchMemberProgress {
  const status = deriveStatus(task);
  const attachmentCount = task._count.attachments;
  const { subLabel, isAtRisk } = deriveSubLabel(task, status, attachmentCount);
  return {
    task,
    status,
    statusLabel: STATUS_CONFIG[status].label,
    subLabel,
    isAtRisk,
    proofCount: attachmentCount,
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

// ─── Transform: real API response → display shape ─────────────────────────────

export function toBatchDisplaySummary(raw: ApiBatchProgressSummary): BatchProgressSummary {
  const members = raw.members.map(toMemberProgress);
  const first = raw.members[0];

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
      percent: total > 0 ? (counts[status] / total) * 100 : 0,
      color: STATUS_CONFIG[status].barColor,
    }));

  return {
    batchId: raw.batch.id,
    title: raw.batch.title,
    priority: raw.batch.priority,
    department: first?.department ?? null,
    dueDate: raw.batch.dueDate,
    isolationNote: raw.batch.isolationNote ?? "Each copy is private — members can't see one another's tasks or proof.",
    totalMembers: total,
    doneCount: counts.DONE,
    segments,
    members,
    atRiskCount: members.filter((m) => m.isAtRisk).length,
  };
}
