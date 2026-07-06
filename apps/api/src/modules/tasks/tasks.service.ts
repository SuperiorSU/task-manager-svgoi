import type { TaskStatus, TaskPriority, CreateTaskBatchDto, BatchProgressSegment } from '@godigitify/types';

import { prisma } from '../../config/database.js';
import { cache } from '../../config/redis.js';
import { writeAuditLog } from '../../utils/audit.utils.js';
import { notifyUsers } from '../notifications/notifications.service.js';

const invalidateDashboardCaches = async (): Promise<void> => {
  await Promise.all([
    cache.delPattern('dashboard:stats:*'),
    cache.delPattern('dashboard:dept-health:*'),
    cache.delPattern('dashboard:staff-load:*'),
    cache.delPattern('dashboard:escalations:*'),
    cache.delPattern('dashboard:calendar:*'),
  ]);
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Not started',
  ACCEPTED: 'Not started',
  IN_PROGRESS: 'In progress',
  UNDER_REVIEW: 'Under review',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['COMPLETED', 'IN_PROGRESS'],
  COMPLETED: [],
  CANCELLED: [],
};

// Who gets notified for a status transition, and with what type/copy.
// The assignee acts on PENDING/ACCEPTED/IN_PROGRESS/UNDER_REVIEW transitions
// (creator is notified); the creator acts on COMPLETED/CANCELLED/revision
// (assignee is notified) — see 8_overview.md §2 status-transition matrix.
const resolveStatusChangeNotification = (
  prevStatus: TaskStatus,
  newStatus: TaskStatus,
  task: { assigneeId: string; creatorId: string }
): { recipientId: string; type: 'TASK_STATUS_CHANGED' | 'TASK_COMPLETED'; statusLabel: string } => {
  if (newStatus === 'COMPLETED') {
    return { recipientId: task.assigneeId, type: 'TASK_COMPLETED', statusLabel: 'completed' };
  }
  if (newStatus === 'CANCELLED') {
    return { recipientId: task.assigneeId, type: 'TASK_STATUS_CHANGED', statusLabel: 'cancelled' };
  }
  if (newStatus === 'IN_PROGRESS' && prevStatus === 'UNDER_REVIEW') {
    return { recipientId: task.assigneeId, type: 'TASK_STATUS_CHANGED', statusLabel: 'sent back for revision' };
  }
  if (newStatus === 'UNDER_REVIEW') {
    return { recipientId: task.creatorId, type: 'TASK_STATUS_CHANGED', statusLabel: 'submitted for review' };
  }
  return { recipientId: task.creatorId, type: 'TASK_STATUS_CHANGED', statusLabel: STATUS_LABELS[newStatus].toLowerCase() };
};

