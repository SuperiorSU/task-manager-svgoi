'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { notificationsService } from '@/services/notifications.service';
import { useApiMutation } from './useApiMutation';

export const useNotifications = () =>
  useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => notificationsService.list(),
    staleTime: 30 * 1000,
  });

export const useUnreadCount = () =>
  useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationsService.getUnreadCount(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });
};
