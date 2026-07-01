import type { FastifyInstance } from 'fastify';

import { prisma } from '../../config/database.js';
import { cache } from '../../config/redis.js';
import { requireAuth } from '../../shared/guards/requireAuth.guard.js';
import { sendSuccess } from '../../utils/response.utils.js';

export const dashboardRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get('/stats', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      const { period = 'week' } = req.query as { period?: string };
      const { user } = req;
      const cacheKey = `dashboard:stats:${user.id}:${period}`;

      // Cache is best-effort — a Redis hiccup should not break the dashboard
      const cached = await cache.get<unknown>(cacheKey).catch(() => null);
      if (cached) return sendSuccess(reply, cached);

      const baseWhere: Record<string, unknown> = { isDeleted: false };
      if (user.role === 'EMPLOYEE') baseWhere['assigneeId'] = user.id;
      else if (user.role === 'ADMIN') baseWhere['departmentId'] = user.departmentId;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      const [total, pending, inProgress, completed, overdue, dueToday] = await prisma.$transaction([
        prisma.task.count({ where: baseWhere as never }),
        prisma.task.count({ where: { ...baseWhere, status: 'PENDING' } as never }),
        prisma.task.count({ where: { ...baseWhere, status: 'IN_PROGRESS' } as never }),
        prisma.task.count({ where: { ...baseWhere, status: 'COMPLETED' } as never }),
        prisma.task.count({
          where: {
            ...baseWhere,
            dueDate: { lt: now },
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
          } as never,
        }),
        prisma.task.count({
          where: {
            ...baseWhere,
            dueDate: { gte: todayStart, lt: todayEnd },
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
          } as never,
        }),
      ]);

      const stats = { total, pending, inProgress, completed, overdue, dueToday };
      // Fire-and-forget cache write — don't await, don't fail the request if Redis is down
      void cache.set(cacheKey, stats, 300).catch(() => {});
      return sendSuccess(reply, stats);
    },
  });

  app.get('/upcoming', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      const { user } = req;
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const where: Record<string, unknown> = {
        isDeleted: false,
        dueDate: { gte: now, lte: sevenDaysLater },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      };
      if (user.role === 'EMPLOYEE') where['assigneeId'] = user.id;
      else if (user.role === 'ADMIN') where['departmentId'] = user.departmentId;

      const tasks = await prisma.task.findMany({
        where: where as never,
        orderBy: { dueDate: 'asc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          department: { select: { id: true, name: true } },
        },
      });

      return sendSuccess(reply, tasks);
    },
  });

  app.get('/activity', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      const { user } = req;
      const where: Record<string, unknown> = {};
      if (user.role === 'EMPLOYEE') where['task'] = { assigneeId: user.id };
      else if (user.role === 'ADMIN') where['task'] = { departmentId: user.departmentId };

      const activity = await prisma.taskActivity.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          description: true,
          createdAt: true,
          task: { select: { id: true, title: true } },
          actor: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      return sendSuccess(reply, activity);
    },
  });
};
