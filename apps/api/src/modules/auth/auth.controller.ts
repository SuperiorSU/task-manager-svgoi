import type { FastifyReply, FastifyRequest } from 'fastify';

import { sendSuccess, sendError, ErrorCodes } from '../../utils/response.utils.js';
import { authService } from './auth.service.js';

export const authController = {
  async login(request: FastifyRequest, reply: FastifyReply) {
    const { employeeId, password } = request.body as { employeeId: string; password: string };
    const result = await authService.login(
      employeeId,
      password,
      request.ip,
      request.headers['user-agent'] ?? '',
      request.server
    );
    return sendSuccess(reply, result, 200);
  },

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const { refreshToken } = request.body as { refreshToken: string };
    const tokens = await authService.refresh(refreshToken, request.server);
    return sendSuccess(reply, tokens);
  },

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const { refreshToken } = request.body as { refreshToken: string };
    await authService.logout(refreshToken);
    return sendSuccess(reply, null);
  },

  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    const { email } = request.body as { email: string };
    await authService.forgotPassword(email);
    return sendSuccess(reply, { message: 'If this email is registered, you will receive a reset link.' });
  },

  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    const { token, password } = request.body as { token: string; password: string };
    await authService.resetPassword(token, password);
    return sendSuccess(reply, { message: 'Password reset successfully.' });
  },

  async changePassword(request: FastifyRequest, reply: FastifyReply) {
    const { currentPassword, newPassword } = request.body as {
      currentPassword: string;
      newPassword: string;
    };
    await authService.changePassword(request.user.id, currentPassword, newPassword);
    return sendSuccess(reply, { message: 'Password changed successfully.' });
  },

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    const user = await authService.getProfile(request.user.id);
    return sendSuccess(reply, user);
  },
};
