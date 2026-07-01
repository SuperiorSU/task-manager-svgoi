'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { notificationsService } from '@/services/notifications.service';

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
  return useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });
};
