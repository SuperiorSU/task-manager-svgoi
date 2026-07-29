import { api } from '@/lib/api';
import type {
  DashboardStats,
  TrendDataPoint,
  DeptStat,
  WorkloadEntry,
  RecentActivityEntry,
} from '@/data/dashboard.mock';

// The API wraps every payload in { success, data }. Axios puts the HTTP body on
// `res.data`, so the actual payload is `res.data.data`.
type Envelope<T> = { data: T };

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const res = await api.get<Envelope<Omit<DashboardStats, 'crossDeptTasks'>>>('/dashboard/stats');
    // `crossDeptTasks` isn't part of the stats endpoint; default it so the
    // component-facing type stays stable.
    return { ...res.data.data, crossDeptTasks: 0 };
  },

  async getTrend(): Promise<TrendDataPoint[]> {
    const res = await api.get<Envelope<TrendDataPoint[]>>('/dashboard/trend');
    return res.data.data;
  },

  async getDeptStats(): Promise<DeptStat[]> {
    const res = await api.get<Envelope<DeptStat[]>>('/dashboard/dept-stats');
    return res.data.data;
  },

  async getWorkload(): Promise<WorkloadEntry[]> {
    const res = await api.get<Envelope<WorkloadEntry[]>>('/dashboard/workload');
    return res.data.data;
  },

  async getActivity(): Promise<RecentActivityEntry[]> {
    const res = await api.get<
      Envelope<
        {
          id: string;
          action: string;
          description: string;
          createdAt: string;
          actor?: { name: string; avatarUrl?: string | null } | null;
          task?: { id: string; title: string } | null;
        }[]
      >
    >('/dashboard/activity');
    // The API calls the human-readable line `description`; the web reads `note`.
    return res.data.data.map((a) => ({
      id: a.id,
      action: a.action,
      note: a.description,
      createdAt: a.createdAt,
      actor: a.actor ?? null,
      task: a.task ?? null,
    }));
  },
};
