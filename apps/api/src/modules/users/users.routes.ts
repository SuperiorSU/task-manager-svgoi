import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../../shared/guards/requireAuth.guard.js';
import { requirePermission } from '../../shared/guards/requirePermission.guard.js';
import { PERMISSIONS } from '../../shared/guards/permissions.js';
import { sendSuccess } from '../../utils/response.utils.js';
import { usersService } from './users.service.js';
import { writeAuditLog } from '../../utils/audit.utils.js';
import { prisma } from '../../config/database.js';

export const usersRoutes = async (app: FastifyInstance): Promise<void> => {
  // ─── List (with search, role filter, pagination) ──────────────────
  app.get('/', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.USER_READ)],
    handler: async (req, reply) => {
      const query = req.query as {
        departmentId?: string;
        role?: string;
        search?: string;
        isActive?: string;
        page?: string;
        limit?: string;
      };

      const page = Math.max(1, parseInt(query.page ?? '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));

      const where: Record<string, unknown> = {};

      // ADMIN sees only their dept
      if (req.user.role === 'ADMIN') {
        where['departmentId'] = req.user.departmentId;
      } else if (query.departmentId) {
        where['departmentId'] = query.departmentId;
      }

      if (query.role && ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'].includes(query.role)) {
        where['role'] = query.role;
      }

      // Default: show active users only; pass isActive=false to include suspended
      if (query.isActive !== 'false') where['isActive'] = true;

      if (query.search) {
        where['OR'] = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { employeeId: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      const safeSelect = {
        id: true,
        email: true,
        name: true,
        employeeId: true,
        phone: true,
        avatarUrl: true,
        designation: true,
        role: true,
        isActive: true,
        departmentId: true,
        managerId: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        department: { select: { id: true, name: true, code: true } },
        manager: { select: { id: true, name: true } },
      } as const;

      const [items, total] = await prisma.$transaction([
        prisma.user.findMany({
          where: where as never,
          select: safeSelect,
          orderBy: { name: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.user.count({ where: where as never }),
      ]);

      return sendSuccess(reply, { items, total, page, limit });
    },
  });

  // ─── Get by ID ────────────────────────────────────────────────────
  app.get('/:id', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.USER_READ)],
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const user = await usersService.getById(id, req.user.role, req.user.departmentId);
      return sendSuccess(reply, user);
    },
  });

  // ─── Create ───────────────────────────────────────────────────────
  app.post('/', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.USER_CREATE)],
    handler: async (req, reply) => {
      const user = await usersService.create({
        ...(req.body as object),
        creatorId: req.user.id,
      } as never);
      return sendSuccess(reply, user, 201);
    },
  });

  // ─── Update profile ───────────────────────────────────────────────
  app.patch('/:id', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.USER_UPDATE)],
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const user = await usersService.update(id, req.body as never, req.user.id);
      return sendSuccess(reply, user);
    },
  });

  // ─── Deactivate ───────────────────────────────────────────────────
  app.patch('/:id/deactivate', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.USER_DEACTIVATE)],
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      await usersService.deactivate(id, req.user.id, req.user.departmentId);
      return sendSuccess(reply, null);
    },
  });

  // ─── Reactivate ───────────────────────────────────────────────────
  app.patch('/:id/reactivate', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.USER_DEACTIVATE)],
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };

      const user = await prisma.user.findUnique({
        where: { id },
        select: { name: true, isActive: true, departmentId: true },
      });

      if (!user) {
        return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      }

      // Admin can only manage users in their department
      if (req.user.role === 'ADMIN' && user.departmentId !== req.user.departmentId) {
        return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      }

      await prisma.user.update({ where: { id }, data: { isActive: true } });

      await writeAuditLog({
        action: 'UPDATE',
        entityType: 'User',
        entityId: id,
        description: `User ${user.name} reactivated`,
        actorId: req.user.id,
      });

      return sendSuccess(reply, null);
    },
  });

  // ─── Own profile update ───────────────────────────────────────────
  app.patch('/me', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      const user = await usersService.update(req.user.id, req.body as never, req.user.id);
      return sendSuccess(reply, user);
    },
  });

  // ─── Task stats for a specific user ──────────────────────────────
  app.get('/:id/task-stats', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.USER_READ)],
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const base = { assigneeId: id, isDeleted: false, createdAt: { gte: thirtyDaysAgo } };

      const [assigned, completed, overdue] = await prisma.$transaction([
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

      const onTimeRate = assigned > 0
        ? Math.round(((completed - overdue) / assigned) * 100)
        : 100;

      return sendSuccess(reply, { assigned, completed, overdue, onTimeRate: Math.max(0, onTimeRate) });
    },
  });

  // ─── Push token registration ──────────────────────────────────────
  app.post('/push-token', {
    config: { rateLimit: { max: 10, timeWindow: '1 day' } },
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      const { token, platform } = req.body as { token: string; platform: string };
      await usersService.registerPushToken(req.user.id, token, platform);
      return sendSuccess(reply, null);
    },
  });
};
