'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { reportsService } from '@/services/reports.service';
import { useApiMutation } from './useApiMutation';

export const useReports = () =>
  useQuery({
    queryKey: queryKeys.reports.list(),
    queryFn: () => reportsService.list(),
    staleTime: 60 * 1000,
  });

export const useRequestReport = () => {
  const qc = useQueryClient();
  // No successMessage — the reports page shows its own, more specific
  // "queued — you'll be notified" copy on success.
  return useApiMutation({
    mutationFn: ({ type, dateRange }: { type: string; dateRange?: { from: string; to: string } }) =>
      reportsService.request(type, dateRange),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.reports.list() });
    },
  });
};
