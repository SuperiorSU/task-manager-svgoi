'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { dashboardService } from '@/services/dashboard.service';

export const useDashboardStats = () =>
  useQuery({
    queryKey: queryKeys.dashboard.stats('week'),
    queryFn: () => dashboardService.getStats(),
    staleTime: 5 * 60 * 1000,
  });

export const useDashboardTrend = () =>
  useQuery({
    queryKey: ['dashboard', 'trend'],
    queryFn: () => dashboardService.getTrend(),
    staleTime: 10 * 60 * 1000,
  });

export const useDashboardDeptStats = () =>
  useQuery({
    queryKey: ['dashboard', 'dept-stats'],
    queryFn: () => dashboardService.getDeptStats(),
    staleTime: 5 * 60 * 1000,
  });

export const useDashboardWorkload = () =>
  useQuery({
    queryKey: ['dashboard', 'workload'],
    queryFn: () => dashboardService.getWorkload(),
    staleTime: 5 * 60 * 1000,
  });

export const useDashboardActivity = () =>
  useQuery({
    queryKey: queryKeys.dashboard.activity(),
    queryFn: () => dashboardService.getActivity(),
    staleTime: 2 * 60 * 1000,
  });
