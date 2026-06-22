import type { AuthTokens, User } from '@godigitify/types';

import { getApiClient } from './client';

export const authApi = {
  login: (employeeId: string, password: string) =>
    getApiClient().post<{ tokens: AuthTokens; user: User }>('/auth/login', {
      employeeId,
      password,
    }),

  logout: () => getApiClient().post<void>('/auth/logout'),

  refresh: (refreshToken: string) =>
    getApiClient().post<AuthTokens>('/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) =>
    getApiClient().post<void>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    getApiClient().post<void>('/auth/reset-password', { token, password }),

  changePassword: (currentPassword: string, newPassword: string) =>
    getApiClient().post<void>('/auth/change-password', { currentPassword, newPassword }),

  getProfile: () => getApiClient().get<User>('/auth/me'),
};