const taskSelect = {
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

type CreateTaskInput = {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string;
  departmentId?: string;
  isRecurring?: boolean;
  recurringConfig?: unknown;
  creatorId: string;
};

type TaskFilters = {
  status?: TaskStatus;
  priority?: TaskPriority;
  departmentId?: string;
  assigneeId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  dueAfter?: string;
  dueBefore?: string;
  viewerRole?: string;
  viewerDeptId?: string;
  viewerId?: string;
};

const ALLOWED_SORT = ['dueDate', 'priority', 'createdAt', 'title'] as const;
type AllowedSort = (typeof ALLOWED_SORT)[number];

export const tasksService = {
  async getList(filters: TaskFilters) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'dueDate',
      order = 'asc',
      viewerRole,
      viewerDeptId,
      viewerId,
      ...rest
    } = filters;

    const safeSortBy: AllowedSort = ALLOWED_SORT.includes(sortBy as AllowedSort)
      ? (sortBy as AllowedSort)
      : 'dueDate';

    const where: Record<string, unknown> = { isDeleted: false };
    // Scope and search both need an OR clause — combine them under AND so
    // neither silently clobbers the other.
    const andConditions: Record<string, unknown>[] = [];

    if (viewerRole === 'EMPLOYEE') {
      where['assigneeId'] = viewerId;
    } else if (viewerRole === 'ADMIN' && viewerDeptId) {
      // Admin sees their own department's tasks, tasks they created for other
      // departments (cross-dept assignment), and tasks assigned TO them by
      // another Admin/SA regardless of department — per 8_overview.md §2/§4.3.
      andConditions.push({
        OR: [{ departmentId: viewerDeptId }, { creatorId: viewerId }, { assigneeId: viewerId }],
      });
    }

    if (rest.status) where['status'] = rest.status;
    if (rest.priority) where['priority'] = rest.priority;
    if (rest.departmentId && viewerRole === 'SUPER_ADMIN') where['departmentId'] = rest.departmentId;
    if (rest.assigneeId && viewerRole !== 'EMPLOYEE') where['assigneeId'] = rest.assigneeId;
    if (rest.search) {
      andConditions.push({
        OR: [
          { title: { contains: rest.search, mode: 'insensitive' } },
          { description: { contains: rest.search, mode: 'insensitive' } },
        ],
      });
    }
    if (rest.dueAfter || rest.dueBefore) {
      const dueDateFilter: Record<string, Date> = {};
      if (rest.dueAfter) dueDateFilter['gte'] = new Date(rest.dueAfter);
      if (rest.dueBefore) dueDateFilter['lte'] = new Date(rest.dueBefore);
      where['dueDate'] = dueDateFilter;
    }
    if (andConditions.length > 0) where['AND'] = andConditions;

    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where: where as never,
        select: taskSelect,
        orderBy: { [safeSortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where: where as never }),
    ]);

    return {
      tasks,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string, viewerId: string, viewerRole: string, viewerDeptId?: string) {
    const task = await prisma.task.findFirst({
      where: {
        id,
        isDeleted: false,
        ...(viewerRole === 'EMPLOYEE'
          ? { assigneeId: viewerId }
          : viewerRole === 'ADMIN' && viewerDeptId
          ? { OR: [{ departmentId: viewerDeptId }, { creatorId: viewerId }, { assigneeId: viewerId }] }
          : {}),
      },
      select: taskSelect,
    });
    if (!task) throw Object.assign(new Error('Task not found'), { statusCode: 404, code: 'NOT_FOUND' });
    return task;
  },

  async create(input: CreateTaskInput) {
    const task = await prisma.task.create({
      data: {
        title: input.title,
        ...(input.description !== undefined ? { description: input.description } : {}),
        priority: input.priority as never,
        dueDate: new Date(input.dueDate),
        assigneeId: input.assigneeId,
        creatorId: input.creatorId,
        ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
        isRecurring: input.isRecurring ?? false,
        ...(input.recurringConfig !== undefined ? { recurringConfig: input.recurringConfig as never } : {}),
      },
      select: taskSelect,
    });

    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        actorId: input.creatorId,
        action: 'CREATE',
        description: `Task created and assigned to ${task.assignee.name}`,
      },
    });

    await writeAuditLog({
      action: 'CREATE',
      entityType: 'Task',
      entityId: task.id,
      description: `Task "${task.title}" created`,
      actorId: input.creatorId,
    });

    // Invalidate dashboard cache
    await invalidateDashboardCaches();

    await notifyUsers({
      type: 'TASK_ASSIGNED',
      recipientIds: [task.assigneeId],
      actorId: input.creatorId,
      actorName: task.creator.name,
      taskId: task.id,
      taskTitle: task.title,
      pushPriority: 'high',
    });

    return task;
  },

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      priority?: string;
      dueDate?: string;
      assigneeId?: string;
      departmentId?: string;
    },
    actorId: string,
    actorRole: string,
    actorDeptId?: string
  ) {
    const task = await prisma.task.findFirst({
      where: {
        id,
        isDeleted: false,
        ...(actorRole === 'ADMIN' && actorDeptId ? { departmentId: actorDeptId } : {}),
      },
      select: { id: true, title: true },
    });
    if (!task) throw Object.assign(new Error('Task not found'), { statusCode: 404, code: 'NOT_FOUND' });

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.priority !== undefined ? { priority: data.priority as never } : {}),
        ...(data.dueDate !== undefined ? { dueDate: new Date(data.dueDate) } : {}),
        ...(data.assigneeId !== undefined ? { assigneeId: data.assigneeId } : {}),
        ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
      },
      select: taskSelect,
    });

    await prisma.taskActivity.create({
      data: {
        taskId: id,
        actorId,
        action: 'UPDATE',
        description: `Task "${task.title}" updated`,
        metadata: data as never,
      },
    });

    await writeAuditLog({
      action: 'UPDATE',
      entityType: 'Task',
      entityId: id,
      description: `Task "${task.title}" updated`,
      actorId,
    });

    return updated;
  },

  async updateStatus(
    id: string,
    newStatus: TaskStatus,
    actorId: string,
    actorRole: string,
    comment?: string
  ) {
    const task = await prisma.task.findUnique({
      where: { id, isDeleted: false },
      select: { id: true, status: true, assigneeId: true, creatorId: true, title: true },
    });
    if (!task) throw Object.assign(new Error('Task not found'), { statusCode: 404, code: 'NOT_FOUND' });

    // IDOR: employee can only update their own tasks
    if (actorRole === 'EMPLOYEE' && task.assigneeId !== actorId) {
      throw Object.assign(new Error('Task not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    // Approving (COMPLETED) or cancelling a task is restricted to the task's
    // creator or a SUPER_ADMIN — matches 8_overview.md §2's status-transition
    // matrix ("Task creator OR SUPER_ADMIN only"), not just "any non-employee."
    if (
      (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') &&
      actorRole !== 'SUPER_ADMIN' &&
      task.creatorId !== actorId
    ) {
      throw Object.assign(new Error('Insufficient permissions'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    if (!VALID_TRANSITIONS[task.status as TaskStatus].includes(newStatus)) {
      throw Object.assign(
        new Error(`Cannot transition from ${task.status} to ${newStatus}`),
        { statusCode: 400, code: 'INVALID_STATUS_TRANSITION' }
      );
    }

    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'ACCEPTED') updateData['acceptedAt'] = new Date();
    if (newStatus === 'COMPLETED') updateData['completedAt'] = new Date();

    const updated = await prisma.task.update({
      where: { id },
      data: updateData as never,
      select: taskSelect,
    });

    await prisma.taskActivity.create({
      data: {
        taskId: id,
        actorId,
        action: 'STATUS_CHANGED',
        description: comment
          ? `Status changed to ${newStatus}: ${comment}`
          : `Status changed to ${newStatus}`,
        metadata: { from: task.status, to: newStatus },
      },
    });

    await invalidateDashboardCaches();

    const { recipientId, type, statusLabel } = resolveStatusChangeNotification(
      task.status as TaskStatus,
      newStatus,
      task
    );
    const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { name: true } });
    await notifyUsers({
      type,
      recipientIds: [recipientId],
      actorId,
      actorName: actor?.name,
      taskId: id,
      taskTitle: task.title,
      statusLabel,
      pushPriority: newStatus === 'CANCELLED' || newStatus === 'UNDER_REVIEW' ? 'high' : 'default',
    });

    return updated;
  },

  async assign(
    id: string,
    newAssigneeId: string,
    actorId: string,
    actorRole: string,
    actorDeptId?: string,
    reason?: string
  ) {
    // Scoped the same way getById/getList already scope ADMIN visibility:
    // their own department's tasks, or tasks they personally created
    // (covers a cross-dept task an Admin created for another department).
    // SUPER_ADMIN is unrestricted; EMPLOYEE never reaches this (route-level
    // TASK_ASSIGN permission excludes that role).
    const task = await prisma.task.findFirst({
      where: {
        id,
        isDeleted: false,
        ...(actorRole === 'ADMIN' && actorDeptId
          ? { OR: [{ departmentId: actorDeptId }, { creatorId: actorId }] }
          : {}),
      },
      select: { id: true, status: true, assigneeId: true, title: true },
    });
    if (!task) throw Object.assign(new Error('Task not found'), { statusCode: 404, code: 'NOT_FOUND' });

    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      throw Object.assign(
        new Error(`Cannot reassign a task that is already ${task.status.toLowerCase()}`),
        { statusCode: 400, code: 'INVALID_STATUS_TRANSITION' }
      );
    }

    const newAssignee = await prisma.user.findUnique({
      where: { id: newAssigneeId },
      select: { id: true, name: true, isActive: true, role: true },
    });
    if (!newAssignee || !newAssignee.isActive) {
      throw Object.assign(new Error('Assignee not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }
    if (newAssignee.role !== 'ADMIN' && newAssignee.role !== 'EMPLOYEE') {
      throw Object.assign(
        new Error('Tasks can only be assigned to an Admin or Employee'),
        { statusCode: 400, code: 'INVALID_ASSIGNEE' }
      );
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { assigneeId: newAssigneeId },
      select: taskSelect,
    });

    await prisma.taskActivity.create({
      data: {
        taskId: id,
        actorId,
        action: 'REASSIGNED',
        description: reason
          ? `Task reassigned to ${updated.assignee.name}: ${reason}`
          : `Task reassigned to ${updated.assignee.name}`,
        metadata: { previousAssigneeId: task.assigneeId, newAssigneeId, ...(reason ? { reason } : {}) },
      },
    });

    const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { name: true } });
    await notifyUsers({
      type: 'TASK_REASSIGNED',
      recipientIds: [task.assigneeId, newAssigneeId],
      actorId,
      actorName: actor?.name,
      taskId: id,
      taskTitle: updated.title,
      pushPriority: 'high',
    });

    return updated;
  },

  async softDelete(id: string, actorId: string) {
    const task = await prisma.task.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!task) throw Object.assign(new Error('Task not found'), { statusCode: 404, code: 'NOT_FOUND' });

    await prisma.task.update({ where: { id }, data: { isDeleted: true } });

    await writeAuditLog({
      action: 'DELETE',
      entityType: 'Task',
      entityId: id,
      description: `Task "${task.title}" soft-deleted`,
      actorId,
    });
  },

  // Schema restricts `status` to 'CANCELLED' only (bulkStatusBodySchema) — this
  // is the bulk equivalent of updateStatus's cancel path, so it uses the same
  // creator-or-SUPER_ADMIN rule rather than trusting whatever ids the client sent.
  async bulkUpdateStatus(ids: string[], status: TaskStatus, actorId: string, actorRole: string) {
    const candidates = await prisma.task.findMany({
      where: { id: { in: ids }, isDeleted: false, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      select: { id: true, status: true, assigneeId: true, creatorId: true, title: true },
    });

    const tasks =
      actorRole === 'SUPER_ADMIN' ? candidates : candidates.filter((t) => t.creatorId === actorId);
    const cancellableIds = new Set(candidates.map((t) => t.id));
    const skippedIds = ids.filter(
      (id) => !cancellableIds.has(id) || !tasks.some((t) => t.id === id)
    );

    if (tasks.length > 0) {
      await prisma.task.updateMany({
        where: { id: { in: tasks.map((t) => t.id) } },
        data: { status: status as never },
      });

      await prisma.taskActivity.createMany({
        data: tasks.map((task) => ({
          taskId: task.id,
          actorId,
          action: 'STATUS_CHANGED' as const,
          description: `Bulk status update to ${status}`,
          metadata: { to: status },
        })) as never,
      });

      await invalidateDashboardCaches();

      const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { name: true } });
      for (const task of tasks) {
        const { recipientId, type, statusLabel } = resolveStatusChangeNotification(
          task.status as TaskStatus,
          status,
          task
        );
        await notifyUsers({
          type,
          recipientIds: [recipientId],
          actorId,
          actorName: actor?.name,
          taskId: task.id,
          taskTitle: task.title,
          statusLabel,
        });
      }
    }

    return { cancelledIds: tasks.map((t) => t.id), skippedIds };
  },

  async getComments(taskId: string, viewerId: string, viewerRole: string, viewerDeptId?: string) {
    // Verify viewer has access to this task (reuse getById for the access check)
    await tasksService.getById(taskId, viewerId, viewerRole, viewerDeptId);

    return prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  },

  async addComment(
    taskId: string,
    authorId: string,
    content: string,
    parentId?: string,
    viewerRole?: string,
    viewerDeptId?: string
  ) {
    const task = await tasksService.getById(taskId, authorId, viewerRole ?? 'EMPLOYEE', viewerDeptId);

    const comment = await prisma.comment.create({
      data: { taskId, authorId, content, ...(parentId !== undefined ? { parentId } : {}) },
      select: {
        id: true,
        content: true,
        parentId: true,
        createdAt: true,
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    await prisma.taskActivity.create({
      data: {
        taskId,
        actorId: authorId,
        action: 'UPDATE',
        description: `Comment added`,
      },
    });

    // Notify task stakeholders (creator + assignee), never the comment author.
    await notifyUsers({
      type: 'COMMENT_ADDED',
      recipientIds: [task.creatorId, task.assigneeId],
      actorId: authorId,
      actorName: comment.author.name,
      taskId,
      taskTitle: task.title,
    });

    return comment;
  },

  async getActivity(taskId: string, viewerId: string, viewerRole: string, viewerDeptId?: string) {
    await tasksService.getById(taskId, viewerId, viewerRole, viewerDeptId);

    return prisma.taskActivity.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        action: true,
        description: true,
        metadata: true,
        createdAt: true,
        actor: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  },

  async getAttachments(taskId: string, viewerId: string, viewerRole: string, viewerDeptId?: string) {
    await tasksService.getById(taskId, viewerId, viewerRole, viewerDeptId);

    return prisma.fileAttachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        isProof: true,
        createdAt: true,
        uploadedBy: true,
      },
    });
  },

  async createBatch(dto: CreateTaskBatchDto, creatorId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.taskBatch.create({
        data: {
          title: dto.title,
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          priority: dto.priority as never,
          dueDate: new Date(dto.dueDate),
          ...(dto.isolationNote !== undefined ? { isolationNote: dto.isolationNote } : {}),
          creatorId,
          ...(dto.departmentId !== undefined ? { departmentId: dto.departmentId } : {}),
        },
      });

      const tasks = await Promise.all(
        dto.assigneeIds.map((assigneeId) =>
          tx.task.create({
            data: {
              title: dto.title,
              ...(dto.description !== undefined ? { description: dto.description } : {}),
              priority: dto.priority as never,
              dueDate: new Date(dto.dueDate),
              assigneeId,
              creatorId,
              ...(dto.departmentId !== undefined ? { departmentId: dto.departmentId } : {}),
              batchId: batch.id,
              status: 'PENDING' as never,
            },
            select: taskSelect,
          })
        )
      );

      await tx.taskActivity.createMany({
        data: tasks.map((task) => ({
          taskId: task.id,
          actorId: creatorId,
          action: 'CREATE' as const,
          description: `Task created via batch "${batch.title}" and assigned to ${task.assignee.name}`,
        })) as never,
      });

      return { batch, tasks };
    });

    await writeAuditLog({
      action: 'CREATE',
      entityType: 'TaskBatch',
      entityId: result.batch.id,
      description: `Batch "${result.batch.title}" created with ${result.tasks.length} task(s)`,
      actorId: creatorId,
    });

    await invalidateDashboardCaches();

    return result;
  },

  async getBatchSummary(
    batchId: string,
    viewer: { id: string; role: string; departmentId?: string }
  ) {
    const batch = await prisma.taskBatch.findFirst({
      where: {
        id: batchId,
        ...(viewer.role === 'SUPER_ADMIN'
          ? {}
          : viewer.role === 'ADMIN' && viewer.departmentId
          ? { OR: [{ departmentId: viewer.departmentId }, { creatorId: viewer.id }] }
          : { creatorId: viewer.id }),
      },
    });
    if (!batch) throw Object.assign(new Error('Batch not found'), { statusCode: 404, code: 'NOT_FOUND' });

    const members = await prisma.task.findMany({
      where: { batchId: batch.id, isDeleted: false },
      select: taskSelect,
    });

    const now = new Date();
    const doneCount = members.filter((m) => m.status === 'COMPLETED').length;
    const atRiskCount = members.filter(
      (m) => m.status !== 'COMPLETED' && m.status !== 'CANCELLED' && m.dueDate < now
    ).length;

    const countsByStatus = new Map<TaskStatus, number>();
    for (const member of members) {
      const status = member.status as TaskStatus;
      countsByStatus.set(status, (countsByStatus.get(status) ?? 0) + 1);
    }

    const totalMembers = members.length;
    const segments: BatchProgressSegment[] = Array.from(countsByStatus.entries()).map(
      ([status, count]) => ({
        status,
        label: STATUS_LABELS[status],
        count,
        percent: totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0,
      })
    );

    return {
      batch,
      members,
      totalMembers,
      doneCount,
      atRiskCount,
      segments,
    };
  },

  async nudgeBatchStragglers(batchId: string, actorId: string) {
    const batch = await prisma.taskBatch.findUnique({
      where: { id: batchId },
      select: { id: true, title: true },
    });
    if (!batch) throw Object.assign(new Error('Batch not found'), { statusCode: 404, code: 'NOT_FOUND' });

    const stragglers = await prisma.task.findMany({
      where: { batchId, isDeleted: false, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      select: { id: true, title: true, assigneeId: true },
    });

    for (const task of stragglers) {
      await notifyUsers({
        type: 'TASK_DUE_SOON',
        recipientIds: [task.assigneeId],
        actorId,
        taskId: task.id,
        taskTitle: task.title,
      });
    }

    await writeAuditLog({
      action: 'UPDATE',
      entityType: 'TaskBatch',
      entityId: batchId,
      description: `Nudged ${stragglers.length} straggler(s) in batch "${batch.title}"`,
      actorId,
    });

    return { notifiedCount: stragglers.length };
  },
};
