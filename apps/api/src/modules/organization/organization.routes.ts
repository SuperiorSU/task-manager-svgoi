import type { FastifyInstance } from 'fastify';

import { prisma } from '../../config/database.js';
import { cache } from '../../config/redis.js';
import { requireAuth } from '../../shared/guards/requireAuth.guard.js';
import { requirePermission } from '../../shared/guards/requirePermission.guard.js';
import { PERMISSIONS } from '../../shared/guards/permissions.js';
import { sendSuccess } from '../../utils/response.utils.js';
import { writeAuditLog } from '../../utils/audit.utils.js';
import { updateOrgConfigBodySchema } from './organization.schema.js';

const CACHE_KEY = 'organization:config';

export const organizationRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get('/config', {
    preHandler: [requireAuth],
    handler: async (_req, reply) => {
      const cached = await cache.get<unknown>(CACHE_KEY).catch(() => null);
      if (cached) return sendSuccess(reply, cached);

      let config = await prisma.organizationConfig.findUnique({ where: { singleton: 1 } });
      if (!config) {
        config = await prisma.organizationConfig.create({ data: { singleton: 1 } });
      }

      void cache.set(CACHE_KEY, config, 600).catch(() => {});
      return sendSuccess(reply, config);
    },
  });

  app.patch('/config', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.ORG_CONFIG_MANAGE)],
    schema: { body: updateOrgConfigBodySchema },
    handler: async (req, reply) => {
      const body = req.body as Record<string, unknown>;

      const config = await prisma.organizationConfig.upsert({
        where: { singleton: 1 },
        update: body as never,
        create: { singleton: 1, ...body } as never,
      });

      await writeAuditLog({
        action: 'UPDATE',
        entityType: 'OrganizationConfig',
        entityId: 'singleton',
        description: 'Organization configuration updated',
        actorId: req.user.id,
      });

      void cache.del(CACHE_KEY).catch(() => {});
      return sendSuccess(reply, config);
    },
  });
};
