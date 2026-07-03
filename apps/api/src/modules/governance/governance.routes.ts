import type { FastifyInstance } from 'fastify';

import { cache } from '../../config/redis.js';
import { requireAuth } from '../../shared/guards/requireAuth.guard.js';
import { requirePermission } from '../../shared/guards/requirePermission.guard.js';
import { PERMISSIONS } from '../../shared/guards/permissions.js';
import { sendSuccess } from '../../utils/response.utils.js';
import { governanceService } from './governance.service.js';
import {
  createGovernanceTaskBodySchema,
  governanceFiltersSchema,
  requestRevisionBodySchema,
} from './governance.schema.js';

export const governanceRoutes = async (app: FastifyInstance): Promise<void> => {
  app.post('/tasks', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.GOVERNANCE_TASK_CREATE)],
    schema: { body: createGovernanceTaskBodySchema },
    handler: async (request, reply) => {
      const task = await governanceService.create({
        ...(request.body as object),
        creatorId: request.user.id,
      } as never);
      return sendSuccess(reply, task, 201);
    },
  });

  app.get('/tasks', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.GOVERNANCE_TASK_REVIEW)],
    schema: { querystring: governanceFiltersSchema },
    handler: async (request, reply) => {
      const { page = 1, limit = 20, status, departmentId } = request.query as {
        page?: number;
        limit?: number;
        status?: string;
        departmentId?: string;
      };

      const cacheKey = `governance:list:${page}:${limit}:${status ?? ''}:${departmentId ?? ''}`;
      const cached = await cache.get<unknown>(cacheKey).catch(() => null);
      if (cached) return sendSuccess(reply, (cached as { tasks: unknown }).tasks, 200, (cached as { meta: Record<string, unknown> }).meta);

      const result = await governanceService.getList({
        page,
        limit,
        ...(status !== undefined ? { status: status as never } : {}),
        ...(departmentId !== undefined ? { departmentId } : {}),
      });
      void cache.set(cacheKey, result, 120).catch(() => {});
      return sendSuccess(reply, result.tasks, 200, result.meta);
    },
  });

  app.get('/tasks/:id', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.GOVERNANCE_TASK_REVIEW)],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const task = await governanceService.getById(id);
      return sendSuccess(reply, task);
    },
  });

  app.post('/tasks/:id/approve', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.GOVERNANCE_TASK_REVIEW)],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const task = await governanceService.approve(id, request.user.id, request.user.role);
      return sendSuccess(reply, task);
    },
  });

  app.post('/tasks/:id/request-revision', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.GOVERNANCE_TASK_REVIEW)],
    schema: { body: requestRevisionBodySchema },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { note } = request.body as { note: string };
      const task = await governanceService.requestRevision(id, note, request.user.id, request.user.role);
      return sendSuccess(reply, task);
    },
  });
};
