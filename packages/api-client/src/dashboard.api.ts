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

/** A compact task card rendered in a dashboard section (with attachment count). */
export type DashboardTaskPreview = Pick<
  RichTask,
  'id' | 'title' | 'status' | 'priority' | 'dueDate' | 'updatedAt' | 'assignee' | 'department'
> & {
  _count: { attachments: number };
};

/**
 * Admin dashboard summary — accurate counts computed server-side plus the few
 * preview rows each section actually renders. Replaces fetching 100 full tasks
 * and bucketing them client-side.
 */
export type AdminDashboardSummary = {
  /** Tasks the admin created that are back for their review. */
  reviewQueue: { count: number; items: DashboardTaskPreview[] };
  /** Tasks the admin assigned out to another department. */
  assignedOut: { count: number; pending: number; items: DashboardTaskPreview[] };
  /** Tasks handed to this admin by someone else. */
  assignedToMe: { count: number; needAction: number };
};

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

  getAdminSummary: () =>
    getApiClient().get<AdminDashboardSummary>('/dashboard/admin-summary'),

  getDeptHealth: () => getApiClient().get<DeptHealth[]>('/dashboard/dept-health'),

  getStaffLoad: () => getApiClient().get<StaffLoad[]>('/dashboard/staff-load'),

  getEscalations: () => getApiClient().get<Escalation[]>('/dashboard/escalations'),

  getCalendarDeadlines: (from: string, to: string) =>
    getApiClient().get<CalendarDeadlineDay[]>('/dashboard/calendar-deadlines', { from, to }),
};
