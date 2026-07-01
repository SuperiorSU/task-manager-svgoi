import type { FastifyInstance } from 'fastify';

import { cache } from '../../config/redis.js';
import { requireAuth } from '../../shared/guards/requireAuth.guard.js';
import { requirePermission } from '../../shared/guards/requirePermission.guard.js';
import { PERMISSIONS } from '../../shared/guards/permissions.js';
import { sendSuccess } from '../../utils/response.utils.js';
import { prisma } from '../../config/database.js';
import { writeAuditLog } from '../../utils/audit.utils.js';

const VALID_REPORT_TYPES = [
  'TASK_SUMMARY',
  'USER_PERFORMANCE',
  'DEPARTMENT_COMPARISON',
  'OVERDUE_ANALYSIS',
  'CROSS_DEPT_ASSIGNMENT',
] as const;

type ReportStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

type ReportRecord = {
  id: string;
  type: string;
  label: string;
  status: ReportStatus;
  requestedBy: string;
  requesterName: string;
  dateRange: { from: string; to: string };
  downloadUrl?: string;
  fileSizeKb?: number;
  createdAt: string;
  completedAt?: string;
};

const REPORT_LABELS: Record<string, string> = {
  TASK_SUMMARY: 'Task Summary',
  USER_PERFORMANCE: 'User Performance',
  DEPARTMENT_COMPARISON: 'Department Comparison',
  OVERDUE_ANALYSIS: 'Overdue Analysis',
  CROSS_DEPT_ASSIGNMENT: 'Cross-Dept Assignments',
};

const REPORTS_CACHE_KEY = 'reports:list';
const REPORTS_TTL = 300;

async function getReports(): Promise<ReportRecord[]> {
  const cached = await cache.get<ReportRecord[]>(REPORTS_CACHE_KEY).catch(() => null);
  return cached ?? [];
}

async function saveReports(reports: ReportRecord[]): Promise<void> {
  await cache.set(REPORTS_CACHE_KEY, reports, REPORTS_TTL).catch(() => {});
}

export const reportsRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get('/', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.REPORT_VIEW)],
    handler: async (_req, reply) => {
      const reports = await getReports();
      const sorted = [...reports].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return sendSuccess(reply, sorted);
    },
  });

  app.post('/request', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.REPORT_VIEW)],
    handler: async (req, reply) => {
      const { type, dateRange } = req.body as {
        type: string;
        dateRange?: { from: string; to: string };
      };

      if (!VALID_REPORT_TYPES.includes(type as never)) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid report type' },
        });
      }

      const requester = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { name: true },
      });

      const now = new Date().toISOString();
      const report: ReportRecord = {
        id: `report_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type,
        label: REPORT_LABELS[type] ?? type,
        status: 'QUEUED',
        requestedBy: req.user.id,
        requesterName: requester?.name ?? 'Unknown',
        dateRange: dateRange ?? {
          from: new Date(Date.now() - 30 * 86400000).toISOString(),
          to: now,
        },
        createdAt: now,
      };

      const reports = await getReports();
      reports.unshift(report);
      await saveReports(reports);

      await writeAuditLog({
        action: 'CREATE',
        entityType: 'Report',
        entityId: report.id,
        description: `Report "${report.label}" requested`,
        actorId: req.user.id,
      });

      // Simulate async processing after 3 seconds
      setTimeout(async () => {
        try {
          const current = await getReports();
          const idx = current.findIndex((r) => r.id === report.id);
          if (idx !== -1) {
            current[idx]!.status = 'PROCESSING';
            await saveReports(current);
          }
          // Complete after another 2s
          setTimeout(async () => {
            try {
              const latest = await getReports();
              const i = latest.findIndex((r) => r.id === report.id);
              if (i !== -1) {
                latest[i]!.status = 'COMPLETED';
                latest[i]!.downloadUrl = `/reports/${report.id}/download`;
                latest[i]!.fileSizeKb = Math.floor(Math.random() * 400 + 100);
                latest[i]!.completedAt = new Date().toISOString();
                await saveReports(latest);
              }
            } catch { /* swallow */ }
          }, 2000);
        } catch { /* swallow */ }
      }, 3000);

      return sendSuccess(reply, report, 202);
    },
  });

  // Stub download endpoint
  app.get('/:id/download', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.REPORT_DOWNLOAD)],
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const reports = await getReports();
      const report = reports.find((r) => r.id === id);

      if (!report || report.status !== 'COMPLETED') {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Report not ready or not found' },
        });
      }

      // In production, this would stream the actual file from object storage.
      // For now, return metadata so the client can handle it.
      return sendSuccess(reply, {
        reportId: id,
        label: report.label,
        message: 'File download would be streamed from storage in production.',
      });
    },
  });
};
