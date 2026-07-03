import type {
  RichTask,
  DeptHealth,
  StaffLoad,
  Escalation,
  CalendarDeadlineDay,
} from '@godigitify/types';

import { getApiClient } from './client';

export type DashboardStats = {
  totalTasks: number;
  pending: number;
  accepted: number;
  inProgress: number;
  underReview: number;
  completed: number;
  cancelled: number;
  overdue: number;
  completedThisWeek: number;
  dueToday: number;
  activeUsers: number;
  departments: number;
  completionRate: number;
};

export type DeptStat = {
  id: string;
  name: string;
  code: string;
  total: number;
  completed: number;
  overdue: number;
  completionRate: number;
};

export type WorkloadEntry = {
  userId: string;
  name: string;
  assigned: number;
  completed: number;
  overdue: number;
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

  getDeptStats: () =>
    getApiClient().get<DeptStat[]>('/dashboard/dept-stats'),

  getWorkload: () =>
    getApiClient().get<WorkloadEntry[]>('/dashboard/workload'),

  getDeptHealth: () => getApiClient().get<DeptHealth[]>('/dashboard/dept-health'),

  getStaffLoad: () => getApiClient().get<StaffLoad[]>('/dashboard/staff-load'),

  getEscalations: () => getApiClient().get<Escalation[]>('/dashboard/escalations'),

  getCalendarDeadlines: (from: string, to: string) =>
    getApiClient().get<CalendarDeadlineDay[]>('/dashboard/calendar-deadlines', { from, to }),
};
