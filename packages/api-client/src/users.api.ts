import type {
  User,
  CreateUserResult,
  AssignableUser,
  Role,
  ChangeUserRoleDto,
  NotificationPreferences,
  UpdateNotificationPreferencesDto,
} from '@godigitify/types';

import { getApiClient } from './client';

export type UserFilters = {
  departmentId?: string;
  role?: Role;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

export type UserListResponse = { items: User[]; total: number; page: number; limit: number };

export type UserTaskStats = { assigned: number; completed: number; overdue: number; onTimeRate: number };

export const usersApi = {
  /** Paginated list — matches GET /users?page&limit&search&role&isActive&departmentId */
  getList: (filters?: UserFilters) =>
    getApiClient().get<UserListResponse>('/users', filters as Record<string, string | number | boolean | undefined>),

  /**
   * Candidates for task assign/reassign. Unlike `getList` (department-locked
   * for an Admin), this reads across departments per the §2 assignment matrix,
   * and returns a narrow projection with no email/phone.
   */
  getAssignable: (filters?: { departmentId?: string; search?: string; limit?: number }) =>
    getApiClient().get<AssignableUser[]>(
      '/users/assignable',
      filters as Record<string, string | number | boolean | undefined>
    ),

  getById: (id: string) => getApiClient().get<User>(`/users/${id}`),

  getTaskStats: (id: string) => getApiClient().get<UserTaskStats>(`/users/${id}/task-stats`),

  create: (dto: unknown) => getApiClient().post<CreateUserResult>('/users', dto),

  update: (id: string, dto: unknown) => getApiClient().patch<User>(`/users/${id}`, dto),

  deactivate: (id: string) => getApiClient().patch<void>(`/users/${id}/deactivate`),

  reactivate: (id: string) => getApiClient().patch<void>(`/users/${id}/reactivate`),

  resetPassword: (id: string) => getApiClient().patch<void>(`/users/${id}/reset-password`),

  updateProfile: (dto: unknown) => getApiClient().patch<User>('/users/me', dto),

  changeRole: (id: string, dto: ChangeUserRoleDto) =>
    getApiClient().patch<User>(`/users/${id}/role`, dto),

  getNotificationPreferences: () =>
    getApiClient().get<NotificationPreferences>('/users/me/notification-preferences'),

  updateNotificationPreferences: (dto: UpdateNotificationPreferencesDto) =>
    getApiClient().patch<NotificationPreferences>('/users/me/notification-preferences', dto),

  registerPushToken: (token: string, platform: 'ios' | 'android') =>
    getApiClient().post<void>('/users/push-token', { token, platform }),
};
