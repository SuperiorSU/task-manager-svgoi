import jwt from '@fastify/jwt';
import helmet from '@fastify/helmet';
import type { FastifyInstance } from 'fastify';

import { env } from './config/env.js';
import { registerCors } from './plugins/cors.plugin.js';
import { registerRateLimit } from './plugins/rateLimit.plugin.js';
import { registerMultipart } from './plugins/multipart.plugin.js';
import { registerSwagger } from './plugins/swagger.plugin.js';
import { registerSocket } from './plugins/socket.plugin.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { tasksRoutes } from './modules/tasks/tasks.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { departmentsRoutes } from './modules/departments/departments.routes.js';
import { notificationsRoutes } from './modules/notifications/notifications.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { filesRoutes } from './modules/files/files.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';
import { reportsRoutes } from './modules/reports/reports.routes.js';

export const buildApp = async (app: FastifyInstance): Promise<void> => {
  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: false, // Handled by Next.js for web
  });

  // Core plugins
  await registerCors(app);
  await registerRateLimit(app);
  await registerMultipart(app);

  if (env.NODE_ENV !== 'production') {
    await registerSwagger(app);
  }

  // JWT
  await app.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
    sign: { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  });

  // WebSocket
  await registerSocket(app);

  // Global error handler
  app.setErrorHandler(errorHandler);

  // Health check (no auth)
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API routes
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(tasksRoutes, { prefix: '/tasks' });
  await app.register(usersRoutes, { prefix: '/users' });
  await app.register(departmentsRoutes, { prefix: '/departments' });
  await app.register(notificationsRoutes, { prefix: '/notifications' });
  await app.register(dashboardRoutes, { prefix: '/dashboard' });
  await app.register(filesRoutes, { prefix: '/files' });
  await app.register(auditRoutes, { prefix: '/audit' });
  await app.register(reportsRoutes, { prefix: '/reports' });
};
