import { Queue } from 'bullmq';

import { redis } from '../config/redis.js';

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: 100,
  removeOnFail: 200,
};

export const notificationQueue = new Queue('notifications', {
  connection: redis,
  defaultJobOptions,
});

export const reportQueue = new Queue('reports', {
  connection: redis,
  defaultJobOptions,
});

export const recurringTaskQueue = new Queue('recurring-tasks', {
  connection: redis,
  defaultJobOptions,
});
