import cron from 'node-cron';
import type { FastifyBaseLogger } from 'fastify';

import { prisma } from '../../config/database.js';
import { redis } from '../../config/redis.js';
import { notifyUsers } from '../../modules/notifications/notifications.service.js';

const PAGE_SIZE = 200;
const MARKER_TTL_SECONDS = 60 * 60 * 24 * 7; // one reminder per task per window is enough

type Window = { marker: string; windowMs: number; recipients: 'assignee' | 'both' };

const runDueSoonWindow = async (log: FastifyBaseLogger, window: Window): Promise<void> => {
  const now = new Date();
  const horizon = new Date(now.getTime() + window.windowMs);
  let cursor: string | undefined;

  for (;;) {
    const tasks = await prisma.task.findMany({
      where: {
        isDeleted: false,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: { gte: now, lte: horizon },
      },
      select: { id: true, title: true, assigneeId: true, creatorId: true },
      take: PAGE_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: 'asc' },
    });
    if (tasks.length === 0) break;

    for (const task of tasks) {
      try {
        const markerKey = `${window.marker}:${task.id}`;
        const acquired = await redis.set(markerKey, '1', 'EX', MARKER_TTL_SECONDS, 'NX');
        if (!acquired) continue;
      } catch (err) {
        log.error({ err, taskId: task.id }, '[DueSoonCheck] Marker check failed, skipping to avoid duplicate spam');
        continue;
      }

      await notifyUsers({
        type: 'TASK_DUE_SOON',
        recipientIds: window.recipients === 'both' ? [task.assigneeId, task.creatorId] : [task.assigneeId],
        taskId: task.id,
        taskTitle: task.title,
        pushPriority: window.recipients === 'assignee' ? 'high' : 'default',
      });
    }

    cursor = tasks[tasks.length - 1]?.id;
    if (tasks.length < PAGE_SIZE) break;
  }
};

export const startDueSoonCheck = (log: FastifyBaseLogger): cron.ScheduledTask[] => {
  // Due in next 24h — assignee + creator, checked hourly.
  const dueIn24h = cron.schedule('0 * * * *', () => {
    runDueSoonWindow(log, { marker: 'duesoon:24h', windowMs: 24 * 60 * 60 * 1000, recipients: 'both' }).catch(
      (err) => log.error({ err }, '[DueSoonCheck] 24h run failed')
    );
  });

  // Due in next 60 minutes — urgent, assignee only, checked every 5 minutes.
  const dueIn60min = cron.schedule('*/5 * * * *', () => {
    runDueSoonWindow(log, { marker: 'duesoon:60min', windowMs: 60 * 60 * 1000, recipients: 'assignee' }).catch(
      (err) => log.error({ err }, '[DueSoonCheck] 60min run failed')
    );
  });

  return [dueIn24h, dueIn60min];
};
