import type { NotificationType } from '@godigitify/types';

import { prisma } from '../../config/database.js';
import { redis } from '../../config/redis.js';
import { notificationQueue } from '../../jobs/queue.js';
import { socketRegistry } from '../../plugins/socket.plugin.js';
import { buildNotificationContent } from './templates.js';

const PUSH_THROTTLE_TTL_SECONDS = 60;

type NotifyInput = {
  type: NotificationType;
  /** Recipient user ids. Falsy values and the actor are filtered out automatically. */
  recipientIds: Array<string | null | undefined>;
  taskId?: string | undefined;
  /** Id of the user who performed the triggering action — never notified of their own action. */
  actorId?: string | undefined;
  actorName?: string | undefined;
  taskTitle?: string | undefined;
  statusLabel?: string | undefined;
  /** Defaults to 'default'; use 'high' for Critical/High priority events (assignment, overdue). */
  pushPriority?: 'default' | 'high' | undefined;
  /** Aggregate messages (digests/reports) don't map to one task — supply copy directly. */
  titleOverride?: string | undefined;
  bodyOverride?: string | undefined;
};

const isWithinQuietHours = (start: string, end: string, now: Date): boolean => {
  const [startHour = 0, startMin = 0] = start.split(':').map(Number);
  const [endHour = 0, endMin = 0] = end.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  // Overnight range, e.g. 22:00 -> 07:00
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
};

/**
 * Single fan-out entry point for every notification-producing event in the app.
 * Always writes the in-app Notification row; only enqueues a push if the
 * recipient's preferences allow it. Never throws — a notification failure
 * must never fail the mutation that triggered it.
 */
export const notifyUsers = async (input: NotifyInput): Promise<void> => {
  const recipients = Array.from(
    new Set(
      input.recipientIds.filter((id): id is string => Boolean(id) && id !== input.actorId)
    )
  );
  if (recipients.length === 0) return;

  const { title, body } =
    input.titleOverride && input.bodyOverride
      ? { title: input.titleOverride, body: input.bodyOverride }
      : buildNotificationContent(input.type, {
          actorName: input.actorName,
          taskTitle: input.taskTitle,
          statusLabel: input.statusLabel,
        });

  try {
    await prisma.notification.createMany({
      data: recipients.map((userId) => ({
        type: input.type as never,
        title,
        body,
        userId,
        ...(input.taskId ? { taskId: input.taskId } : {}),
      })),
    });
  } catch (err) {
    console.error('[Notifications] Failed to write in-app notification rows:', err);
  }

  for (const userId of recipients) {
    try {
      socketRegistry.io?.to(`user:${userId}`).emit('notification:new', {
        type: input.type,
        title,
        body,
        taskId: input.taskId,
      });
    } catch (err) {
      console.error('[Notifications] Socket emit failed:', err);
    }
  }

  let prefsByUser = new Map<string, { pushEnabled: boolean; mutedTypes: unknown; quietHoursEnabled: boolean; quietHoursStart: string; quietHoursEnd: string }>();
  try {
    const prefs = await prisma.notificationPreference.findMany({
      where: { userId: { in: recipients } },
    });
    prefsByUser = new Map(prefs.map((p) => [p.userId, p]));
  } catch (err) {
    console.error('[Notifications] Failed to load preferences, sending push to all recipients:', err);
  }

  const now = new Date();

  for (const userId of recipients) {
    const pref = prefsByUser.get(userId);
    // No preference row yet means schema defaults apply: push enabled, nothing muted.
    if (pref) {
      if (!pref.pushEnabled) continue;
      const muted = (pref.mutedTypes as string[] | null) ?? [];
      if (muted.includes(input.type)) continue;
      if (pref.quietHoursEnabled && isWithinQuietHours(pref.quietHoursStart, pref.quietHoursEnd, now)) {
        continue;
      }
    }

    try {
      const throttleKey = `notif:throttle:${userId}:${input.type}:${input.taskId ?? 'none'}`;
      const acquired = await redis.set(throttleKey, '1', 'EX', PUSH_THROTTLE_TTL_SECONDS, 'NX');
      if (!acquired) continue;
    } catch (err) {
      console.error('[Notifications] Throttle check failed, proceeding without it:', err);
    }

    try {
      await notificationQueue.add('send', {
        userId,
        title,
        body,
        data: {
          type: input.type,
          ...(input.taskId ? { taskId: input.taskId, screen: `/(app)/tasks/${input.taskId}` } : {}),
        },
        priority: input.pushPriority ?? 'default',
      });
    } catch (err) {
      console.error('[Notifications] Failed to enqueue push job:', err);
    }
  }
};
