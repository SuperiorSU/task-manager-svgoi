import cron from 'node-cron';
import type { FastifyBaseLogger } from 'fastify';
import type { TaskStatus } from '@godigitify/types';

import { prisma } from '../../config/database.js';
import { notifyUsers } from '../../modules/notifications/notifications.service.js';

const OPEN_STATUSES: TaskStatus[] = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'UNDER_REVIEW'];

// Daily 6am — one summary push per Admin, scoped strictly to their own
// department (same scoping rule as tasksService.getList for ADMIN viewers).
const runAdminDigest = async (log: FastifyBaseLogger): Promise<void> => {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true, departmentId: { not: null } },
    select: { id: true, departmentId: true },
  });

  const now = new Date();
  for (const admin of admins) {
    if (!admin.departmentId) continue;
    const [pending, overdue] = await Promise.all([
      prisma.task.count({
        where: { departmentId: admin.departmentId, isDeleted: false, status: { in: OPEN_STATUSES } },
      }),
      prisma.task.count({
        where: {
          departmentId: admin.departmentId,
          isDeleted: false,
          status: { in: OPEN_STATUSES },
          dueDate: { lt: now },
        },
      }),
    ]);
    if (pending === 0) continue;

    await notifyUsers({
      type: 'TASK_DUE_SOON',
      recipientIds: [admin.id],
      titleOverride: 'Daily task summary',
      bodyOverride:
        overdue > 0
          ? `${pending} pending task(s) in your department, ${overdue} overdue.`
          : `${pending} pending task(s) in your department.`,
    });
  }

  log.info({ adminCount: admins.length }, '[Digest] Admin daily digest sent');
};

// Weekly Monday — one org-wide summary push per active Super Admin.
const runWeeklyOrgReport = async (log: FastifyBaseLogger): Promise<void> => {
  const superAdmins = await prisma.user.findMany({
    where: { role: 'SUPER_ADMIN', isActive: true },
    select: { id: true },
  });
  if (superAdmins.length === 0) return;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [completedThisWeek, openTotal, overdueTotal] = await Promise.all([
    prisma.task.count({ where: { isDeleted: false, status: 'COMPLETED', completedAt: { gte: weekAgo } } }),
    prisma.task.count({ where: { isDeleted: false, status: { in: OPEN_STATUSES } } }),
    prisma.task.count({ where: { isDeleted: false, status: { in: OPEN_STATUSES }, dueDate: { lt: now } } }),
  ]);

  await notifyUsers({
    type: 'TASK_DUE_SOON',
    recipientIds: superAdmins.map((u) => u.id),
    titleOverride: 'Weekly organisation report',
    bodyOverride: `${completedThisWeek} completed this week · ${openTotal} open · ${overdueTotal} overdue.`,
  });

  log.info({ superAdminCount: superAdmins.length }, '[Digest] Weekly org report sent');
};

export const startDigestJobs = (log: FastifyBaseLogger): cron.ScheduledTask[] => {
  const daily = cron.schedule('0 6 * * *', () => {
    runAdminDigest(log).catch((err) => log.error({ err }, '[Digest] Daily admin digest failed'));
  });

  const weekly = cron.schedule('0 6 * * 1', () => {
    runWeeklyOrgReport(log).catch((err) => log.error({ err }, '[Digest] Weekly org report failed'));
  });

  return [daily, weekly];
};
