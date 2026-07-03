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
  createBatchBodySchema,
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

  // Update task details (title, description, priority, dueDate, assigneeId, departmentId)
  app.patch('/:id', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.TASK_UPDATE_ALL)],
    handler: tasksController.update,
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

  app.get('/:id/comments', {
    preHandler: [requireAuth],
    handler: tasksController.getComments,
  });

  app.post('/:id/comments', {
    preHandler: [requireAuth],
    schema: { body: { type: 'object', required: ['content'], properties: { content: { type: 'string', minLength: 1, maxLength: 2000 }, parentId: { type: 'string' } } } },
    handler: tasksController.addComment,
  });

  app.get('/:id/activity', {
    preHandler: [requireAuth],
    handler: tasksController.getActivity,
  });

  app.get('/:id/attachments', {
    preHandler: [requireAuth],
    handler: tasksController.getAttachments,
  });

  app.post('/batch', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.BATCH_CREATE)],
    schema: { body: createBatchBodySchema },
    handler: tasksController.createBatch,
  });

  app.get('/batch/:batchId', {
    preHandler: [requireAuth],
    handler: tasksController.getBatchSummary,
  });

  app.post('/batch/:batchId/nudge', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.BATCH_MANAGE)],
    handler: tasksController.nudgeBatch,
  });
};
