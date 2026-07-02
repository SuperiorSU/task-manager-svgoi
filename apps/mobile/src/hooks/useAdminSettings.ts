import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminSettingsService } from '../services/adminSettings.service';
import { teamService } from '../services/team.service';
import { ADMIN_DEPT } from '../data/team.mock';
import type { ApprovalPreferences, DepartmentSettings } from '../data/adminSettings.mock';

// ─── Keys ─────────────────────────────────────────────────────────────────────

const QK = {
  approvalPreferences: ['admin', 'approval-preferences'] as const,
  departmentSettings: ['admin', 'department-settings'] as const,
  teamCount: ['admin', 'team', 'count'] as const,
};

// ─── Approval preferences ─────────────────────────────────────────────────────

export const useApprovalPreferences = () =>
  useQuery({
    queryKey: QK.approvalPreferences,
    queryFn: adminSettingsService.getApprovalPreferences,
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateApprovalPreferences = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<ApprovalPreferences>) =>
      adminSettingsService.updateApprovalPreferences(patch),
    onSuccess: (updated) => qc.setQueryData(QK.approvalPreferences, updated),
  });
};

// ─── Department settings ──────────────────────────────────────────────────────

export const useDepartmentSettings = () =>
  useQuery({
    queryKey: QK.departmentSettings,
    queryFn: adminSettingsService.getDepartmentSettings,
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateDepartmentSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<DepartmentSettings>) =>
      adminSettingsService.updateDepartmentSettings(patch),
    onSuccess: (updated) => qc.setQueryData(QK.departmentSettings, updated),
  });
};

// ─── Team member count (for the Management → "Manage team members" badge) ────

export const useTeamCount = () =>
  useQuery({
    queryKey: QK.teamCount,
    queryFn: async () => {
      const { members } = await teamService.getTeamList('ALL', '', ADMIN_DEPT.id);
      return members.length;
    },
    staleTime: 5 * 60 * 1000,
  });
