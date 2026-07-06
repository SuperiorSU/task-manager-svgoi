import { useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentsApi, usersApi } from '@godigitify/api-client';
import type { UpdateDepartmentSettingsDto } from '@godigitify/types';

import { queryKeys } from '../constants/queryKeys';
import { useAuthStore } from '../stores/auth.store';
import { useApiMutation } from './useApiMutation';

// ─── Department settings (Approval preferences + Department settings screens) ─
// Both screens read/write the same combined DepartmentSettings row — each
// mutation sends only the subset of fields it owns as a partial patch.

export const useAdminSettings = () => {
  const departmentId = useAuthStore((s) => s.user?.departmentId) ?? '';
  return useQuery({
    queryKey: queryKeys.departments.settings(departmentId),
    queryFn: () => departmentsApi.getSettings(departmentId),
    select: (res) => res.data,
    enabled: !!departmentId,
  });
};

export const useUpdateAdminSettings = () => {
  const qc = useQueryClient();
  const departmentId = useAuthStore((s) => s.user?.departmentId) ?? '';
  return useApiMutation({
    mutationFn: (dto: UpdateDepartmentSettingsDto) =>
      departmentsApi.updateSettings(departmentId, dto),
    successMessage: 'Settings saved',
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.departments.settings(departmentId) });
    },
  });
};

// ─── Team member count (for the Management → "Manage team members" badge) ────

export const useTeamCount = () => {
  const departmentId = useAuthStore((s) => s.user?.departmentId) ?? '';
  return useQuery({
    queryKey: ['admin', 'team', 'count', departmentId],
    queryFn: async () => {
      const { data } = await usersApi.getList({ departmentId, isActive: true, limit: 1 });
      return data.total;
    },
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000,
  });
};
