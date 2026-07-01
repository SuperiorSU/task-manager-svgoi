import type { FastifyInstance } from 'fastify';

import { prisma } from '../../config/database.js';
import { requireAuth } from '../../shared/guards/requireAuth.guard.js';
import { requirePermission } from '../../shared/guards/requirePermission.guard.js';
import { PERMISSIONS } from '../../shared/guards/permissions.js';
import { sendSuccess } from '../../utils/response.utils.js';

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
    handler: async (req, reply) => {
      const { name, code, description, headId } = req.body as {
        name: string;
        code: string;
        description?: string;
        headId?: string;
      };
      const dept = await prisma.department.create({
        data: {
          name,
          code,
          ...(description !== undefined ? { description } : {}),
          ...(headId !== undefined ? { headId } : {}),
        },
        select: deptSelect,
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
};
