import type { FastifyInstance } from 'fastify';

import { prisma } from '../../config/database.js';
import { requireAuth } from '../../shared/guards/requireAuth.guard.js';
import { requirePermission } from '../../shared/guards/requirePermission.guard.js';
import { PERMISSIONS } from '../../shared/guards/permissions.js';
import { sendSuccess } from '../../utils/response.utils.js';

const ALLOWED_ENTITY_TYPES = ['Task', 'User', 'Department', 'Auth', 'System'] as const;
const ALLOWED_ACTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGED', 'LOGIN', 'LOGOUT',
  'LOGIN_FAILED', 'PASSWORD_CHANGED', 'ROLE_CHANGED', 'ASSIGNED', 'REASSIGNED',
] as const;

export const auditRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get('/', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.AUDIT_VIEW)],
    handler: async (req, reply) => {
      const query = req.query as {
        page?: string;
        limit?: string;
        entityType?: string;
        action?: string;
        actorId?: string;
        from?: string;
        to?: string;
      };

      const page = Math.max(1, parseInt(query.page ?? '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));

      const where: Record<string, unknown> = {};

      if (query.entityType && ALLOWED_ENTITY_TYPES.includes(query.entityType as never)) {
        where['entityType'] = query.entityType;
      }
      if (query.action && ALLOWED_ACTIONS.includes(query.action as never)) {
        where['action'] = query.action;
      }
      if (query.actorId) where['actorId'] = query.actorId;
      if (query.from || query.to) {
        where['createdAt'] = {
          ...(query.from ? { gte: new Date(query.from) } : {}),
          ...(query.to ? { lte: new Date(query.to) } : {}),
        };
      }

      const [items, total] = await prisma.$transaction([
        prisma.auditLog.findMany({
          where: where as never,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            description: true,
            ipAddress: true,
            metadata: true,
            createdAt: true,
            actor: { select: { id: true, name: true, role: true, avatarUrl: true } },
          },
        }),
        prisma.auditLog.count({ where: where as never }),
      ]);

      return sendSuccess(reply, { items, total, page, limit });
    },
  });

  // Actor-scoped log (e.g. view a specific user's audit trail)
  app.get('/actor/:actorId', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.AUDIT_VIEW)],
    handler: async (req, reply) => {
      const { actorId } = req.params as { actorId: string };
      const query = req.query as { page?: string; limit?: string };
      const page = Math.max(1, parseInt(query.page ?? '1', 10));
      const limit = Math.min(50, Math.max(1, parseInt(query.limit ?? '15', 10)));

      const [items, total] = await prisma.$transaction([
        prisma.auditLog.findMany({
          where: { actorId },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            description: true,
            createdAt: true,
          },
        }),
        prisma.auditLog.count({ where: { actorId } }),
      ]);

      return sendSuccess(reply, { items, total, page, limit });
    },
  });
};
