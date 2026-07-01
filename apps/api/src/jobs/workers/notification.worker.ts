import { Worker } from 'bullmq';
import { Expo } from 'expo-server-sdk';

import { redis } from '../../config/redis.js';
import { prisma } from '../../config/database.js';

const expo = new Expo();

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

    const messages = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        title,
        body,
        ...(data ? { data } : {}),
        sound: 'default' as const,
        priority,
      }));

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  },
  { connection: redis, concurrency: 5 }
);

notificationWorker.on('failed', (job, err) => {
  console.error(`Notification job ${job?.id} failed:`, err.message);
});
