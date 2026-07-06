import { Redis } from 'ioredis';

import { env } from './env.js';

// rediss:// scheme enables TLS automatically in ioredis
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => Math.min(times * 100, 3000),
  lazyConnect: true,
  // Required for Redis Cloud TLS (rejects invalid/self-signed certs in prod)
  tls: env.REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: true } : undefined,
  enableAutoPipelining: true,
  connectTimeout: 10_000,
  commandTimeout: 5_000,
});

redis.on('error', (err: Error) => {
  console.error('[Redis] connection error:', err);
});

redis.on('connect', () => {
  console.log('[Redis] connected');
});

redis.on('reconnecting', () => {
  console.warn('[Redis] reconnecting...');
});

// BullMQ's blocking commands (Worker) require maxRetriesPerRequest: null on
// the connection it's given — sharing the general-purpose `redis` client
// (which sets a finite retry count for regular command reliability) throws
// at Worker construction time. Kept as a separate connection for that reason.
export const bullRedis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  tls: env.REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: true } : undefined,
});

bullRedis.on('error', (err: Error) => {
  console.error('[Redis:BullMQ] connection error:', err);
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
