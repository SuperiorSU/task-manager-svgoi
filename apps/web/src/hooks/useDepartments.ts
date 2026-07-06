'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { departmentsService } from '@/services/departments.service';
import { useApiMutation } from './useApiMutation';

export const useDepartments = () =>
  useQuery({
    queryKey: queryKeys.departments.list(),
    queryFn: () => departmentsService.list(),
    staleTime: 10 * 60 * 1000,
  });

export const useDepartment = (id: string) =>
  useQuery({
    queryKey: queryKeys.departments.detail(id),
    queryFn: () => departmentsService.get(id),
    enabled: !!id,
  });

export const useCreateDepartment = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (dto: { name: string; code: string; description?: string; headId?: string }) =>
      departmentsService.create(dto),
    successMessage: 'Department created',
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.departments.all() });
    },
  });
};

export const useUpdateDepartment = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { name?: string; code?: string; description?: string; headId?: string } }) =>
      departmentsService.update(id, dto),
    successMessage: 'Department updated',
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.departments.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.departments.detail(id) });
    },
  });
};
