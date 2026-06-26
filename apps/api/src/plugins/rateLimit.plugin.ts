import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

import { redis } from '../config/redis.js';

export const registerRateLimit = async (app: FastifyInstance): Promise<void> => {
  // Probe Redis before handing it to the rate limiter — if it's unavailable
  // the plugin falls back to in-memory so the app still starts and auth works.
  let redisStore: typeof redis | undefined;
  try {
    await redis.ping();
    redisStore = redis;
  } catch {
    app.log.warn('[RateLimit] Redis unavailable — falling back to in-memory rate limiting');
  }

  await app.register(rateLimit, {
    global: false,
    redis: redisStore,
    keyGenerator: (req) => (req.user?.id ?? req.ip),
  });
};
