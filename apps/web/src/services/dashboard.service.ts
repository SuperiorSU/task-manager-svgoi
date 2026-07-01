import {
  DASHBOARD_STATS,
  TASK_TREND_DATA,
  DEPT_STATS,
  WORKLOAD_DATA,
  RECENT_ACTIVITY,
} from '@/data/dashboard.mock';

const DELAY_MS = 500;
const delay = () => new Promise((res) => setTimeout(res, DELAY_MS));

export const dashboardService = {
  async getStats() {
    await delay();
    return DASHBOARD_STATS;
  },

  async getTrend() {
    await delay();
    return TASK_TREND_DATA;
  },

  async getDeptStats() {
    await delay();
    return DEPT_STATS;
  },

  async getWorkload() {
    await delay();
    return WORKLOAD_DATA;
  },

  async getActivity() {
    await delay();
    return RECENT_ACTIVITY;
  },
};
