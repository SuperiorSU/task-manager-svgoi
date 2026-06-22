import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@godigitify/api-client';
import type { TaskFilters, UpdateTaskStatusDto, CreateTaskDto } from '@godigitify/types';

import { queryKeys } from '../constants/queryKeys';

export const useTasks = (filters?: TaskFilters) =>
  useQuery({
    queryKey: queryKeys.tasks.list(filters as Record<string, unknown>),
    queryFn: () => tasksApi.getList(filters),
    select: (res) => res.data,
  });

export const useTask = (id: string) =>
  useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => tasksApi.getById(id),
    select: (res) => res.data,
    enabled: !!id,
  });

export const useTaskActivity = (taskId: string) =>
  useQuery({
    queryKey: queryKeys.tasks.activity(taskId),
    queryFn: () => tasksApi.getActivity(taskId),
    select: (res) => res.data,
    enabled: !!taskId,
  });

export const useTaskComments = (taskId: string) =>
  useQuery({
    queryKey: queryKeys.tasks.comments(taskId),
    queryFn: () => tasksApi.getComments(taskId),
    select: (res) => res.data,
    enabled: !!taskId,
  });

export const useUpdateTaskStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTaskStatusDto }) =>
      tasksApi.updateStatus(id, dto),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.stats('week') });
    },
  });
};

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTaskDto) => tasksApi.create(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.stats('week') });
    },
  });
};

export const useAddComment = (taskId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string }) =>
      tasksApi.addComment(taskId, content, parentId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.comments(taskId) });
    },
  });
};
