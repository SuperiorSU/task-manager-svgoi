import type { AuthTokens, User, InviteInfo, MfaChallenge } from '@godigitify/types';

import { getApiClient } from './client';

export type LoginSession = { tokens: AuthTokens; user: User };
/** Login returns a session (mobile / trusted web) OR a 2FA challenge (web). */
export type LoginResult = LoginSession | MfaChallenge;

export const authApi = {
  login: (employeeId: string, password: string) =>
    getApiClient().post<LoginResult>('/auth/login', {
      employeeId,
      password,
    }),

  /** Verify the emailed 2FA code and receive the session. */
  verifyLoginOtp: (challengeId: string, code: string, trustDevice?: boolean) =>
    getApiClient().post<LoginSession>('/auth/login/verify', { challengeId, code, trustDevice }),

  /** Request a fresh 2FA code for an in-flight login challenge. */
  resendLoginOtp: (challengeId: string) =>
    getApiClient().post<{ message: string }>('/auth/login/resend', { challengeId }),

  logout: (refreshToken: string) =>
    getApiClient().post<void>('/auth/logout', { refreshToken }),

  refresh: (refreshToken: string) =>
    getApiClient().post<AuthTokens>('/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) =>
    getApiClient().post<void>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    getApiClient().post<void>('/auth/reset-password', { token, password }),

  /** Look up a setup-invite (public) to greet the new member by name. */
  getInvite: (token: string) =>
    getApiClient().get<InviteInfo>('/auth/invite', { token }),

  /** Accept a setup-invite: the new member sets their first password (public). */
  acceptInvite: (token: string, password: string) =>
    getApiClient().post<{ message: string }>('/auth/accept-invite', { token, password }),

  changePassword: (currentPassword: string, newPassword: string) =>
    getApiClient().post<void>('/auth/change-password', { currentPassword, newPassword }),

  getProfile: () => getApiClient().get<User>('/auth/me'),
};
