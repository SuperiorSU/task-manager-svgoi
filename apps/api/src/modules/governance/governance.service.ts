import type { TaskStatus, TaskPriority, GovernanceStage } from '@godigitify/types';

import { prisma } from '../../config/database.js';
import { cache } from '../../config/redis.js';
import { writeAuditLog } from '../../utils/audit.utils.js';
import { tasksService } from '../tasks/tasks.service.js';

// Mirrors tasks.service.ts's taskSelect — kept local since that projection
// isn't exported from the tasks module.
const governanceTaskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  isRecurring: true,
  recurringConfig: true,
  parentTaskId: true,
  isDeleted: true,
  creatorId: true,
  assigneeId: true,
  departmentId: true,
  batchId: true,
  isGovernance: true,
  acceptedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  creator: { select: { id: true, name: true, avatarUrl: true } },
  assignee: { select: { id: true, name: true, avatarUrl: true } },
  department: { select: { id: true, name: true, code: true } },
  _count: { select: { comments: true, attachments: true } },
} as const;

type CreateGovernanceTaskInput = {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string;
  departmentId: string;
  creatorId: string;
};

type GovernanceFilters = {
  status?: TaskStatus;
  departmentId?: string;
  page?: number;
  limit?: number;
};

type StatusChangedActivity = {
  metadata: unknown;
  createdAt: Date;
};

type StageInfo = {
  stage: GovernanceStage;
  lastRevisionNote: string | null;
};

// Derives the governance rail stage + last revision note for a task from its
// status plus the STATUS_CHANGED activity history (most-recent-first).
const deriveStage = (status: TaskStatus, activities: StatusChangedActivity[]): StageInfo => {
  const latest = activities[0];
  const latestMeta = latest?.metadata as { to?: string; revisionNote?: string } | null | undefined;

  let stage: GovernanceStage;
  switch (status) {
    case 'PENDING':
    case 'ACCEPTED':
      stage = 'ASSIGNED';
      break;
    case 'IN_PROGRESS':
      stage =
        latestMeta?.to === 'IN_PROGRESS' && typeof latestMeta.revisionNote === 'string'
          ? 'REVISION_REQUESTED'
          : 'IN_PROGRESS';
      break;
    case 'UNDER_REVIEW':
      stage = 'SUBMITTED';
      break;
    case 'COMPLETED':
      stage = 'APPROVED';
      break;
    case 'CANCELLED':
    default:
      stage = 'ASSIGNED';
      break;
  }

  const withNote = activities.find(
    (a) => typeof (a.metadata as { revisionNote?: string } | null)?.revisionNote === 'string'
  );
  const lastRevisionNote =
    ((withNote?.metadata as { revisionNote?: string } | null)?.revisionNote as string | undefined) ?? null;

  return { stage, lastRevisionNote };
};

