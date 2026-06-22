import type { Task, TaskFilters, CreateTaskDto, UpdateTaskStatusDto } from '@godigitify/types';

import { getApiClient } from './client';

export const tasksApi = {
  getList: (filters?: TaskFilters) =>
    getApiClient().get<Task[]>('/tasks', filters as Record<string, string | number | boolean | undefined>),

  getById: (id: string) => getApiClient().get<Task>(`/tasks/${id}`),

  create: (dto: CreateTaskDto) => getApiClient().post<Task>('/tasks', dto),

  update: (id: string, dto: Partial<CreateTaskDto>) =>
    getApiClient().patch<Task>(`/tasks/${id}`, dto),

  updateStatus: (id: string, dto: UpdateTaskStatusDto) =>
    getApiClient().patch<Task>(`/tasks/${id}/status`, dto),

  delete: (id: string) => getApiClient().delete<void>(`/tasks/${id}`),

  assign: (id: string, assigneeId: string) =>
    getApiClient().post<Task>(`/tasks/${id}/assign`, { assigneeId }),

  getComments: (taskId: string) =>
    getApiClient().get<unknown[]>(`/tasks/${taskId}/comments`),

  addComment: (taskId: string, content: string, parentId?: string) =>
    getApiClient().post<unknown>(`/tasks/${taskId}/comments`, { content, parentId }),

  getActivity: (taskId: string) =>
    getApiClient().get<unknown[]>(`/tasks/${taskId}/activity`),

  bulkUpdateStatus: (ids: string[], status: string) =>
    getApiClient().post<void>('/tasks/bulk/status', { ids, status }),
};
