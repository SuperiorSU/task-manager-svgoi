import type { FastifyReply, FastifyRequest } from 'fastify';

import { sendSuccess, sendError, ErrorCodes } from '../../utils/response.utils.js';
import { setAuthCookies, clearAuthCookies, setTrustedDeviceCookie } from '../../utils/authCookies.utils.js';
import { authService } from './auth.service.js';

export const authController = {
  async login(request: FastifyRequest, reply: FastifyReply) {
    const { employeeId, password } = request.body as { employeeId: string; password: string };
    const platform = request.headers['x-client-platform'] as string | undefined;
    const result = await authService.login(
      employeeId,
      password,
      request.ip,
      request.headers['user-agent'] ?? '',
      request.server,
      {
        // Web logins require an emailed OTP as a second factor.
        requireMfa: platform === 'web',
        trustedDeviceCookie: request.cookies?.['trusted_device'],
        platform,
      }
    );
    // Web 2FA: no session yet — the client collects the code and calls verify.
    if ('mfaRequired' in result) {
      return sendSuccess(reply, result, 200); // { mfaRequired: true, challengeId }
    }
    // Web reads the session from these cookies; mobile reads result.tokens.
    setAuthCookies(reply, result.tokens);
    return sendSuccess(reply, result, 200);
  },

  async verifyLoginOtp(request: FastifyRequest, reply: FastifyReply) {
    const { challengeId, code, trustDevice } = request.body as {
      challengeId: string;
      code: string;
      trustDevice?: boolean;
    };
    const result = await authService.verifyLoginOtp(
      challengeId,
      code,
      request.ip,
      request.headers['user-agent'] ?? '',
      request.server,
      trustDevice ?? false
    );
    setAuthCookies(reply, result.tokens);
    if (result.trustedToken) setTrustedDeviceCookie(reply, result.trustedToken);
    const { trustedToken: _t, ...body } = result;
    return sendSuccess(reply, body, 200);
  },

  async resendLoginOtp(request: FastifyRequest, reply: FastifyReply) {
    const { challengeId } = request.body as { challengeId: string };
    await authService.resendLoginOtp(challengeId);
    return sendSuccess(reply, { message: 'A new code is on its way.' });
  },

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    // Mobile sends the refresh token in the body; web sends it as a cookie.
    const body = request.body as { refreshToken?: string };
    const raw = body.refreshToken ?? request.cookies?.['refresh_token'];
    if (!raw) return sendError(reply, 401, ErrorCodes.UNAUTHORIZED, 'No refresh token provided');
    const tokens = await authService.refresh(raw, request.server);
    setAuthCookies(reply, tokens);
    return sendSuccess(reply, tokens);
  },

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as { refreshToken?: string };
    const raw = body.refreshToken ?? request.cookies?.['refresh_token'];
    if (raw) await authService.logout(raw);
    clearAuthCookies(reply);
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

  async getInvite(request: FastifyRequest, reply: FastifyReply) {
    const { token } = request.query as { token: string };
    const invite = await authService.getInvite(token);
    return sendSuccess(reply, invite);
  },

  async acceptInvite(request: FastifyRequest, reply: FastifyReply) {
    const { token, password } = request.body as { token: string; password: string };
    await authService.acceptInvite(token, password);
    return sendSuccess(reply, { message: 'Account set up successfully. You can now sign in.' });
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
