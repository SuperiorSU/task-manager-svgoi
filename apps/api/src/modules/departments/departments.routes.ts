import type { FastifyInstance } from 'fastify';

import { prisma } from '../../config/database.js';
import { cache } from '../../config/redis.js';
import { requireAuth } from '../../shared/guards/requireAuth.guard.js';
import { requirePermission } from '../../shared/guards/requirePermission.guard.js';
import { PERMISSIONS } from '../../shared/guards/permissions.js';
import { sendSuccess, sendError, ErrorCodes } from '../../utils/response.utils.js';

const deptSelect = {
  id: true,
  name: true,
  code: true,
  description: true,
  isActive: true,
  headId: true,
  createdAt: true,
  updatedAt: true,
  head: { select: { id: true, name: true } },
  _count: { select: { users: true, tasks: true } },
} as const;

const updateDeptSettingsBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    workingDays: {
      type: 'array',
      items: { type: 'integer', minimum: 0, maximum: 6 },
    },
    workingHoursStart: { type: 'string' },
    workingHoursEnd: { type: 'string' },
    weeklyHoliday: { type: 'integer', minimum: 0, maximum: 6 },
    defaultPriority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    defaultDueWindowDays: { type: 'integer', minimum: 1 },
    membersSeeOnlyOwnTasks: { type: 'boolean' },
    taskCategories: { type: 'array', items: { type: 'string' } },
    requireProofOfWork: { type: 'boolean' },
    autoApproveLowPriority: { type: 'boolean' },
    onRejection: { type: 'string' },
    approverScope: { type: 'string' },
    reviewWithinHours: { type: 'integer', minimum: 1 },
    escalateOverdueReviews: { type: 'boolean' },
  },
} as const;

export const departmentsRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get('/', {
    preHandler: [requireAuth],
    handler: async (_req, reply) => {
      const depts = await prisma.department.findMany({
        where: { isActive: true },
        select: deptSelect,
        orderBy: { name: 'asc' },
      });
      return sendSuccess(reply, depts);
    },
  });

  app.get('/:id', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      const dept = await prisma.department.findUnique({
        where: { id: (req.params as { id: string }).id },
        select: deptSelect,
      });
      if (!dept) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Department not found' } });
      return sendSuccess(reply, dept);
    },
  });

  app.post('/', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.DEPT_MANAGE)],
    schema: {
      body: {
        type: 'object',
        required: ['name', 'code'],
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          code: { type: 'string' },
          description: { type: 'string' },
          headId: { type: 'string' },
          settings: updateDeptSettingsBodySchema,
        },
      },
    },
    handler: async (req, reply) => {
      const { name, code, description, headId, settings } = req.body as {
        name: string;
        code: string;
        description?: string;
        headId?: string;
        settings?: Record<string, unknown>;
      };

      const dept = await prisma.$transaction(async (tx) => {
        const created = await tx.department.create({
          data: {
            name,
            code,
            ...(description !== undefined ? { description } : {}),
            ...(headId !== undefined ? { headId } : {}),
          },
          select: deptSelect,
        });

        if (settings) {
          await tx.departmentSettings.create({
            data: { departmentId: created.id, ...settings } as never,
          });
        }

        return created;
      });

      return sendSuccess(reply, dept, 201);
    },
  });

  app.patch('/:id', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.DEPT_MANAGE)],
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const dept = await prisma.department.update({
        where: { id },
        data: req.body as never,
        select: deptSelect,
      });
      return sendSuccess(reply, dept);
    },
  });

  app.get('/:id/settings', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };

      if (req.user.role === 'ADMIN' && req.user.departmentId !== id) {
        return sendError(reply, 403, ErrorCodes.FORBIDDEN, 'Insufficient permissions');
      }

      const cacheKey = `department:settings:${id}`;
      const cached = await cache.get<unknown>(cacheKey).catch(() => null);
      if (cached) return sendSuccess(reply, cached);

      const dept = await prisma.department.findUnique({ where: { id }, select: { id: true } });
      if (!dept) return sendError(reply, 404, ErrorCodes.NOT_FOUND, 'Department not found');

      let settings = await prisma.departmentSettings.findUnique({ where: { departmentId: id } });
      if (!settings) {
        settings = await prisma.departmentSettings.create({ data: { departmentId: id } });
      }

      void cache.set(cacheKey, settings, 600).catch(() => {});
      return sendSuccess(reply, settings);
    },
  });

  app.patch('/:id/settings', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.DEPT_SETTINGS_MANAGE)],
    schema: { body: updateDeptSettingsBodySchema },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };

      const dept = await prisma.department.findUnique({ where: { id }, select: { id: true } });
      if (!dept) return sendError(reply, 404, ErrorCodes.NOT_FOUND, 'Department not found');

      const body = req.body as Record<string, unknown>;
      const settings = await prisma.departmentSettings.upsert({
        where: { departmentId: id },
        update: body as never,
        create: { departmentId: id, ...body } as never,
      });

      void cache.del(`department:settings:${id}`).catch(() => {});
      return sendSuccess(reply, settings);
    },
  });
};
