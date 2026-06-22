import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@godigitify/api-client';

import { queryKeys } from '../constants/queryKeys';
import { useNotificationStore } from '../stores/notification.store';

export const useNotificationList = () =>
  useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => notificationsApi.getList(),
    select: (res) => res.data,
  });

export const useUnreadCount = () => {
  const { setUnreadCount } = useNotificationStore();
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationsApi.getUnreadCount(),
    select: (res) => {
      setUnreadCount(res.data.count);
      return res.data.count;
    },
    refetchInterval: 60_000,
  });
};

export const useMarkRead = () => {
  const qc = useQueryClient();
  const { decrementUnread } = useNotificationStore();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
      decrementUnread();
    },
  });
};

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  const { clearUnread } = useNotificationStore();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
      clearUnread();
    },
  });
};
