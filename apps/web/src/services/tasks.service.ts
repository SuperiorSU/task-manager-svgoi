import { api } from '@/lib/api';
import type { TaskStatus, TaskPriority } from '@godigitify/types';
import type { TaskWithRelations } from '@/data/tasks.mock';

export type TaskListFilters = {
  status?: TaskStatus;
  priority?: TaskPriority;
  departmentId?: string;
  assigneeId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'title';
  order?: 'asc' | 'desc';
};

// GET /tasks returns the array as `data` with pagination in a sibling `meta`;
// every other endpoint wraps its payload in `{ data }`. Axios exposes the HTTP
// body on `res.data`, so payloads are `res.data.data`.
type Envelope<T> = { data: T };
type ListEnvelope<T> = { data: T; meta: { page: number; limit: number; total: number; totalPages: number } };

export const tasksService = {
  async list(filters: TaskListFilters = {}) {
    const res = await api.get<ListEnvelope<TaskWithRelations[]>>('/tasks', {
      params: filters as Record<string, string | number | undefined>,
    });
    return { items: res.data.data, total: res.data.meta.total, page: res.data.meta.page, limit: res.data.meta.limit };
  },

  async get(id: string): Promise<TaskWithRelations> {
    const res = await api.get<Envelope<TaskWithRelations>>(`/tasks/${id}`);
    return res.data.data;
  },

  async getActivity(id: string) {
    const res = await api.get<
      Envelope<
        { id: string; action: string; description: string; createdAt: string; actor?: { id: string; name: string; avatarUrl?: string | null } | null }[]
      >
    >(`/tasks/${id}/activity`);
    // API calls the line `description`; the web reads `note`.
    return res.data.data.map((a) => ({
      id: a.id,
      action: a.action,
      note: a.description,
      createdAt: a.createdAt,
      actor: a.actor ?? null,
    }));
  },

  async getComments(id: string) {
    const res = await api.get<
      Envelope<{ id: string; content: string; createdAt: string; author: { id: string; name: string; avatarUrl?: string | null } }[]>
    >(`/tasks/${id}/comments`);
    return res.data.data;
  },

  async updateStatus(id: string, status: TaskStatus) {
    const res = await api.patch<Envelope<TaskWithRelations>>(`/tasks/${id}/status`, { status });
    return res.data.data;
  },

  async create(dto: {
    title: string;
    description?: string;
    priority: TaskPriority;
    dueDate: string;
    assigneeId: string;
    departmentId?: string;
  }): Promise<TaskWithRelations> {
    const res = await api.post<Envelope<TaskWithRelations>>('/tasks', dto);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  // The bulk endpoint only supports cancelling (POST /tasks/bulk/status accepts
  // status: CANCELLED). `ids` is the field name on the API.
  async bulkUpdateStatus(taskIds: string[], status: TaskStatus): Promise<void> {
    await api.post('/tasks/bulk/status', { ids: taskIds, status });
  },
};
