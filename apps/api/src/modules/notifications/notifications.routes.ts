import type { FastifyInstance } from 'fastify';

import { prisma } from '../../config/database.js';
import { cache } from '../../config/redis.js';
import { requireAuth } from '../../shared/guards/requireAuth.guard.js';
import { sendSuccess } from '../../utils/response.utils.js';

export const notificationsRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get('/', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return sendSuccess(reply, notifications);
    },
  });

  app.get('/unread-count', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      const cacheKey = `notifications:unread:${req.user.id}`;
      const cached = await cache.get<{ count: number }>(cacheKey);
      if (cached) return sendSuccess(reply, cached);

      const count = await prisma.notification.count({
        where: { userId: req.user.id, isRead: false },
      });
      await cache.set(cacheKey, { count }, 30);
      return sendSuccess(reply, { count });
    },
  });

  app.patch('/:id/read', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      await prisma.notification.updateMany({
        where: { id, userId: req.user.id },
        data: { isRead: true, readAt: new Date() },
      });
      await cache.del(`notifications:unread:${req.user.id}`);
      return sendSuccess(reply, null);
    },
  });

  app.patch('/read-all', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      await prisma.notification.updateMany({
        where: { userId: req.user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      await cache.del(`notifications:unread:${req.user.id}`);
      return sendSuccess(reply, null);
    },
  });
};
