import Fastify from 'fastify';

import { env } from './config/env.js';
import { loggerConfig } from './config/logger.js';
import { buildApp } from './app.js';
import { prisma } from './config/database.js';
import { redis } from './config/redis.js';
import { startDbKeepalive } from './jobs/workers/dbKeepalive.worker.js';

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

  const shutdown = async () => {
    app.log.info('Shutting down...');
    keepalive.stop();
    await app.close();
    await prisma.$disconnect();
    redis.disconnect();
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
