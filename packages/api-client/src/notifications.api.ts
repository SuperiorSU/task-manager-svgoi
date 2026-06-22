import type { Notification } from '@godigitify/types';

import { getApiClient } from './client';

export const notificationsApi = {
  getList: () => getApiClient().get<Notification[]>('/notifications'),

  getUnreadCount: () => getApiClient().get<{ count: number }>('/notifications/unread-count'),

  markRead: (id: string) => getApiClient().patch<void>(`/notifications/${id}/read`),

  markAllRead: () => getApiClient().patch<void>('/notifications/read-all'),
};
