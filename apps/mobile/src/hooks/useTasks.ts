import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@godigitify/api-client';
import type { TaskFilters, UpdateTaskStatusDto, CreateTaskDto, CreateTaskBatchDto } from '@godigitify/types';

import { queryKeys } from '../constants/queryKeys';
import { useApiMutation } from './useApiMutation';

export const useTasks = (filters?: TaskFilters) =>
  useQuery({
    queryKey: queryKeys.tasks.list(filters as Record<string, unknown>),
    queryFn: () => tasksApi.getList(filters),
    // The API sends the task array directly as `data`; pagination is a sibling `meta`.
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

export const useTaskAttachments = (taskId: string) =>
  useQuery({
    queryKey: queryKeys.tasks.attachments(taskId),
    queryFn: () => tasksApi.getAttachments(taskId),
    select: (res) => res.data,
    enabled: !!taskId,
  });

export const useUpdateTaskStatus = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTaskStatusDto }) =>
      tasksApi.updateStatus(id, dto),
    successMessage: 'Status updated',
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.activity(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.stats('week') });
    },
  });
};

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (dto: CreateTaskDto) => tasksApi.create(dto),
    successMessage: 'Task created',
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.stats('week') });
    },
  });
};

/** Duplicate-to-team (FR-23): one shared batchId across N single-assignee
 * copies, so the Batch Progress screens can track them as one group. */
export const useCreateTaskBatch = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (dto: CreateTaskBatchDto) => tasksApi.createBatch(dto),
    successMessage: 'Tasks created',
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.stats('week') });
    },
  });
};

export const useReassignTask = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: ({ id, assigneeId, reason }: { id: string; assigneeId: string; reason?: string }) =>
      tasksApi.assign(id, assigneeId, reason),
    successMessage: 'Task reassigned',
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.activity(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.stats('week') });
    },
  });
};

export const useBulkCancelTasks = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (ids: string[]) => tasksApi.bulkUpdateStatus(ids, 'CANCELLED'),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.stats('week') });
    },
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    successMessage: 'Task deleted',
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.stats('week') });
    },
  });
};

export const useAddComment = (taskId: string) => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string }) =>
      tasksApi.addComment(taskId, content, parentId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.comments(taskId) });
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.activity(taskId) });
    },
  });
};
