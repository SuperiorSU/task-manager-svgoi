import { Worker } from 'bullmq';
import { Expo } from 'expo-server-sdk';

import { redis, bullRedis } from '../../config/redis.js';
import { prisma } from '../../config/database.js';

const expo = new Expo();

// Ticket ids from Expo's send response are stashed here (short TTL) so a
// follow-up cron (pushReceiptCheck.worker.ts) can look up delivery receipts
// and prune tokens Expo reports as DeviceNotRegistered.
const PENDING_RECEIPTS_HASH = 'push:pending-receipts';

type NotificationJob = {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: 'default' | 'high';
};

export const notificationWorker = new Worker<NotificationJob>(
  'notifications',
  async (job) => {
    const { userId, title, body, data, priority = 'default' } = job.data;

    const tokens = await prisma.pushToken.findMany({ where: { userId } });
    if (!tokens.length) return;

    const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t.token));
    const messages = validTokens.map((t) => ({
      to: t.token,
      title,
      body,
      ...(data ? { data } : {}),
      sound: 'default' as const,
      priority,
      // Android only — routes to the distinct high-visibility channel set up
      // client-side in notification.service.ts. Ignored by iOS.
      channelId: priority === 'high' ? 'high-priority' : 'default',
    }));

    const chunks = expo.chunkPushNotifications(messages);
    let cursor = 0;
    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      const chunkTokens = validTokens.slice(cursor, cursor + chunk.length);
      cursor += chunk.length;

      for (const [i, ticket] of tickets.entries()) {
        if (ticket.status === 'ok') {
          // Best-effort bookkeeping for the receipt-check cron — a Redis hiccup
          // here just means that one ticket never gets receipt-checked.
          void redis
            .hset(PENDING_RECEIPTS_HASH, ticket.id, chunkTokens[i]?.token ?? '')
            .catch((err) => console.error('[Notifications] Failed to stash push ticket:', err));
        } else if (ticket.details?.error === 'DeviceNotRegistered' && chunkTokens[i]) {
          void prisma.pushToken
            .delete({ where: { token: chunkTokens[i].token } })
            .catch(() => undefined); // already deleted/race — not an error
        }
      }
    }
  },
  { connection: bullRedis, concurrency: 5 }
);

notificationWorker.on('failed', (job, err) => {
  console.error(`Notification job ${job?.id} failed:`, err.message);
});
