import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@godigitify/api-client';

import { queryKeys } from '../constants/queryKeys';
import {
  toBatchDisplaySummary,
  sortBatchMembers,
  type BatchSortBy,
} from '../services/batchProgress.service';

// ─── Hook: batch progress summary + sortable roster ──────────────────────────

export const useBatchProgress = (batchId: string) => {
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<BatchSortBy>('status');
  const [nudging, setNudging] = useState(false);

  const query = useQuery({
    queryKey: queryKeys.tasks.batch(batchId),
    queryFn: () => tasksApi.getBatchSummary(batchId),
    select: (res) => toBatchDisplaySummary(res.data),
    enabled: !!batchId,
  });

  const summary = query.data ?? null;

  const sortedMembers = useMemo(
    () => (summary ? sortBatchMembers(summary.members, sortBy) : []),
    [summary, sortBy],
  );

  const toggleSort = useCallback(() => {
    setSortBy((s) => (s === 'status' ? 'name' : 'status'));
  }, []);

  const nudgeStragglers = useCallback(async () => {
    setNudging(true);
    try {
      const notifiedCount = summary?.atRiskCount ?? 0;
      await tasksApi.nudgeStragglers(batchId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.batch(batchId) });
      return { notifiedCount };
    } finally {
      setNudging(false);
    }
  }, [batchId, queryClient, summary]);

  return {
    summary,
    isLoading: query.isLoading,
    sortBy,
    toggleSort,
    sortedMembers,
    nudgeStragglers,
    nudging,
  };
};
