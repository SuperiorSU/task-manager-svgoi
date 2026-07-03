import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from '@godigitify/api-client';
import type { UpdateDepartmentSettingsDto } from '@godigitify/types';

import { queryKeys } from '../constants/queryKeys';
import { useAuthStore } from '../stores/auth.store';
import { teamService } from '../services/team.service';
import { ADMIN_DEPT } from '../data/team.mock';

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
  return useMutation({
    mutationFn: (dto: UpdateDepartmentSettingsDto) =>
      departmentsApi.updateSettings(departmentId, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.departments.settings(departmentId) });
    },
  });
};

// ─── Team member count (for the Management → "Manage team members" badge) ────

export const useTeamCount = () =>
  useQuery({
    queryKey: ['admin', 'team', 'count'],
    queryFn: async () => {
      const { members } = await teamService.getTeamList('ALL', '', ADMIN_DEPT.id);
      return members.length;
    },
    staleTime: 5 * 60 * 1000,
  });
