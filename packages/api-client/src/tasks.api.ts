import type {
  RichTask,
  TaskFilters,
  CreateTaskDto,
  UpdateTaskStatusDto,
  TaskComment,
  TaskActivityEvent,
  TaskAttachment,
  TaskBatch,
  CreateTaskBatchDto,
  BatchProgressSummary,
} from '@godigitify/types';

import { getApiClient } from './client';

export type TaskListMeta = { page: number; limit: number; total: number; totalPages: number };

export const tasksApi = {
  // The API returns the task array directly as `data`, with pagination as a
  // sibling `meta` field — not nested as `{ tasks, meta }`.
  getList: (filters?: TaskFilters) =>
    getApiClient().get<RichTask[]>('/tasks', filters as Record<string, string | number | boolean | undefined>),

  getById: (id: string) => getApiClient().get<RichTask>(`/tasks/${id}`),

  create: (dto: CreateTaskDto) => getApiClient().post<RichTask>('/tasks', dto),

  update: (id: string, dto: Partial<CreateTaskDto>) =>
    getApiClient().patch<RichTask>(`/tasks/${id}`, dto),

  updateStatus: (id: string, dto: UpdateTaskStatusDto) =>
    getApiClient().patch<RichTask>(`/tasks/${id}/status`, dto),

  delete: (id: string) => getApiClient().delete<void>(`/tasks/${id}`),

  assign: (id: string, assigneeId: string, reason?: string) =>
    getApiClient().post<RichTask>(`/tasks/${id}/assign`, { assigneeId, ...(reason ? { reason } : {}) }),

  getComments: (taskId: string) =>
    getApiClient().get<TaskComment[]>(`/tasks/${taskId}/comments`),

  addComment: (taskId: string, content: string, parentId?: string) =>
    getApiClient().post<TaskComment>(`/tasks/${taskId}/comments`, { content, parentId }),

  getActivity: (taskId: string) =>
    getApiClient().get<TaskActivityEvent[]>(`/tasks/${taskId}/activity`),

  getAttachments: (taskId: string) =>
    getApiClient().get<TaskAttachment[]>(`/tasks/${taskId}/attachments`),

  bulkUpdateStatus: (ids: string[], status: string) =>
    getApiClient().post<{ cancelledIds: string[]; skippedIds: string[] }>('/tasks/bulk/status', { ids, status }),

  /** Fetch tasks with due dates within [from, to] for the calendar view */
  getCalendar: (from: string, to: string) =>
    getApiClient().get<RichTask[]>('/tasks', {
      dueAfter: from,
      dueBefore: to,
      limit: 100,
      sortBy: 'dueDate',
      order: 'asc',
    } as Record<string, string | number | boolean | undefined>),

  createBatch: (dto: CreateTaskBatchDto) => getApiClient().post<TaskBatch>('/tasks/batch', dto),

  getBatchSummary: (batchId: string) =>
    getApiClient().get<BatchProgressSummary>(`/tasks/batch/${batchId}`),

  nudgeStragglers: (batchId: string) =>
    getApiClient().post<void>(`/tasks/batch/${batchId}/nudge`),
};
