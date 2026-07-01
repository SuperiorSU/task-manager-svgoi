import type { FastifyInstance } from 'fastify';

import { prisma } from '../../config/database.js';
import { cache } from '../../config/redis.js';
import { requireAuth } from '../../shared/guards/requireAuth.guard.js';
import { sendSuccess } from '../../utils/response.utils.js';

export const dashboardRoutes = async (app: FastifyInstance): Promise<void> => {
  // ─── Stats ─────────────────────────────────────────────────────────
  app.get('/stats', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      const { user } = req;
      const cacheKey = `dashboard:stats:${user.id}`;

      const cached = await cache.get<unknown>(cacheKey).catch(() => null);
      if (cached) return sendSuccess(reply, cached);

      const base: Record<string, unknown> = { isDeleted: false };
      if (user.role === 'EMPLOYEE') base['assigneeId'] = user.id;
      else if (user.role === 'ADMIN') base['departmentId'] = user.departmentId;

      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);

      const [total, pending, accepted, inProgress, underReview, completed, cancelled, overdue, completedThisWeek, dueToday, activeUsers, deptCount] =
        await prisma.$transaction([
          prisma.task.count({ where: base as never }),
          prisma.task.count({ where: { ...base, status: 'PENDING' } as never }),
          prisma.task.count({ where: { ...base, status: 'ACCEPTED' } as never }),
          prisma.task.count({ where: { ...base, status: 'IN_PROGRESS' } as never }),
          prisma.task.count({ where: { ...base, status: 'UNDER_REVIEW' } as never }),
          prisma.task.count({ where: { ...base, status: 'COMPLETED' } as never }),
          prisma.task.count({ where: { ...base, status: 'CANCELLED' } as never }),
          prisma.task.count({
            where: {
              ...base,
              dueDate: { lt: now },
              status: { notIn: ['COMPLETED', 'CANCELLED'] },
            } as never,
          }),
          prisma.task.count({
            where: {
              ...base,
              status: 'COMPLETED',
              completedAt: { gte: weekStart },
            } as never,
          }),
          prisma.task.count({
            where: {
              ...base,
              dueDate: {
                gte: new Date(now.toDateString()),
                lt: new Date(now.getTime() + 86400000),
              },
              status: { notIn: ['COMPLETED', 'CANCELLED'] },
            } as never,
          }),
          ...(user.role === 'SUPER_ADMIN'
            ? [
                prisma.user.count({ where: { isActive: true } }),
                prisma.department.count({ where: { isActive: true } }),
              ]
            : [Promise.resolve(0), Promise.resolve(0)]),
        ]);

      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      const stats = {
        totalTasks: total,
        pending,
        accepted,
        inProgress,
        underReview,
        completed,
        cancelled,
        overdue,
        completedThisWeek,
        dueToday,
        activeUsers,
        departments: deptCount,
        completionRate,
      };

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

  // ─── Activity feed ─────────────────────────────────────────────────
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

  // ─── 30-day trend (created vs completed per day) ───────────────────
  app.get('/trend', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      const { user } = req;
      const cacheKey = `dashboard:trend:${user.id}`;
      const cached = await cache.get<unknown>(cacheKey).catch(() => null);
      if (cached) return sendSuccess(reply, cached);

      const base: Record<string, unknown> = { isDeleted: false };
      if (user.role === 'EMPLOYEE') base['assigneeId'] = user.id;
      else if (user.role === 'ADMIN') base['departmentId'] = user.departmentId;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [created, completed] = await Promise.all([
        prisma.task.findMany({
          where: { ...base, createdAt: { gte: thirtyDaysAgo } } as never,
          select: { createdAt: true },
        }),
        prisma.task.findMany({
          where: { ...base, status: 'COMPLETED', completedAt: { gte: thirtyDaysAgo } } as never,
          select: { completedAt: true },
        }),
      ]);

      // Build day-by-day buckets for the last 30 days
      const buckets: Record<string, { date: string; created: number; completed: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(5, 10); // MM-DD
        buckets[key] = { date: key, created: 0, completed: 0 };
      }

      for (const t of created) {
        const key = t.createdAt.toISOString().slice(5, 10);
        if (buckets[key]) buckets[key]!.created++;
      }
      for (const t of completed) {
        if (!t.completedAt) continue;
        const key = t.completedAt.toISOString().slice(5, 10);
        if (buckets[key]) buckets[key]!.completed++;
      }

      const trend = Object.values(buckets);
      void cache.set(cacheKey, trend, 600).catch(() => {});
      return sendSuccess(reply, trend);
    },
  });

  // ─── Department comparison (SUPER_ADMIN / ADMIN only) ─────────────
  app.get('/dept-stats', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      if (req.user.role === 'EMPLOYEE') {
        return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Not available for employees' } });
      }

      const cacheKey = `dashboard:dept-stats:${req.user.id}`;
      const cached = await cache.get<unknown>(cacheKey).catch(() => null);
      if (cached) return sendSuccess(reply, cached);

      const deptWhere = req.user.role === 'ADMIN'
        ? { id: req.user.departmentId ?? '' }
        : {};

      const departments = await prisma.department.findMany({
        where: { isActive: true, ...deptWhere },
        select: { id: true, name: true, code: true },
      });

      const stats = await Promise.all(
        departments.map(async (dept) => {
          const base = { departmentId: dept.id, isDeleted: false };
          const [total, completed, overdue] = await prisma.$transaction([
            prisma.task.count({ where: base as never }),
            prisma.task.count({ where: { ...base, status: 'COMPLETED' } as never }),
            prisma.task.count({
              where: {
                ...base,
                dueDate: { lt: new Date() },
                status: { notIn: ['COMPLETED', 'CANCELLED'] },
              } as never,
            }),
          ]);
          return {
            id: dept.id,
            name: dept.name,
            code: dept.code,
            total,
            completed,
            overdue,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          };
        })
      );

      void cache.set(cacheKey, stats, 600).catch(() => {});
      return sendSuccess(reply, stats);
    },
  });

  // ─── Employee workload (ADMIN / SUPER_ADMIN) ───────────────────────
  app.get('/workload', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      if (req.user.role === 'EMPLOYEE') {
        return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Not available for employees' } });
      }

      const cacheKey = `dashboard:workload:${req.user.id}`;
      const cached = await cache.get<unknown>(cacheKey).catch(() => null);
      if (cached) return sendSuccess(reply, cached);

      const userWhere: Record<string, unknown> = { isActive: true, role: 'EMPLOYEE' };
      if (req.user.role === 'ADMIN') userWhere['departmentId'] = req.user.departmentId;

      const employees = await prisma.user.findMany({
        where: userWhere as never,
        select: { id: true, name: true },
        take: 10,
        orderBy: { name: 'asc' },
      });

      const workload = await Promise.all(
        employees.map(async (emp) => {
          const base = { assigneeId: emp.id, isDeleted: false };
          const [assigned, completed, overdue] = await prisma.$transaction([
            prisma.task.count({ where: { ...base, status: { notIn: ['CANCELLED'] } } as never }),
            prisma.task.count({ where: { ...base, status: 'COMPLETED' } as never }),
            prisma.task.count({
              where: {
                ...base,
                dueDate: { lt: new Date() },
                status: { notIn: ['COMPLETED', 'CANCELLED'] },
              } as never,
            }),
          ]);
          return {
            userId: emp.id,
            name: emp.name,
            assigned,
            completed,
            overdue,
          };
        })
      );

      void cache.set(cacheKey, workload, 300).catch(() => {});
      return sendSuccess(reply, workload);
    },
  });
};
