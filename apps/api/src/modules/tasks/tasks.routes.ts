import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../../shared/guards/requireAuth.guard.js';
import { requirePermission } from '../../shared/guards/requirePermission.guard.js';
import { PERMISSIONS } from '../../shared/guards/permissions.js';
import { tasksController } from './tasks.controller.js';
import {
  createTaskBodySchema,
  updateStatusBodySchema,
  taskFiltersSchema,
  assignBodySchema,
  bulkStatusBodySchema,
} from './tasks.schema.js';

export const tasksRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get('/', {
    preHandler: [requireAuth],
    schema: { querystring: taskFiltersSchema },
    handler: tasksController.getList,
  });

  app.get('/:id', {
    preHandler: [requireAuth],
    handler: tasksController.getById,
  });

  app.post('/', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.TASK_CREATE)],
    schema: { body: createTaskBodySchema },
    handler: tasksController.create,
  });

  app.patch('/:id/status', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.TASK_UPDATE_STATUS)],
    schema: { body: updateStatusBodySchema },
    handler: tasksController.updateStatus,
  });

  app.post('/:id/assign', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.TASK_ASSIGN)],
    schema: { body: assignBodySchema },
    handler: tasksController.assign,
  });

  app.delete('/:id', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.TASK_DELETE)],
    handler: tasksController.delete,
  });

  app.post('/bulk/status', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.TASK_BULK_OPS)],
    schema: { body: bulkStatusBodySchema },
    handler: tasksController.bulkStatus,
  });
};
