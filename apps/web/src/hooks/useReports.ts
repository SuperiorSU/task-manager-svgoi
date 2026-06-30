'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { reportsService } from '@/services/reports.service';

export const useReports = () =>
  useQuery({
    queryKey: queryKeys.reports.list(),
    queryFn: () => reportsService.list(),
    staleTime: 60 * 1000,
  });

export const useRequestReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, dateRange }: { type: string; dateRange?: { from: string; to: string } }) =>
      reportsService.request(type, dateRange),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.reports.list() });
    },
  });
};
