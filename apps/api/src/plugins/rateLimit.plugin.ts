import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

import { redis } from '../config/redis.js';

export const registerRateLimit = async (app: FastifyInstance): Promise<void> => {
  await app.register(rateLimit, {
    global: false,
    redis,
    keyGenerator: (req) =>
      (req.user?.id ?? req.ip),
  });
};
