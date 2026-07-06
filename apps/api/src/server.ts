import Fastify from 'fastify';

import { env } from './config/env.js';
import { loggerConfig } from './config/logger.js';
import { buildApp } from './app.js';
import { prisma } from './config/database.js';
import { redis, bullRedis } from './config/redis.js';
import { startDbKeepalive } from './jobs/workers/dbKeepalive.worker.js';
import { notificationWorker } from './jobs/workers/notification.worker.js';
import { startPushReceiptCheck } from './jobs/workers/pushReceiptCheck.worker.js';
import { startOverdueCheck } from './jobs/workers/overdueCheck.worker.js';
import { startDueSoonCheck } from './jobs/workers/dueSoonCheck.worker.js';
import { startDigestJobs } from './jobs/workers/digest.worker.js';
import { startNotificationRetention } from './jobs/workers/notificationRetention.worker.js';

async function main() {
  const app = Fastify({
    logger: loggerConfig,
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: 'array',
        useDefaults: true,
      },
    },
    trustProxy: true,
  });

  await buildApp(app);

  const keepalive = startDbKeepalive(app.log);
  const pushReceiptCheck = startPushReceiptCheck(app.log);
  const overdueCheck = startOverdueCheck(app.log);
  const dueSoonChecks = startDueSoonCheck(app.log);
  const digestJobs = startDigestJobs(app.log);
  const notificationRetention = startNotificationRetention(app.log);
  const cronJobs = [pushReceiptCheck, overdueCheck, ...dueSoonChecks, ...digestJobs, notificationRetention];

  const shutdown = async () => {
    app.log.info('Shutting down...');
    keepalive.stop();
    for (const job of cronJobs) job.stop();
    await notificationWorker.close();
    await app.close();
    await prisma.$disconnect();
    redis.disconnect();
    bullRedis.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  await app.listen({ port: env.PORT, host: '0.0.0.0' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
