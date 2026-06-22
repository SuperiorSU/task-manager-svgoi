import Redis from 'ioredis';

import { env } from './env.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export const cache = {
  get: async <T>(key: string): Promise<T | null> => {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  },

  set: async (key: string, data: unknown, ttlSeconds = 300): Promise<void> => {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  },

  del: async (...keys: string[]): Promise<void> => {
    if (keys.length) await redis.del(...keys);
  },

  delPattern: async (pattern: string): Promise<void> => {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  },

  incr: async (key: string, ttlSeconds?: number): Promise<number> => {
    const count = await redis.incr(key);
    if (ttlSeconds && count === 1) await redis.expire(key, ttlSeconds);
    return count;
  },

  exists: async (key: string): Promise<boolean> => {
    return (await redis.exists(key)) === 1;
  },
};
