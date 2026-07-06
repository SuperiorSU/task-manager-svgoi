import cron from 'node-cron';
import type { FastifyBaseLogger } from 'fastify';

import { prisma } from '../../config/database.js';

const RETENTION_DAYS = 90;
const BATCH_SIZE = 500;

// Unread notifications are never auto-deleted — only read ones older than the
// retention window, so an unseen alert can never be silently lost.
const runRetentionCleanup = async (log: FastifyBaseLogger): Promise<void> => {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  let totalDeleted = 0;

  for (;;) {
    const stale = await prisma.notification.findMany({
      where: { isRead: true, createdAt: { lt: cutoff } },
      select: { id: true },
      take: BATCH_SIZE,
    });
    if (stale.length === 0) break;

    await prisma.notification.deleteMany({ where: { id: { in: stale.map((n) => n.id) } } });
    totalDeleted += stale.length;
    if (stale.length < BATCH_SIZE) break;
  }

  if (totalDeleted > 0) log.info({ totalDeleted }, '[NotificationRetention] Purged old read notifications');
};

export const startNotificationRetention = (log: FastifyBaseLogger): cron.ScheduledTask =>
  cron.schedule('30 3 * * *', () => {
    runRetentionCleanup(log).catch((err) => log.error({ err }, '[NotificationRetention] run failed'));
  });
