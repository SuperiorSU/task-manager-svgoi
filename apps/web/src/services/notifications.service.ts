import { MOCK_NOTIFICATIONS, type NotificationRecord } from '@/data/notifications.mock';

const DELAY_MS = 300;
const delay = () => new Promise((res) => setTimeout(res, DELAY_MS));

export const notificationsService = {
  async list(): Promise<NotificationRecord[]> {
    await delay();
    return [...MOCK_NOTIFICATIONS].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getUnreadCount(): Promise<number> {
    await delay();
    return MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;
  },

  async markRead(id: string): Promise<void> {
    await delay();
    const n = MOCK_NOTIFICATIONS.find((n) => n.id === id);
    if (n) {
      n.isRead = true;
      n.createdAt = n.createdAt; // unchanged
    }
  },

  async markAllRead(): Promise<void> {
    await delay();
    MOCK_NOTIFICATIONS.forEach((n) => {
      n.isRead = true;
    });
  },
};
