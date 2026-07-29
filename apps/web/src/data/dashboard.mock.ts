// Dashboard view-model types. The data now comes from the real API via
// dashboard.service.ts — this file retains only the component-facing shapes
// (kept here so the dashboard page/components need no changes).

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
  crossDeptTasks: number;
  activeUsers: number;
  departments: number;
  completionRate: number; // 0-100
};

export type TrendDataPoint = {
  date: string; // MM-DD
  completed: number;
  created: number;
};

export type DeptStat = {
  name: string;
  code: string;
  completionRate: number;
  total: number;
  completed: number;
  overdue: number;
};

export type WorkloadEntry = {
  userId: string;
  name: string;
  assigned: number;
  completed: number;
  overdue: number;
};

export type RecentActivityEntry = {
  id: string;
  action: string;
  note?: string;
  createdAt: string;
  actor?: { name: string; avatarUrl?: string | null } | null;
  task?: { id: string; title: string } | null;
};
