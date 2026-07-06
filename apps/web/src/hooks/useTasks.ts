'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { tasksService } from '@/services/tasks.service';
import type { TaskStatus, TaskPriority } from '@godigitify/types';
import { useApiMutation } from './useApiMutation';

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

export const useTasks = (filters?: TaskListFilters) =>
  useQuery({
    queryKey: queryKeys.tasks.list(filters as Record<string, unknown>),
    queryFn: () => tasksService.list(filters),
  });

export const useTask = (id: string) =>
  useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => tasksService.get(id),
    enabled: !!id,
  });

export const useTaskActivity = (id: string) =>
  useQuery({
    queryKey: queryKeys.tasks.activity(id),
    queryFn: () => tasksService.getActivity(id),
    enabled: !!id,
  });

export const useTaskComments = (id: string) =>
  useQuery({
    queryKey: queryKeys.tasks.comments(id),
    queryFn: () => tasksService.getComments(id),
    enabled: !!id,
  });

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (dto: {
      title: string;
      description?: string;
      priority: TaskPriority;
      dueDate: string;
      assigneeId: string;
      departmentId?: string;
    }) => tasksService.create(dto),
    successMessage: 'Task created',
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.stats('week') });
    },
  });
};

export const useUpdateTaskStatus = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { status: TaskStatus; note?: string } }) =>
      tasksService.updateStatus(id, dto.status),
    successMessage: 'Status updated',
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.stats('week') });
    },
  });
};

export const useBulkUpdateStatus = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (dto: { taskIds: string[]; status: TaskStatus }) =>
      tasksService.bulkUpdateStatus(dto.taskIds, dto.status),
    successMessage: 'Tasks updated',
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.all() });
    },
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (id: string) => tasksService.delete(id),
    successMessage: 'Task deleted',
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.all() });
    },
  });
};
