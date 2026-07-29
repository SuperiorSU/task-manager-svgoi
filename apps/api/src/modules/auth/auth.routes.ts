import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../../shared/guards/requireAuth.guard.js';
import { authController } from './auth.controller.js';
import {
  loginBodySchema,
  refreshBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
  changePasswordBodySchema,
  inviteQuerySchema,
  acceptInviteBodySchema,
  verifyLoginBodySchema,
  resendLoginBodySchema,
} from './auth.schema.js';

export const authRoutes = async (app: FastifyInstance): Promise<void> => {
  app.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    schema: { body: loginBodySchema },
    handler: authController.login,
  });

  // ─── 2FA: verify the emailed login OTP, then issue the session ──────
  app.post('/login/verify', {
    config: { rateLimit: { max: 10, timeWindow: '5 minutes' } },
    schema: { body: verifyLoginBodySchema },
    handler: authController.verifyLoginOtp,
  });

  app.post('/login/resend', {
    config: { rateLimit: { max: 3, timeWindow: '15 minutes' } },
    schema: { body: resendLoginBodySchema },
    handler: authController.resendLoginOtp,
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

  // ─── Setup-invite (public — the new member has no session yet) ──────
  app.get('/invite', {
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    schema: { querystring: inviteQuerySchema },
    handler: authController.getInvite,
  });

  app.post('/accept-invite', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    schema: { body: acceptInviteBodySchema },
    handler: authController.acceptInvite,
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
