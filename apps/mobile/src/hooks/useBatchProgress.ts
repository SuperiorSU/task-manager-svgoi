import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  batchProgressService,
  sortBatchMembers,
  type BatchSortBy,
} from '../services/batchProgress.service';

const batchQueryKey = (batchId: string) => ['batch-progress', batchId] as const;

// ─── Hook: batch progress summary + sortable roster ──────────────────────────

export const useBatchProgress = (batchId: string) => {
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<BatchSortBy>('status');
  const [nudging, setNudging] = useState(false);

  const query = useQuery({
    queryKey: batchQueryKey(batchId),
    queryFn: () => batchProgressService.getBatchSummary(batchId),
    enabled: !!batchId,
    staleTime: 60 * 1_000,
  });

  const sortedMembers = useMemo(
    () => (query.data ? sortBatchMembers(query.data.members, sortBy) : []),
    [query.data, sortBy],
  );

  const toggleSort = useCallback(() => {
    setSortBy((s) => (s === 'status' ? 'name' : 'status'));
  }, []);

  const nudgeStragglers = useCallback(async () => {
    setNudging(true);
    try {
      const result = await batchProgressService.nudgeStragglers(batchId);
      await queryClient.invalidateQueries({ queryKey: batchQueryKey(batchId) });
      return result;
    } finally {
      setNudging(false);
    }
  }, [batchId, queryClient]);

  return {
    summary: query.data ?? null,
    isLoading: query.isLoading,
    sortBy,
    toggleSort,
    sortedMembers,
    nudgeStragglers,
    nudging,
  };
};

// ─── Hook: which batch (if any) a single task belongs to ─────────────────────

export const useTaskBatchId = (taskId: string | undefined) =>
  useMemo(() => (taskId ? batchProgressService.getBatchIdForTask(taskId) : undefined), [taskId]);
