import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  MOCK_STATS,
  MOCK_UPCOMING_TASKS,
  MOCK_ACTIVITY,
  MOCK_UNREAD_COUNT,
} from '../data/dashboard.mock';

// ─── Swap flag ────────────────────────────────────────────────────────────────
// When the API is ready, set USE_MOCK = false and replace queryFns below with:
//   () => getApiClient().get('/dashboard/employee-stats').then(r => r.data)
const USE_MOCK = true;

const simulateDelay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useEmployeeStats = () =>
  useQuery({
    queryKey: ['dashboard', 'employee', 'stats'],
    queryFn: async () => {
      if (USE_MOCK) {
        await simulateDelay(500);
        return MOCK_STATS;
      }
      // TODO: return getApiClient().get('/dashboard/employee-stats').then(r => r.data);
      return MOCK_STATS;
    },
    staleTime: 5 * 60 * 1_000,
  });

export const useUpcomingTasks = () =>
  useQuery({
    queryKey: ['dashboard', 'employee', 'upcoming'],
    queryFn: async () => {
      if (USE_MOCK) {
        await simulateDelay(700);
        return MOCK_UPCOMING_TASKS;
      }
      // TODO: return getApiClient().get('/tasks?dueWithin=7d&limit=5').then(r => r.data);
      return MOCK_UPCOMING_TASKS;
    },
    staleTime: 5 * 60 * 1_000,
  });

export const useRecentActivity = () =>
  useQuery({
    queryKey: ['dashboard', 'employee', 'activity'],
    queryFn: async () => {
      if (USE_MOCK) {
        await simulateDelay(600);
        return MOCK_ACTIVITY;
      }
      // TODO: return getApiClient().get('/dashboard/activity').then(r => r.data);
      return MOCK_ACTIVITY;
    },
    staleTime: 2 * 60 * 1_000,
  });

export const useMockUnreadCount = () =>
  useQuery({
    queryKey: ['notifications', 'unread', 'mock'],
    queryFn: async () => {
      if (USE_MOCK) {
        await simulateDelay(300);
        return MOCK_UNREAD_COUNT;
      }
      return 0;
    },
    staleTime: 60 * 1_000,
  });

// ─── Aggregate refresh ────────────────────────────────────────────────────────

export const useDashboardRefresh = (
  refetchers: Array<() => Promise<unknown>>
) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all(refetchers.map((fn) => fn()));
    setRefreshing(false);
  }, [refetchers]);

  return { refreshing, onRefresh };
};
