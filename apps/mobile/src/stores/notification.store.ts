import { create } from 'zustand';

type NotificationStore = {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrementUnread: () => void;
  clearUnread: () => void;
};

export const useNotificationStore = create<NotificationStore>((set) => ({
  unreadCount: 3, // Seeded from mock: notif-001, notif-002, notif-003 are unread
  setUnreadCount: (count) => set({ unreadCount: count }),
  decrementUnread: () => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
  clearUnread: () => set({ unreadCount: 0 }),
}));
