import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { MOCK_NOTIFICATIONS, type MockNotification, type MockNotificationType } from '../data/notifications.mock';
import { queryKeys } from '../constants/queryKeys';
import { useNotificationStore } from '../stores/notification.store';

const USE_MOCK = true;

// ─── Types ───────────────────────────────────────────────────────────────────

export type NotificationFilter = 'all' | 'unread';

export type NotificationGroup = {
  title: string;   // "Today", "Yesterday", "This week", "Earlier"
  data: MockNotification[];
};

// ─── Group helper ─────────────────────────────────────────────────────────────

export function groupNotifications(notifications: MockNotification[]): NotificationGroup[] {
  const now = dayjs();
  const todayStart = now.startOf('day');
  const yesterdayStart = todayStart.subtract(1, 'day');
  const weekStart = todayStart.subtract(7, 'day');

  const today: MockNotification[] = [];
  const yesterday: MockNotification[] = [];
  const thisWeek: MockNotification[] = [];
  const earlier: MockNotification[] = [];

  for (const n of notifications) {
    const d = dayjs(n.createdAt);
    if (d.isAfter(todayStart)) {
      today.push(n);
    } else if (d.isAfter(yesterdayStart)) {
      yesterday.push(n);
    } else if (d.isAfter(weekStart)) {
      thisWeek.push(n);
    } else {
      earlier.push(n);
    }
  }

  const groups: NotificationGroup[] = [];
  if (today.length > 0) groups.push({ title: 'Today', data: today });
  if (yesterday.length > 0) groups.push({ title: 'Yesterday', data: yesterday });
  if (thisWeek.length > 0) groups.push({ title: 'This week', data: thisWeek });
  if (earlier.length > 0) groups.push({ title: 'Earlier', data: earlier });
  return groups;
}

// ─── In-memory store for mock read state ────────────────────────────────────

let _mockStore: MockNotification[] = MOCK_NOTIFICATIONS.map((n) => ({ ...n }));

const getReadIds = () =>
  new Set(_mockStore.filter((n) => n.isRead).map((n) => n.id));

// ─── Mock fetch fns ──────────────────────────────────────────────────────────

async function fetchMockNotifications(): Promise<MockNotification[]> {
  await new Promise((r) => setTimeout(r, 500));
  return [..._mockStore].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

async function markOneRead(id: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
  _mockStore = _mockStore.map((n) => (n.id === id ? { ...n, isRead: true } : n));
}

async function markAllReadMock(): Promise<void> {
  await new Promise((r) => setTimeout(r, 300));
  _mockStore = _mockStore.map((n) => ({ ...n, isRead: true }));
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export const useNotificationsMock = () => {
  if (!USE_MOCK) {
    throw new Error('API mode not implemented — set USE_MOCK=true');
  }
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: fetchMockNotifications,
    staleTime: 0,
  });
};

export const useMarkReadMock = () => {
  const qc = useQueryClient();
  const { decrementUnread } = useNotificationStore();
  return useMutation({
    mutationFn: markOneRead,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications.list() });
      const prev = qc.getQueryData<MockNotification[]>(queryKeys.notifications.list());
      qc.setQueryData<MockNotification[]>(
        queryKeys.notifications.list(),
        (old) => old?.map((n) => (n.id === id ? { ...n, isRead: true } : n)) ?? []
      );
      decrementUnread();
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.notifications.list(), ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    },
  });
};

export const useMarkAllReadMock = () => {
  const qc = useQueryClient();
  const { clearUnread } = useNotificationStore();
  return useMutation({
    mutationFn: markAllReadMock,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications.list() });
      const prev = qc.getQueryData<MockNotification[]>(queryKeys.notifications.list());
      qc.setQueryData<MockNotification[]>(
        queryKeys.notifications.list(),
        (old) => old?.map((n) => ({ ...n, isRead: true })) ?? []
      );
      clearUnread();
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.notifications.list(), ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    },
  });
};

// ─── Unread count initialiser ─────────────────────────────────────────────────
// Call once on app boot to seed the store from mock data.

export const useSeedUnreadCount = () => {
  const { setUnreadCount } = useNotificationStore();
  const unread = _mockStore.filter((n) => !n.isRead).length;
  setUnreadCount(unread);
};
