'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/constants/queryKeys';

export const useDashboardStats = (period = 'week') =>
  useQuery({
    queryKey: queryKeys.dashboard.stats(period),
    queryFn: () => api.get('/dashboard/stats', { params: { period } }).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

export const useDashboardActivity = () =>
  useQuery({
    queryKey: queryKeys.dashboard.activity(),
    queryFn: () => api.get('/dashboard/activity').then((r) => r.data.data),
  });
