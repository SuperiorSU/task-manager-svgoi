import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, usersApi, dashboardApi } from '@godigitify/api-client';
import type {
  User,
  NotificationType,
  NotificationPreferences as ServerNotificationPreferences,
  UpdateNotificationPreferencesDto,
} from '@godigitify/types';

import { useAuthStore } from '../stores/auth.store';
import { queryKeys } from '../constants/queryKeys';
import { useApiMutation } from './useApiMutation';
import type { ProfileUser } from '../data/profile.mock';
import type { NotificationPreferencesView } from '../types/notificationPreferences';

// ─── Keys ─────────────────────────────────────────────────────────────────────

const QK = {
  profile: queryKeys.auth.profile(),
  stats: ['profile', 'stats'] as const,
  notifPrefs: queryKeys.notifications.preferences(),
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

// ─── Notification preferences ─────────────────────────────────────────────────
// The server model is a flat per-type mute list (mutedTypes: NotificationType[]);
// the screen shows 5 grouped toggle rows matching 8_overview.md §4.10's Profile
// spec. TYPE_GROUPS is the (one-time) mapping between the two — a group reads
// as "on" unless every type in it is muted, and toggling it mutes/unmutes the
// whole group together.
const TYPE_GROUPS: { key: string; label: string; types: NotificationType[] }[] = [
  { key: 'task_assignments', label: 'Task assignments', types: ['TASK_ASSIGNED', 'TASK_REASSIGNED'] },
  { key: 'due_reminders', label: 'Due date reminders', types: ['TASK_DUE_SOON'] },
  { key: 'overdue_alerts', label: 'Overdue alerts', types: ['TASK_OVERDUE'] },
  {
    key: 'comments',
    label: 'Comments & @mentions',
    types: ['COMMENT_ADDED', 'CLARIFICATION_REQUESTED', 'CLARIFICATION_RESPONDED'],
  },
  { key: 'completions', label: 'Completion & approvals', types: ['TASK_COMPLETED', 'TASK_STATUS_CHANGED'] },
];

export const toNotificationPreferencesView = (
  server: ServerNotificationPreferences
): NotificationPreferencesView => {
  const muted = new Set(server.mutedTypes);
  return {
    delivery: [
      { id: 'del_1', key: 'inApp', label: 'In-app', enabled: server.inAppEnabled },
      { id: 'del_2', key: 'email', label: 'Email', enabled: server.emailEnabled },
      { id: 'del_3', key: 'push', label: 'Push', enabled: server.pushEnabled },
    ],
    types: TYPE_GROUPS.map((group, i) => ({
      id: `typ_${i + 1}`,
      key: group.key,
      label: group.label,
      enabled: !group.types.every((t) => muted.has(t)),
    })),
    quietHoursEnabled: server.quietHoursEnabled,
    quietHoursStart: server.quietHoursStart,
    quietHoursEnd: server.quietHoursEnd,
  };
};

export const buildDeliveryTogglePatch = (
  server: ServerNotificationPreferences,
  key: 'inApp' | 'email' | 'push'
): UpdateNotificationPreferencesDto => {
  if (key === 'inApp') return { inAppEnabled: !server.inAppEnabled };
  if (key === 'email') return { emailEnabled: !server.emailEnabled };
  return { pushEnabled: !server.pushEnabled };
};

export const buildTypeGroupTogglePatch = (
  server: ServerNotificationPreferences,
  groupKey: string
): UpdateNotificationPreferencesDto => {
  const group = TYPE_GROUPS.find((g) => g.key === groupKey);
  if (!group) return {};

  const muted = new Set(server.mutedTypes);
  const currentlyEnabled = !group.types.every((t) => muted.has(t));
  for (const type of group.types) {
    if (currentlyEnabled) muted.add(type);
    else muted.delete(type);
  }
  return { mutedTypes: Array.from(muted) };
};

export const useNotificationPrefs = () =>
  useQuery({
    queryKey: QK.notifPrefs,
    queryFn: () => usersApi.getNotificationPreferences().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

// Standard optimistic-update recipe: apply the patch to the cache immediately,
// roll back to the pre-mutation snapshot on failure (useApiMutation already
// surfaces the error toast), then resync with the server on settle so the
// cache can't drift from what actually got persisted.
export const useUpdateNotificationPrefs = () => {
  const qc = useQueryClient();
  return useApiMutation<ServerNotificationPreferences, UpdateNotificationPreferencesDto, { previous: ServerNotificationPreferences | undefined }>({
    mutationFn: (dto) => usersApi.updateNotificationPreferences(dto).then((r) => r.data),
    onMutate: async (dto) => {
      await qc.cancelQueries({ queryKey: QK.notifPrefs });
      const previous = qc.getQueryData<ServerNotificationPreferences>(QK.notifPrefs);
      if (previous) qc.setQueryData<ServerNotificationPreferences>(QK.notifPrefs, { ...previous, ...dto });
      return { previous };
    },
    onError: (_err, _dto, context) => {
      if (context?.previous) qc.setQueryData(QK.notifPrefs, context.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: QK.notifPrefs });
    },
  });
};

// ─── Profile update mutation ──────────────────────────────────────────────────

type EditableFields = { name?: string; phone?: string; avatarUrl?: string };

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  return useApiMutation({
    mutationFn: (fields: EditableFields) =>
      usersApi.updateProfile(fields).then((r) => r.data),
    successMessage: 'Profile updated',
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

// Not migrated to useApiMutation — change-password.tsx already has its own
// complete, more specific feedback (a confirm Alert whose OK button drives
// navigation back, and a specific "current password incorrect" error
// message), same reasoning as useLogin/useForgotPassword in useAuth.ts.
export const useChangePassword = () =>
  useMutation({
    mutationFn: ({ currentPassword, newPassword }: ChangePasswordPayload) =>
      authApi.changePassword(currentPassword, newPassword).then((r) => r.data),
  });
