import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { governanceApi, type GovernanceFilters } from '@godigitify/api-client';
import type { CreateTaskDto } from '@godigitify/types';

import { queryKeys } from '../constants/queryKeys';

/**
 * Governance tasks — the Super Admin's "Assign to Admin & Track" flow
 * (assign a task directly to a department admin, then approve/request
 * revision once submitted). Mirrors useTasks.ts's pattern; the list matches
 * the backend's 2-min list cache, the detail has no explicit staleTime to
 * match the backend's uncached detail rule.
 */

export const useGovernanceTasks = (filters?: GovernanceFilters) =>
  useQuery({
    queryKey: queryKeys.governance.list(filters as Record<string, unknown>),
    queryFn: () => governanceApi.getList(filters),
    select: (res) => res.data, // GovernanceTask[]; meta (pagination) is a sibling field, not used here
    staleTime: 2 * 60 * 1000,
  });

export const useGovernanceTask = (id: string) =>
  useQuery({
    queryKey: queryKeys.governance.detail(id),
    queryFn: () => governanceApi.getById(id),
    select: (res) => res.data,
    enabled: !!id,
  });

export const useCreateGovernanceTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTaskDto & { departmentId: string }) => governanceApi.create(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.governance.list() });
    },
  });
};

export const useApproveGovernanceTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => governanceApi.approve(id),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.governance.list() });
      void qc.invalidateQueries({ queryKey: queryKeys.governance.detail(id) });
    },
  });
};

export const useRequestGovernanceRevision = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => governanceApi.requestRevision(id, note),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.governance.list() });
      void qc.invalidateQueries({ queryKey: queryKeys.governance.detail(id) });
    },
  });
};
