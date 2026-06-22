import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../../shared/guards/requireAuth.guard.js';
import { requirePermission } from '../../shared/guards/requirePermission.guard.js';
import { PERMISSIONS } from '../../shared/guards/permissions.js';
import { sendSuccess } from '../../utils/response.utils.js';
import { usersService } from './users.service.js';

export const usersRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get('/', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.USER_READ)],
    handler: async (req, reply) => {
      const { departmentId } = req.query as { departmentId?: string };
      const users = await usersService.getList(req.user.role, req.user.departmentId, departmentId);
      return sendSuccess(reply, users);
    },
  });

  app.get('/:id', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.USER_READ)],
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const user = await usersService.getById(id, req.user.role, req.user.departmentId);
      return sendSuccess(reply, user);
    },
  });

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

  app.patch('/:id', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.USER_UPDATE)],
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const user = await usersService.update(id, req.body as never, req.user.id);
      return sendSuccess(reply, user);
    },
  });

  app.patch('/:id/deactivate', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.USER_DEACTIVATE)],
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      await usersService.deactivate(id, req.user.id, req.user.departmentId);
      return sendSuccess(reply, null);
    },
  });

  app.patch('/me', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      const user = await usersService.update(req.user.id, req.body as never, req.user.id);
      return sendSuccess(reply, user);
    },
  });

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
