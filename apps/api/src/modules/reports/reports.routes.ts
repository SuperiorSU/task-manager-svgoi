import type { FastifyInstance } from 'fastify';
import type { GenerateReportDto } from '@godigitify/types';

import { requireAuth } from '../../shared/guards/requireAuth.guard.js';
import { requirePermission } from '../../shared/guards/requirePermission.guard.js';
import { PERMISSIONS } from '../../shared/guards/permissions.js';
import { writeAuditLog } from '../../utils/audit.utils.js';
import { reportsService } from './reports.service.js';

const generateReportBodySchema = {
  type: 'object',
  required: ['type', 'scope', 'dateRange', 'format'],
  additionalProperties: false,
  properties: {
    type: {
      type: 'string',
      enum: ['TASK_SUMMARY', 'USER_PERFORMANCE', 'DEPARTMENT_COMPARISON', 'OVERDUE_ANALYSIS', 'CROSS_DEPT_ASSIGNMENT'],
    },
    scope: { type: 'string', enum: ['org', 'department', 'admin', 'employee'] },
    targetId: { type: 'string' },
    dateRange: {
      type: 'object',
      required: ['from', 'to'],
      additionalProperties: false,
      properties: { from: { type: 'string' }, to: { type: 'string' } },
    },
    filters: {
      type: 'object',
      additionalProperties: false,
      properties: { status: { type: 'string' }, priority: { type: 'string' } },
    },
    format: { type: 'string', enum: ['csv', 'xlsx', 'pdf'] },
  },
} as const;

export const reportsRoutes = async (app: FastifyInstance): Promise<void> => {
  // Generate a report and stream the file back (CSV / Excel / PDF). Synchronous:
  // at this data size a report builds well within a request timeout, so there's
  // no need for the async queue + polling dance.
  app.post('/generate', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.REPORT_VIEW)],
    schema: { body: generateReportBodySchema },
    handler: async (req, reply) => {
      const dto = req.body as GenerateReportDto;
      const { filename, contentType, buffer } = await reportsService.generate(dto, {
        id: req.user.id,
        role: req.user.role,
        departmentId: req.user.departmentId,
      });

      await writeAuditLog({
        action: 'CREATE',
        entityType: 'Report',
        entityId: filename,
        description: `Report generated: ${dto.type} (${dto.scope}, ${dto.format})`,
        actorId: req.user.id,
      });

      return reply
        .header('Content-Type', contentType)
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .header('Content-Length', buffer.length)
        .send(buffer);
    },
  });
};
