import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, usersApi, dashboardApi } from '@godigitify/api-client';
import type { User } from '@godigitify/types';

import { useAuthStore } from '../stores/auth.store';
import { queryKeys } from '../constants/queryKeys';
import {
  MOCK_NOTIFICATION_PREFS,
  type ProfileUser,
  type NotificationPreferences,
} from '../data/profile.mock';

// ─── Keys ─────────────────────────────────────────────────────────────────────

const QK = {
  profile: queryKeys.auth.profile(),
  stats: ['profile', 'stats'] as const,
  notifPrefs: ['profile', 'notif-prefs'] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useProfileData = () =>
  useQuery({
    queryKey: QK.profile,
    queryFn: () => authApi.getProfile().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

export const useProfileStats = () =>
  useQuery({
    queryKey: QK.stats,
    queryFn: () => dashboardApi.getStats('week').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

// ─── Notification preferences (stub — no backend yet) ────────────────────────
// Local-only; data survives the query cache but not reinstalls.
// Replace queryFn with a real API call when a prefs endpoint is added.

export const useNotificationPrefs = () =>
  useQuery({
    queryKey: QK.notifPrefs,
    queryFn: async () => MOCK_NOTIFICATION_PREFS,
    staleTime: Infinity,
  });

export const useUpdateNotificationPrefs = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: NotificationPreferences): Promise<NotificationPreferences> => prefs,
    onSuccess: (updated) => {
      qc.setQueryData<NotificationPreferences>(QK.notifPrefs, updated);
    },
  });
};

// ─── Profile update mutation ──────────────────────────────────────────────────

type EditableFields = { name?: string; phone?: string; avatarUrl?: string };

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: (fields: EditableFields) =>
      usersApi.updateProfile(fields).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData(QK.profile, updated);
      updateUser(updated);
    },
  });
};

// Admin/SA profile screens reuse useProfileData/useProfileStats above directly —
// the backend already scopes /users/me and /dashboard/stats by the caller's role.

// ─── Super Admin profile query ─────────────────────────────────────────────────

const saQK = {
  profile: ['sa', 'profile'] as const,
};

// GET /auth/me already scopes the returned profile by the caller's role, so
// the Super Admin view hits the same endpoint as useProfileData — only the
// response shape differs (flat ProfileUser vs raw User).
const toProfileUser = (user: User): ProfileUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone ?? '',
  employeeId: user.employeeId ?? '—',
  designation: user.designation ?? '',
  department: user.department?.name ?? '',
  role: user.role,
  ...(user.manager?.name ? { reportingManager: user.manager.name } : {}),
  ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
});

export const useSuperAdminProfileData = () =>
  useQuery({
    queryKey: saQK.profile,
    queryFn: () => authApi.getProfile().then((r) => toProfileUser(r.data)),
    staleTime: 5 * 60 * 1000,
  });

// ─── Change password mutation ─────────────────────────────────────────────────

type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: ({ currentPassword, newPassword }: ChangePasswordPayload) =>
      authApi.changePassword(currentPassword, newPassword).then((r) => r.data),
  });
