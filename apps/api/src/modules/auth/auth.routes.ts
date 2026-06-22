import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../../shared/guards/requireAuth.guard.js';
import { authController } from './auth.controller.js';
import {
  loginBodySchema,
  refreshBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
  changePasswordBodySchema,
} from './auth.schema.js';

export const authRoutes = async (app: FastifyInstance): Promise<void> => {
  app.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    schema: { body: loginBodySchema },
    handler: authController.login,
  });

  app.post('/refresh', {
    schema: { body: refreshBodySchema },
    handler: authController.refresh,
  });

  app.post('/logout', {
    schema: { body: refreshBodySchema },
    handler: authController.logout,
  });

  app.post('/forgot-password', {
    config: { rateLimit: { max: 3, timeWindow: '1 hour' } },
    schema: { body: forgotPasswordBodySchema },
    handler: authController.forgotPassword,
  });

  app.post('/reset-password', {
    schema: { body: resetPasswordBodySchema },
    handler: authController.resetPassword,
  });

  app.post('/change-password', {
    preHandler: [requireAuth],
    schema: { body: changePasswordBodySchema },
    handler: authController.changePassword,
  });

  app.get('/me', {
    preHandler: [requireAuth],
    handler: authController.getProfile,
  });
};
