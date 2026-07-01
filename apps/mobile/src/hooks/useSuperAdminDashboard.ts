import { useQuery } from '@tanstack/react-query';

import { superAdminDashboardService } from '../services/superAdminDashboard.service';

// ─── Keys ─────────────────────────────────────────────────────────────────────

const QK = {
  orgStats: ['sa', 'dashboard', 'org-stats'] as const,
  systemHealth: ['sa', 'dashboard', 'system-health'] as const,
  departmentComparison: ['sa', 'dashboard', 'department-comparison'] as const,
  auditFeed: ['sa', 'dashboard', 'audit-feed'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useOrgStats = () =>
  useQuery({
    queryKey: QK.orgStats,
    queryFn: superAdminDashboardService.getOrgStats,
    staleTime: 5 * 60 * 1000,
  });

export const useSystemHealth = () =>
  useQuery({
    queryKey: QK.systemHealth,
    queryFn: superAdminDashboardService.getSystemHealth,
    staleTime: 5 * 60 * 1000,
  });

export const useDepartmentComparison = () =>
  useQuery({
    queryKey: QK.departmentComparison,
    queryFn: superAdminDashboardService.getDepartmentComparison,
    staleTime: 5 * 60 * 1000,
  });

export const useAuditFeed = () =>
  useQuery({
    queryKey: QK.auditFeed,
    queryFn: superAdminDashboardService.getAuditFeed,
    staleTime: 2 * 60 * 1000,
  });
