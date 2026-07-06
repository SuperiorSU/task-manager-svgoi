import { Queue } from 'bullmq';

import { bullRedis } from '../config/redis.js';

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: 100,
  removeOnFail: 200,
};

export const notificationQueue = new Queue('notifications', {
  connection: bullRedis,
  defaultJobOptions,
});

export const reportQueue = new Queue('reports', {
  connection: bullRedis,
  defaultJobOptions,
});

export const recurringTaskQueue = new Queue('recurring-tasks', {
  connection: bullRedis,
  defaultJobOptions,
});
