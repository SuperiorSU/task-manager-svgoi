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

      const cached = await cache.get<unknown>(cacheKey);
      if (cached) return sendSuccess(reply, cached);

      const baseWhere: Record<string, unknown> = { isDeleted: false };
      if (user.role === 'EMPLOYEE') baseWhere['assigneeId'] = user.id;
      else if (user.role === 'ADMIN') baseWhere['departmentId'] = user.departmentId;

      const now = new Date();
      const [total, pending, inProgress, completed, overdue] = await prisma.$transaction([
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
      ]);

      const stats = { total, pending, inProgress, completed, overdue };
      await cache.set(cacheKey, stats, 300);
      return sendSuccess(reply, stats);
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
