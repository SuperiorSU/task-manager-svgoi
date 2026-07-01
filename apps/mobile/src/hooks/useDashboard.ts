import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@godigitify/api-client';

import { queryKeys } from '../constants/queryKeys';

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useEmployeeStats = () =>
  useQuery({
    queryKey: queryKeys.dashboard.stats('week'),
    queryFn: () => dashboardApi.getStats('week').then((r) => r.data),
    staleTime: 5 * 60 * 1_000,
  });

export const useUpcomingTasks = () =>
  useQuery({
    queryKey: ['dashboard', 'upcoming'],
    queryFn: () => dashboardApi.getUpcoming().then((r) => r.data),
    staleTime: 5 * 60 * 1_000,
  });

export const useRecentActivity = () =>
  useQuery({
    queryKey: queryKeys.dashboard.activity(),
    queryFn: () => dashboardApi.getActivity().then((r) => r.data),
    staleTime: 2 * 60 * 1_000,
  });

export const useUnreadCount = () =>
  useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => dashboardApi.getUnreadCount().then((r) => r.data),
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