export const governanceService = {
  async create(input: CreateGovernanceTaskInput) {
    const task = await prisma.task.create({
      data: {
        title: input.title,
        ...(input.description !== undefined ? { description: input.description } : {}),
        priority: input.priority as never,
        dueDate: new Date(input.dueDate),
        assigneeId: input.assigneeId,
        creatorId: input.creatorId,
        departmentId: input.departmentId,
        isGovernance: true,
      },
      select: governanceTaskSelect,
    });

    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        actorId: input.creatorId,
        action: 'CREATE',
        description: `Governance task created and assigned to ${task.assignee.name}`,
      },
    });

    await writeAuditLog({
      action: 'CREATE',
      entityType: 'GovernanceTask',
      entityId: task.id,
      description: `Governance task "${task.title}" created`,
      actorId: input.creatorId,
    });

    await cache.delPattern('dashboard:stats:*');

    return { ...task, stage: 'ASSIGNED' as GovernanceStage, lastRevisionNote: null };
  },

  async getList(filters: GovernanceFilters) {
    const { page = 1, limit = 20, status, departmentId } = filters;

    const where: Record<string, unknown> = { isGovernance: true };
    if (status) where['status'] = status;
    if (departmentId) where['departmentId'] = departmentId;

    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where: where as never,
        select: governanceTaskSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where: where as never }),
    ]);

    const taskIds = tasks.map((t) => t.id);
    const activities = taskIds.length
      ? await prisma.taskActivity.findMany({
          where: { taskId: { in: taskIds }, action: 'STATUS_CHANGED' },
          orderBy: { createdAt: 'desc' },
          select: { taskId: true, metadata: true, createdAt: true },
        })
      : [];

    const activitiesByTask = new Map<string, StatusChangedActivity[]>();
    for (const activity of activities) {
      const list = activitiesByTask.get(activity.taskId) ?? [];
      list.push({ metadata: activity.metadata, createdAt: activity.createdAt });
      activitiesByTask.set(activity.taskId, list);
    }

    const items = tasks.map((task) => {
      const { stage, lastRevisionNote } = deriveStage(task.status as TaskStatus, activitiesByTask.get(task.id) ?? []);
      return { ...task, stage, lastRevisionNote };
    });

    return {
      tasks: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string) {
    const task = await prisma.task.findFirst({
      where: { id, isGovernance: true },
      select: governanceTaskSelect,
    });
    if (!task) {
      throw Object.assign(new Error('Governance task not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    const activities = await prisma.taskActivity.findMany({
      where: { taskId: id, action: 'STATUS_CHANGED' },
      orderBy: { createdAt: 'desc' },
      select: { metadata: true, createdAt: true },
    });

    const { stage, lastRevisionNote } = deriveStage(task.status as TaskStatus, activities);
    return { ...task, stage, lastRevisionNote };
  },

  async approve(id: string, actorId: string, actorRole: string) {
    const task = await prisma.task.findFirst({
      where: { id, isGovernance: true },
      select: { id: true, status: true },
    });
    if (!task) {
      throw Object.assign(new Error('Governance task not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }
    if (task.status !== 'UNDER_REVIEW') {
      throw Object.assign(
        new Error('Only tasks under review can be approved'),
        { statusCode: 409, code: 'INVALID_STATUS_TRANSITION' }
      );
    }

    const updated = await tasksService.updateStatus(id, 'COMPLETED', actorId, actorRole);

    await writeAuditLog({
      action: 'STATUS_CHANGED',
      entityType: 'GovernanceTask',
      entityId: id,
      description: `Governance task "${updated.title}" approved`,
      actorId,
    });

    await cache.delPattern('governance:list:*');

    return { ...updated, stage: 'APPROVED' as GovernanceStage, lastRevisionNote: null };
  },

  async requestRevision(id: string, note: string, actorId: string, actorRole: string) {
    const task = await prisma.task.findFirst({
      where: { id, isGovernance: true },
      select: { id: true, status: true },
    });
    if (!task) {
      throw Object.assign(new Error('Governance task not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }
    if (task.status !== 'UNDER_REVIEW') {
      throw Object.assign(
        new Error('Only tasks under review can be sent back for revision'),
        { statusCode: 409, code: 'INVALID_STATUS_TRANSITION' }
      );
    }

    const updated = await tasksService.updateStatus(id, 'IN_PROGRESS', actorId, actorRole, note);

    // updateStatus only writes {from, to} into the activity metadata — patch
    // the revision note onto the activity it just created so stage
    // derivation can pick it up.
    const activity = await prisma.taskActivity.findFirst({
      where: { taskId: id, action: 'STATUS_CHANGED' },
      orderBy: { createdAt: 'desc' },
    });
    if (activity) {
      const metadata = (activity.metadata as Record<string, unknown> | null) ?? {};
      await prisma.taskActivity.update({
        where: { id: activity.id },
        data: { metadata: { ...metadata, revisionNote: note } as never },
      });
    }

    await writeAuditLog({
      action: 'STATUS_CHANGED',
      entityType: 'GovernanceTask',
      entityId: id,
      description: `Governance task "${updated.title}" sent back for revision`,
      actorId,
      metadata: { revisionNote: note },
    });

    await cache.delPattern('governance:list:*');

    return { ...updated, stage: 'REVISION_REQUESTED' as GovernanceStage, lastRevisionNote: note };
  },
};
