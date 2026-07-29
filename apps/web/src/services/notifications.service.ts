import { api } from '@/lib/api';
import type { NotificationRecord } from '@/data/notifications.mock';

type Envelope<T> = { data: T };

export const notificationsService = {
  async list(): Promise<NotificationRecord[]> {
    // API returns newest-first already; the shape is a superset of NotificationRecord.
    const res = await api.get<Envelope<NotificationRecord[]>>('/notifications');
    return res.data.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await api.get<Envelope<{ count: number }>>('/notifications/unread-count');
    return res.data.data.count;
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },
};
