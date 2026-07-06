import cron from 'node-cron';
import type { FastifyBaseLogger } from 'fastify';

import { prisma } from '../../config/database.js';
import { redis } from '../../config/redis.js';
import { notifyUsers } from '../../modules/notifications/notifications.service.js';

const PAGE_SIZE = 200;
const MARKER_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days — generous enough that a task won't
// realistically stay overdue past it, so a rare duplicate re-notification is an acceptable trade
// for not needing a dedicated schema column to track escalation tiers.

// Highest-hours-first: a task is scored against the first tier it qualifies for,
// so each tier fires exactly once as the task crosses that threshold.
const TIERS = [
  { name: 'further', minHours: 24 },
  { name: 'escalation', minHours: 4 },
  { name: 'initial', minHours: 0 },
] as const;

const runOverdueCheck = async (log: FastifyBaseLogger): Promise<void> => {
  const now = new Date();
  let cursor: string | undefined;

  for (;;) {
    const tasks = await prisma.task.findMany({
      where: { isDeleted: false, status: { notIn: ['COMPLETED', 'CANCELLED'] }, dueDate: { lt: now } },
      select: {
        id: true,
        title: true,
        dueDate: true,
        assigneeId: true,
        creatorId: true,
        assignee: { select: { managerId: true } },
        department: { select: { headId: true } },
      },
      take: PAGE_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: 'asc' },
    });
    if (tasks.length === 0) break;

    for (const task of tasks) {
      const hoursOverdue = (now.getTime() - task.dueDate.getTime()) / (60 * 60 * 1000);
      // TIERS' last entry has minHours: 0, so find() always matches — the fallback is unreachable.
      const tier = TIERS.find((t) => hoursOverdue >= t.minHours) ?? TIERS[TIERS.length - 1]!;

      try {
        const markerKey = `overdue:${tier.name}:${task.id}`;
        const acquired = await redis.set(markerKey, '1', 'EX', MARKER_TTL_SECONDS, 'NX');
        if (!acquired) continue;
      } catch (err) {
        log.error({ err, taskId: task.id }, '[OverdueCheck] Marker check failed, skipping to avoid duplicate spam');
        continue;
      }

      const managerOrCreator = task.assignee.managerId ?? task.creatorId;
      const recipientIds =
        tier.name === 'initial'
          ? [task.assigneeId]
          : tier.name === 'escalation'
          ? [task.assigneeId, managerOrCreator]
          : [task.assigneeId, managerOrCreator, task.department?.headId];

      await notifyUsers({
        type: 'TASK_OVERDUE',
        recipientIds,
        taskId: task.id,
        taskTitle: task.title,
        pushPriority: 'high',
      });
    }

    cursor = tasks[tasks.length - 1]?.id;
    if (tasks.length < PAGE_SIZE) break;
  }
};

export const startOverdueCheck = (log: FastifyBaseLogger): cron.ScheduledTask =>
  cron.schedule('0 * * * *', () => {
    runOverdueCheck(log).catch((err) => log.error({ err }, '[OverdueCheck] run failed'));
  });
