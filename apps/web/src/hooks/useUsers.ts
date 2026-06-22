'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/constants/queryKeys';
import type { CreateUserDto } from '@godigitify/types';

export const useUsers = (filters?: Record<string, unknown>) =>
  useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => api.get('/users', { params: filters }).then((r) => r.data.data),
  });

export const useUser = (id: string) =>
  useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => api.get(`/users/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateUserDto) => api.post('/users', dto).then((r) => r.data.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
};

export const useDeactivateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/deactivate`),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
    },
  });
};
