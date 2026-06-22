import type { User } from '@godigitify/types';

import { getApiClient } from './client';

export const usersApi = {
  getList: (departmentId?: string) =>
    getApiClient().get<User[]>('/users', departmentId ? { departmentId } : undefined),

  getById: (id: string) => getApiClient().get<User>(`/users/${id}`),

  create: (dto: unknown) => getApiClient().post<User>('/users', dto),

  update: (id: string, dto: unknown) => getApiClient().patch<User>(`/users/${id}`, dto),

  deactivate: (id: string) => getApiClient().patch<void>(`/users/${id}/deactivate`),

  updateProfile: (dto: unknown) => getApiClient().patch<User>('/users/me', dto),

  registerPushToken: (token: string, platform: 'ios' | 'android') =>
    getApiClient().post<void>('/users/push-token', { token, platform }),
};
