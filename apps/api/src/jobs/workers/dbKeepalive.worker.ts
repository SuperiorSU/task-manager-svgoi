import cron from 'node-cron';
import type { Logger } from 'pino';

import { prisma } from '../../config/database.js';

// Supabase free tier pauses the database after 7 days of inactivity.
// This job runs a cheap SELECT 1 every 12 hours to keep the connection alive.
export function startDbKeepalive(logger: Logger): cron.ScheduledTask {
  const ping = async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info('db-keepalive: ping OK');
    } catch (err) {
      logger.error({ err }, 'db-keepalive: ping FAILED — Supabase may be pausing');
    }
  };

  // Ping immediately at startup so the DB is warm before the first real request
  ping();

  // Then every 12 hours: at minute 0 of every 12th hour
  return cron.schedule('0 */12 * * *', ping);
}
