import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  USE_MOCK,
  MOCK_PROFILE_USER,
  MOCK_PROFILE_STATS,
  MOCK_NOTIFICATION_PREFS,
  MOCK_ADMIN_PROFILE_USER,
  MOCK_ADMIN_PROFILE_STATS,
  type ProfileUser,
  type ProfileStats,
  type NotificationPreferences,
} from '../data/profile.mock';

// ─── Keys ─────────────────────────────────────────────────────────────────────

const QK = {
  profile: ['profile'] as const,
  stats: ['profile', 'stats'] as const,
  notifPrefs: ['profile', 'notif-prefs'] as const,
};

// ─── Mock fetchers ────────────────────────────────────────────────────────────

async function fetchProfile(): Promise<ProfileUser> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 350));
    return MOCK_PROFILE_USER;
  }
  // TODO: replace with real API call
  throw new Error('API not implemented');
}

async function fetchProfileStats(): Promise<ProfileStats> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_PROFILE_STATS;
  }
  throw new Error('API not implemented');
}

async function fetchNotificationPrefs(): Promise<NotificationPreferences> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_NOTIFICATION_PREFS;
  }
  throw new Error('API not implemented');
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useProfileData = () =>
  useQuery({
    queryKey: QK.profile,
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000,
  });

export const useProfileStats = () =>
  useQuery({
    queryKey: QK.stats,
    queryFn: fetchProfileStats,
    staleTime: 5 * 60 * 1000,
  });

export const useNotificationPrefs = () =>
  useQuery({
    queryKey: QK.notifPrefs,
    queryFn: fetchNotificationPrefs,
    staleTime: 2 * 60 * 1000,
  });

// ─── Profile update mutation ──────────────────────────────────────────────────

type EditableFields = Pick<ProfileUser, 'name' | 'email' | 'phone'>;

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fields: EditableFields): Promise<ProfileUser> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        return { ...MOCK_PROFILE_USER, ...fields };
      }
      throw new Error('API not implemented');
    },
    onSuccess: (updated) => {
      qc.setQueryData<ProfileUser>(QK.profile, updated);
    },
  });
};

// ─── Notification prefs update mutation ──────────────────────────────────────

export const useUpdateNotificationPrefs = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: NotificationPreferences): Promise<NotificationPreferences> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        return prefs;
      }
      throw new Error('API not implemented');
    },
    onSuccess: (updated) => {
      qc.setQueryData<NotificationPreferences>(QK.notifPrefs, updated);
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

// ─── Change password mutation ─────────────────────────────────────────────────

type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: async (_payload: ChangePasswordPayload): Promise<void> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 800));
        return;
      }
      throw new Error('API not implemented');
    },
  });
