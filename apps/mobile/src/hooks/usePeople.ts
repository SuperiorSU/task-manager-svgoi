import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { usersApi, tasksApi } from '@godigitify/api-client';
import type { UserFilters } from '@godigitify/api-client';

import { queryKeys } from '../constants/queryKeys';
import { useApiMutation } from './useApiMutation';

export const useUsers = (filters?: UserFilters) =>
  useQuery({
    queryKey: queryKeys.users.list(filters as Record<string, unknown>),
    queryFn: () => usersApi.getList(filters),
    select: (res) => res.data, // { items: User[], total, page, limit }
  });

export const useUsersInfinite = (filters?: Omit<UserFilters, 'page'>) =>
  useInfiniteQuery({
    queryKey: queryKeys.users.list({ ...filters, paginated: true } as Record<string, unknown>),
    queryFn: ({ pageParam }) => usersApi.getList({ ...filters, page: pageParam, limit: filters?.limit ?? 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { data } = lastPage;
      const loaded = data.page * data.limit;
      return loaded < data.total ? data.page + 1 : undefined;
    },
  });

export const useUser = (id: string) =>
  useQuery({
    queryKey: queryKeys.users.profile(id),
    queryFn: () => usersApi.getById(id),
    select: (res) => res.data,
    enabled: !!id,
  });

export const useUserTaskStats = (id: string) =>
  useQuery({
    queryKey: queryKeys.users.taskStats(id),
    queryFn: () => usersApi.getTaskStats(id),
    select: (res) => res.data,
    enabled: !!id,
  });

export const useUserRecentTasks = (id: string) =>
  useQuery({
    queryKey: queryKeys.users.recentTasks(id),
    queryFn: () => tasksApi.getList({ assigneeId: id, limit: 5, sortBy: 'createdAt', order: 'desc' }),
    select: (res) => res.data,
    enabled: !!id,
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (dto: unknown) => usersApi.create(dto),
    successMessage: 'User created',
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: ({ id, dto }: { id: string; dto: unknown }) => usersApi.update(id, dto),
    successMessage: 'User updated',
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.users.profile(id) });
    },
  });
};

export const useDeactivateUser = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    successMessage: 'User suspended',
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.users.profile(id) });
    },
  });
};

export const useReactivateUser = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (id: string) => usersApi.reactivate(id),
    successMessage: 'User reactivated',
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.users.profile(id) });
    },
  });
};

export const useResetUserPassword = () =>
  useApiMutation({
    mutationFn: (id: string) => usersApi.resetPassword(id),
    successMessage: 'Password reset link sent',
  });
