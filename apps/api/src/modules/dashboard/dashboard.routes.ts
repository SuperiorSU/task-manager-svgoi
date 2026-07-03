import type { FastifyInstance } from 'fastify';
import type {
  CalendarDeadlineDay,
  DeptHealth,
  Escalation,
  EscalationType,
  StaffLoad,
} from '@godigitify/types';

import { prisma } from '../../config/database.js';
import { cache } from '../../config/redis.js';
import { requireAuth } from '../../shared/guards/requireAuth.guard.js';
import { sendError, sendSuccess, ErrorCodes } from '../../utils/response.utils.js';

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

      const [total, pending, accepted, inProgress, underReview, completed, cancelled, overdue, completedThisWeek, dueToday] =
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
        ]);

      const [activeUsers, deptCount] =
        user.role === 'SUPER_ADMIN'
          ? await prisma.$transaction([
              prisma.user.count({ where: { isActive: true } }),
              prisma.department.count({ where: { isActive: true } }),
            ])
          : [0, 0];

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

  // ─── Super Admin: department health (SUPER_ADMIN org-wide / ADMIN own dept) ───
  app.get('/dept-health', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      if (req.user.role === 'EMPLOYEE') {
        return sendError(reply, 403, ErrorCodes.FORBIDDEN, 'Not available for employees');
      }

      const scope = req.user.role === 'SUPER_ADMIN' ? 'org' : (req.user.departmentId ?? '');
      const cacheKey = `dashboard:dept-health:${scope}`;
      const cached = await cache.get<DeptHealth[]>(cacheKey).catch(() => null);
      if (cached) return sendSuccess(reply, cached);

      const deptWhere = req.user.role === 'ADMIN' ? { id: req.user.departmentId ?? '' } : {};

      const departments = await prisma.department.findMany({
        where: { isActive: true, ...deptWhere },
        select: {
          id: true,
          name: true,
          head: { select: { id: true, name: true } },
        },
      });

      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const health: DeptHealth[] = await Promise.all(
        departments.map(async (dept) => {
          const base = { departmentId: dept.id, isDeleted: false };
          const [
            staffCount,
            pendingCount,
            inProgressCount,
            reviewCount,
            activeCount,
            overdueCount,
            blockedCount,
            completedRecent,
          ] = await prisma.$transaction([
            prisma.user.count({ where: { departmentId: dept.id, isActive: true } }),
            prisma.task.count({ where: { ...base, status: 'PENDING' } as never }),
            prisma.task.count({ where: { ...base, status: 'IN_PROGRESS' } as never }),
            prisma.task.count({ where: { ...base, status: 'UNDER_REVIEW' } as never }),
            prisma.task.count({
              where: { ...base, status: { notIn: ['COMPLETED', 'CANCELLED'] } } as never,
            }),
            prisma.task.count({
              where: {
                ...base,
                dueDate: { lt: now },
                status: { notIn: ['COMPLETED', 'CANCELLED'] },
              } as never,
            }),
            // "blocked" is not a real status — heuristic: IN_PROGRESS/UNDER_REVIEW tasks past their due date
            prisma.task.count({
              where: {
                ...base,
                status: { in: ['IN_PROGRESS', 'UNDER_REVIEW'] },
                dueDate: { lt: now },
              } as never,
            }),
            prisma.task.findMany({
              where: { ...base, status: 'COMPLETED', completedAt: { gte: thirtyDaysAgo } } as never,
              select: { completedAt: true, dueDate: true },
            }),
          ]);

          const onTimeCount = (completedRecent as { completedAt: Date | null; dueDate: Date }[]).filter(
            (t) => t.completedAt && t.completedAt <= t.dueDate
          ).length;
          const onTimeRate =
            completedRecent.length > 0 ? Math.round((onTimeCount / completedRecent.length) * 100) : 0;

          // Risk thresholds: overdue/staff ratio > 30% => CRITICAL, > 10% => AT_RISK, else HEALTHY.
          // staffCount = 0 is treated as HEALTHY unless there are overdue tasks, to avoid div-by-zero noise.
          const overdueRatio = staffCount > 0 ? overdueCount / staffCount : overdueCount > 0 ? 1 : 0;
          const riskLevel: DeptHealth['riskLevel'] =
            overdueRatio > 0.3 ? 'CRITICAL' : overdueRatio > 0.1 ? 'AT_RISK' : 'HEALTHY';

          return {
            departmentId: dept.id,
            departmentName: dept.name,
            adminId: dept.head?.id ?? null,
            adminName: dept.head?.name ?? null,
            staffCount,
            activeCount,
            overdueCount,
            onTimeRate,
            riskLevel,
            statusDistribution: {
              pending: pendingCount,
              inProgress: inProgressCount,
              review: reviewCount,
              overdue: overdueCount,
              blocked: blockedCount,
            },
          };
        })
      );

      void cache.set(cacheKey, health, 300).catch(() => {});
      return sendSuccess(reply, health);
    },
  });

  // ─── Super Admin: per-staff workload / capacity (SUPER_ADMIN org-wide / ADMIN own dept) ───
  app.get('/staff-load', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      if (req.user.role === 'EMPLOYEE') {
        return sendError(reply, 403, ErrorCodes.FORBIDDEN, 'Not available for employees');
      }

      const scope = req.user.role === 'SUPER_ADMIN' ? 'org' : (req.user.departmentId ?? '');
      const cacheKey = `dashboard:staff-load:${scope}`;
      const cached = await cache.get<StaffLoad[]>(cacheKey).catch(() => null);
      if (cached) return sendSuccess(reply, cached);

      const userWhere: Record<string, unknown> = {
        isActive: true,
        role: { in: ['EMPLOYEE', 'ADMIN'] },
      };
      if (req.user.role === 'ADMIN') userWhere['departmentId'] = req.user.departmentId;

      const users = await prisma.user.findMany({
        where: userWhere as never,
        select: { id: true, name: true, departmentId: true, designation: true },
      });

      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);

      // Fixed default until a real per-user capacity field exists on User.
      const CAPACITY_TARGET = 8;

      const staffLoad: StaffLoad[] = await Promise.all(
        users.map(async (u) => {
          const base = { assigneeId: u.id, isDeleted: false };
          const [activeCount, overdueCount, completedRecent] = await prisma.$transaction([
            prisma.task.count({
              where: { ...base, status: { notIn: ['COMPLETED', 'CANCELLED'] } } as never,
            }),
            prisma.task.count({
              where: {
                ...base,
                dueDate: { lt: now },
                status: { notIn: ['COMPLETED', 'CANCELLED'] },
              } as never,
            }),
            prisma.task.findMany({
              where: { ...base, status: 'COMPLETED', completedAt: { gte: thirtyDaysAgo } } as never,
              select: { createdAt: true, completedAt: true },
            }),
          ]);

          const completedList = completedRecent as { createdAt: Date; completedAt: Date | null }[];
          const avgCycleDays =
            completedList.length > 0
              ? Math.round(
                  (completedList.reduce(
                    (sum, t) =>
                      sum + ((t.completedAt?.getTime() ?? t.createdAt.getTime()) - t.createdAt.getTime()),
                    0
                  ) /
                    completedList.length /
                    86_400_000) *
                    10
                ) / 10
              : 0;

          return {
            userId: u.id,
            name: u.name,
            departmentId: u.departmentId,
            designation: u.designation,
            activeCount,
            overdueCount,
            avgCycleDays,
            capacityTarget: CAPACITY_TARGET,
            capacityPercent: Math.round((activeCount / CAPACITY_TARGET) * 100),
          };
        })
      );

      void cache.set(cacheKey, staffLoad, 300).catch(() => {});
      return sendSuccess(reply, staffLoad);
    },
  });

  // ─── Super Admin: cross-department escalations (SUPER_ADMIN only) ───
  app.get('/escalations', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      if (req.user.role !== 'SUPER_ADMIN') {
        return sendError(reply, 403, ErrorCodes.FORBIDDEN, 'Not available for this role');
      }

      const cacheKey = 'dashboard:escalations:org';
      const cached = await cache.get<Escalation[]>(cacheKey).catch(() => null);
      if (cached) return sendSuccess(reply, cached);

      const now = new Date();
      const detectedAt = now.toISOString();

      // Hardcoded until DepartmentSettings.reviewWithinHours is wired up org-wide (owned elsewhere).
      const REVIEW_STALLED_HOURS = 24;
      const reviewStalledCutoff = new Date(now.getTime() - REVIEW_STALLED_HOURS * 60 * 60 * 1000);
      const pendingStalledCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      const [overdueTasks, reviewStalledTasks, pendingStalledTasks, departments] = await prisma.$transaction([
        prisma.task.findMany({
          where: {
            isDeleted: false,
            dueDate: { lt: now },
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
            departmentId: { not: null },
          } as never,
          select: { departmentId: true },
        }),
        prisma.task.findMany({
          where: {
            isDeleted: false,
            status: 'UNDER_REVIEW',
            updatedAt: { lt: reviewStalledCutoff },
            departmentId: { not: null },
          } as never,
          select: { departmentId: true },
        }),
        prisma.task.findMany({
          where: {
            isDeleted: false,
            status: 'PENDING',
            createdAt: { lt: pendingStalledCutoff },
            departmentId: { not: null },
          } as never,
          select: { departmentId: true },
        }),
        prisma.department.findMany({
          select: { id: true, name: true, headId: true },
        }),
      ]);

      const deptById = new Map(departments.map((d) => [d.id, d]));

      const countByDept = (rows: { departmentId: string | null }[]): Map<string, number> => {
        const counts = new Map<string, number>();
        for (const row of rows) {
          if (!row.departmentId) continue;
          counts.set(row.departmentId, (counts.get(row.departmentId) ?? 0) + 1);
        }
        return counts;
      };

      const buildEscalations = (
        counts: Map<string, number>,
        type: EscalationType,
        minCount: number
      ): Escalation[] => {
        const rows: Escalation[] = [];
        for (const [departmentId, count] of counts) {
          if (count < minCount) continue;
          const dept = deptById.get(departmentId);
          rows.push({
            id: `${type}:${departmentId}`,
            type,
            departmentId,
            departmentName: dept?.name ?? 'Unknown',
            ownerId: dept?.headId ?? null,
            // No acknowledgement tracking exists yet — always false, best-effort only.
            ownerActioned: false,
            detectedAt,
            count,
          });
        }
        return rows;
      };

      const escalations: Escalation[] = [
        ...buildEscalations(countByDept(overdueTasks), 'OVERDUE_CLUSTER', 3),
        ...buildEscalations(countByDept(reviewStalledTasks), 'REVIEW_STALLED', 1),
        ...buildEscalations(countByDept(pendingStalledTasks), 'PENDING_ACCEPT_STALLED', 1),
      ];

      void cache.set(cacheKey, escalations, 300).catch(() => {});
      return sendSuccess(reply, escalations);
    },
  });

  // ─── Super Admin: calendar deadline density (SUPER_ADMIN org-wide / ADMIN own dept) ───
  app.get('/calendar-deadlines', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      if (req.user.role === 'EMPLOYEE') {
        return sendError(reply, 403, ErrorCodes.FORBIDDEN, 'Not available for employees');
      }

      const { from, to } = req.query as { from?: string; to?: string };
      if (!from || !to) {
        return sendError(reply, 400, ErrorCodes.VALIDATION_ERROR, 'from and to query params are required');
      }

      const fromDate = new Date(from);
      const toDate = new Date(to);
      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate > toDate) {
        return sendError(reply, 400, ErrorCodes.VALIDATION_ERROR, 'Invalid from/to date range');
      }

      const rangeDays = (toDate.getTime() - fromDate.getTime()) / 86_400_000;
      if (rangeDays > 62) {
        return sendError(reply, 400, ErrorCodes.VALIDATION_ERROR, 'Date range cannot exceed 62 days');
      }

      const scope = req.user.role === 'SUPER_ADMIN' ? 'org' : (req.user.departmentId ?? '');
      const cacheKey = `dashboard:calendar:${scope}:${from}:${to}`;
      const cached = await cache.get<CalendarDeadlineDay[]>(cacheKey).catch(() => null);
      if (cached) return sendSuccess(reply, cached);

      const where: Record<string, unknown> = {
        isDeleted: false,
        dueDate: { gte: fromDate, lte: toDate },
      };
      if (req.user.role === 'ADMIN') where['departmentId'] = req.user.departmentId;

      const tasks = await prisma.task.findMany({
        where: where as never,
        select: { departmentId: true, dueDate: true },
      });

      // Aggregate per-day, per-department counts in JS since groupBy can't bucket by day.
      const buckets = new Map<string, CalendarDeadlineDay>();
      for (const t of tasks as { departmentId: string | null; dueDate: Date }[]) {
        if (!t.departmentId) continue;
        const date = t.dueDate.toISOString().slice(0, 10);
        const key = `${t.departmentId}:${date}`;
        const existing = buckets.get(key);
        if (existing) existing.count++;
        else buckets.set(key, { departmentId: t.departmentId, date, count: 1 });
      }

      const calendar = Array.from(buckets.values());
      void cache.set(cacheKey, calendar, 300).catch(() => {});
      return sendSuccess(reply, calendar);
    },
  });
};
