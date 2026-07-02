import type {
  RichTask,
  TaskFilters,
  CreateTaskDto,
  UpdateTaskStatusDto,
  TaskComment,
  TaskActivityEvent,
  TaskAttachment,
} from '@godigitify/types';

import { getApiClient } from './client';

export type TaskListMeta = { page: number; limit: number; total: number; totalPages: number };
export type TaskListResponse = { tasks: RichTask[]; meta: TaskListMeta };

export const tasksApi = {
  getList: (filters?: TaskFilters) =>
    getApiClient().get<TaskListResponse>('/tasks', filters as Record<string, string | number | boolean | undefined>),

  getById: (id: string) => getApiClient().get<RichTask>(`/tasks/${id}`),

  create: (dto: CreateTaskDto) => getApiClient().post<RichTask>('/tasks', dto),

  update: (id: string, dto: Partial<CreateTaskDto>) =>
    getApiClient().patch<RichTask>(`/tasks/${id}`, dto),

  updateStatus: (id: string, dto: UpdateTaskStatusDto) =>
    getApiClient().patch<RichTask>(`/tasks/${id}/status`, dto),

  delete: (id: string) => getApiClient().delete<void>(`/tasks/${id}`),

  assign: (id: string, assigneeId: string) =>
    getApiClient().post<RichTask>(`/tasks/${id}/assign`, { assigneeId }),

  getComments: (taskId: string) =>
    getApiClient().get<TaskComment[]>(`/tasks/${taskId}/comments`),

  addComment: (taskId: string, content: string, parentId?: string) =>
    getApiClient().post<TaskComment>(`/tasks/${taskId}/comments`, { content, parentId }),

  getActivity: (taskId: string) =>
    getApiClient().get<TaskActivityEvent[]>(`/tasks/${taskId}/activity`),

  getAttachments: (taskId: string) =>
    getApiClient().get<TaskAttachment[]>(`/tasks/${taskId}/attachments`),

  bulkUpdateStatus: (ids: string[], status: string) =>
    getApiClient().post<void>('/tasks/bulk/status', { ids, status }),

  /** Fetch tasks with due dates within [from, to] for the calendar view */
  getCalendar: (from: string, to: string) =>
    getApiClient().get<TaskListResponse>('/tasks', {
      dueAfter: from,
      dueBefore: to,
      limit: 200,
      sortBy: 'dueDate',
      order: 'asc',
    } as Record<string, string | number | boolean | undefined>),
};
