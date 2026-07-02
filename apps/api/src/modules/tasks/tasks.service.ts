import type { TaskStatus, TaskPriority } from '@godigitify/types';

import { prisma } from '../../config/database.js';
import { cache } from '../../config/redis.js';
import { writeAuditLog } from '../../utils/audit.utils.js';

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['COMPLETED', 'IN_PROGRESS'],
  COMPLETED: [],
  CANCELLED: [],
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
    await cache.delPattern('dashboard:stats:*');

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

    // Only creator/admin can approve (UNDER_REVIEW → COMPLETED) or cancel
    if (
      (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') &&
      actorRole === 'EMPLOYEE'
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

    await cache.delPattern('dashboard:stats:*');

    return updated;
  },

  async assign(id: string, newAssigneeId: string, actorId: string) {
    const task = await prisma.task.findUnique({
      where: { id, isDeleted: false },
      select: { id: true, assigneeId: true, title: true },
    });
    if (!task) throw Object.assign(new Error('Task not found'), { statusCode: 404, code: 'NOT_FOUND' });

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
        description: `Task reassigned to ${updated.assignee.name}`,
        metadata: { previousAssigneeId: task.assigneeId, newAssigneeId },
      },
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

  async bulkUpdateStatus(ids: string[], status: TaskStatus, actorId: string) {
    await prisma.task.updateMany({
      where: { id: { in: ids }, isDeleted: false },
      data: { status: status as never },
    });

    const activities = ids.map((taskId) => ({
      taskId,
      actorId,
      action: 'STATUS_CHANGED' as const,
      description: `Bulk status update to ${status}`,
      metadata: { to: status },
    }));

    await prisma.taskActivity.createMany({ data: activities as never });
    await cache.delPattern('dashboard:stats:*');
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
    await tasksService.getById(taskId, authorId, viewerRole ?? 'EMPLOYEE', viewerDeptId);

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
};
