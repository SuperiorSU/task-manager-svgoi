import type { RichTask } from '@godigitify/types';

import { getApiClient } from './client';

export type DashboardStats = {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  dueToday: number;
};

export type DashboardActivityItem = {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  task: { id: string; title: string };
  actor: { id: string; name: string; avatarUrl?: string | null };
};

export type UpcomingTask = Pick<
  RichTask,
  'id' | 'title' | 'status' | 'priority' | 'dueDate' | 'assignee' | 'department'
>;

export const dashboardApi = {
  getStats: (period = 'week') =>
    getApiClient().get<DashboardStats>('/dashboard/stats', { period }),

  getActivity: () =>
    getApiClient().get<DashboardActivityItem[]>('/dashboard/activity'),

  getUpcoming: () =>
    getApiClient().get<UpcomingTask[]>('/dashboard/upcoming'),

  getUnreadCount: () =>
    getApiClient().get<number>('/notifications/unread-count'),
};
