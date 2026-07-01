'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { departmentsService } from '@/services/departments.service';

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
  return useMutation({
    mutationFn: (dto: { name: string; code: string; description?: string; headId?: string }) =>
      departmentsService.create(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.departments.all() });
    },
  });
};

export const useUpdateDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { name?: string; code?: string; description?: string; headId?: string } }) =>
      departmentsService.update(id, dto),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.departments.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.departments.detail(id) });
    },
  });
};
