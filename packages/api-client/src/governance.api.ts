import type { GovernanceTask, CreateTaskDto, TaskStatus } from '@godigitify/types';

import { getApiClient } from './client';

export type GovernanceFilters = {
  status?: TaskStatus;
  departmentId?: string;
  page?: number;
  limit?: number;
};

export type GovernanceListMeta = { page: number; limit: number; total: number; totalPages: number };

export const governanceApi = {
  // The API returns the task array directly as `data`, with pagination as a
  // sibling `meta` field — not nested as `{ tasks, meta }`.
  getList: (filters?: GovernanceFilters) =>
    getApiClient().get<GovernanceTask[]>(
      '/governance/tasks',
      filters as Record<string, string | number | boolean | undefined>
    ),

  getById: (id: string) => getApiClient().get<GovernanceTask>(`/governance/tasks/${id}`),

  create: (dto: CreateTaskDto & { departmentId: string }) =>
    getApiClient().post<GovernanceTask>('/governance/tasks', dto),

  approve: (id: string) => getApiClient().post<GovernanceTask>(`/governance/tasks/${id}/approve`),

  requestRevision: (id: string, note: string) =>
    getApiClient().post<GovernanceTask>(`/governance/tasks/${id}/request-revision`, { note }),
};
