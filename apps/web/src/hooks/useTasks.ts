'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/constants/queryKeys';
import type { TaskFilters, UpdateTaskStatusDto, CreateTaskDto } from '@godigitify/types';

export const useTasks = (filters?: TaskFilters & { page?: number; sort?: string; order?: string }) =>
  useQuery({
    queryKey: queryKeys.tasks.list(filters as Record<string, unknown>),
    queryFn: () => api.get('/tasks', { params: filters }).then((r) => r.data.data),
  });

export const useTask = (id: string) =>
  useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => api.get(`/tasks/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

export const useTaskActivity = (id: string) =>
  useQuery({
    queryKey: queryKeys.tasks.activity(id),
    queryFn: () => api.get(`/tasks/${id}/activity`).then((r) => r.data.data),
    enabled: !!id,
  });

export const useTaskComments = (id: string) =>
  useQuery({
    queryKey: queryKeys.tasks.comments(id),
    queryFn: () => api.get(`/tasks/${id}/comments`).then((r) => r.data.data),
    enabled: !!id,
  });

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTaskDto) => api.post('/tasks', dto).then((r) => r.data.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.stats('week') });
    },
  });
};

export const useUpdateTaskStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTaskStatusDto }) =>
      api.patch(`/tasks/${id}/status`, dto).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.stats('week') });
    },
  });
};

export const useBulkUpdateStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { taskIds: string[]; status: string }) =>
      api.patch('/tasks/bulk-status', dto).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.all() });
    },
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.all() });
    },
  });
};
