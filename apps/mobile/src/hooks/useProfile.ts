import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, usersApi, dashboardApi } from '@godigitify/api-client';

import { useAuthStore } from '../stores/auth.store';
import { queryKeys } from '../constants/queryKeys';
import {
  USE_MOCK,
  MOCK_NOTIFICATION_PREFS,
  MOCK_ADMIN_PROFILE_USER,
  MOCK_ADMIN_PROFILE_STATS,
  MOCK_SA_PROFILE_USER,
  type ProfileUser,
  type ProfileStats,
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

// ─── Admin profile queries ────────────────────────────────────────────────────

const adminQK = {
  profile: ['admin', 'profile'] as const,
  stats:   ['admin', 'profile', 'stats'] as const,
};

async function fetchAdminProfile(): Promise<ProfileUser> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 350));
    return MOCK_ADMIN_PROFILE_USER;
  }
  throw new Error('API not implemented');
}

async function fetchAdminProfileStats(): Promise<ProfileStats> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_ADMIN_PROFILE_STATS;
  }
  throw new Error('API not implemented');
}

export const useAdminProfileData = () =>
  useQuery({
    queryKey: adminQK.profile,
    queryFn: fetchAdminProfile,
    staleTime: 5 * 60 * 1000,
  });

export const useAdminProfileStats = () =>
  useQuery({
    queryKey: adminQK.stats,
    queryFn: fetchAdminProfileStats,
    staleTime: 5 * 60 * 1000,
  });

// ─── Super Admin profile query ─────────────────────────────────────────────────

const saQK = {
  profile: ['sa', 'profile'] as const,
};

async function fetchSuperAdminProfile(): Promise<ProfileUser> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 350));
    return MOCK_SA_PROFILE_USER;
  }
  throw new Error('API not implemented');
}

export const useSuperAdminProfileData = () =>
  useQuery({
    queryKey: saQK.profile,
    queryFn: fetchSuperAdminProfile,
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
