'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { usersService } from '@/services/users.service';
import type { Role } from '@godigitify/types';
import { useApiMutation } from './useApiMutation';

export type UserListFilters = {
  search?: string;
  role?: Role;
  departmentId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

export const useUsers = (filters?: UserListFilters) =>
  useQuery({
    queryKey: queryKeys.users.list(filters as Record<string, unknown>),
    queryFn: () => usersService.list(filters),
  });

export const useUser = (id: string) =>
  useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => usersService.get(id),
    enabled: !!id,
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (dto: {
      name: string;
      email: string;
      employeeId: string;
      role: Role;
      departmentId?: string;
      phone?: string;
      designation?: string;
    }) => usersService.create(dto),
    successMessage: 'User created',
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<{ name: string; phone: string; designation: string; departmentId: string }> }) =>
      usersService.update(id, dto),
    successMessage: 'User updated',
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
    },
  });
};

export const useDeactivateUser = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (id: string) => usersService.deactivate(id),
    successMessage: 'User suspended',
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
    },
  });
};

export const useReactivateUser = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (id: string) => usersService.reactivate(id),
    successMessage: 'User reactivated',
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
    },
  });
};
