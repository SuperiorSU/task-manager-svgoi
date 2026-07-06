import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { dashboardApi, usersApi, auditApi } from '@godigitify/api-client';
import type { Feather } from '@expo/vector-icons';

import { queryKeys } from '../constants/queryKeys';
import { presentAuditEntry } from '../utils/auditPresentation';

dayjs.extend(relativeTime);

// ─── Org stat grid + completion ring (GET /dashboard/stats — real, shared
// query key with useOrgTaskOverview in useSuperAdminTasks.ts) ────────────────

export const useOrgStats = () =>
  useQuery({
    queryKey: queryKeys.dashboard.stats('week'),
    queryFn: () => dashboardApi.getStats(),
    select: (res) => {
      const s = res.data;
      return {
        totalTasks: s.totalTasks,
        departments: s.departments,
        orgCompleted: s.completed,
        orgOverdue: s.overdue,
        inFlight: s.pending + s.accepted + s.inProgress + s.underReview,
        completionRate: s.completionRate,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

// ─── System health (activeUsers/departments from the same real stats
// endpoint; admins is a real exact count via the users list's role filter,
// not an approximation) ───────────────────────────────────────────────────

export const useSystemHealth = () => {
  const statsQuery = useQuery({
    queryKey: queryKeys.dashboard.stats('week'),
    queryFn: () => dashboardApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });
  const adminsQuery = useQuery({
    queryKey: queryKeys.users.list({ role: 'ADMIN', limit: 1 }),
    queryFn: () => usersApi.getList({ role: 'ADMIN', limit: 1 }),
    staleTime: 5 * 60 * 1000,
  });

  const data =
    statsQuery.data && adminsQuery.data
      ? {
          activeUsers: statsQuery.data.data.activeUsers,
          admins: adminsQuery.data.data.total,
          departments: statsQuery.data.data.departments,
        }
      : undefined;

  return {
    data,
    isLoading: statsQuery.isLoading || adminsQuery.isLoading,
    refetch: () => Promise.all([statsQuery.refetch(), adminsQuery.refetch()]),
  };
};

// ─── Department comparison (GET /dashboard/dept-stats — exact structural
// match for the leaderboard shape, just sorted client-side) ─────────────────

export type DepartmentComparisonEntry = {
  departmentId: string;
  departmentName: string;
  completionRate: number;
  taskCount: number;
};

export const useDepartmentComparison = () =>
  useQuery({
    queryKey: queryKeys.dashboard.deptStats(),
    queryFn: () => dashboardApi.getDeptStats(),
    select: (res) =>
      [...res.data]
        .sort((a, b) => b.completionRate - a.completionRate)
        .map((d) => ({
          departmentId: d.id,
          departmentName: d.name,
          completionRate: d.completionRate,
          taskCount: d.total,
        })),
    staleTime: 5 * 60 * 1000,
  });

// ─── Recent audit events (GET /audit, presented via the same
// presentAuditEntry() util the real Audit Log screen already uses) ─────────

export type DashboardAuditEvent = {
  id: string;
  headline: string;
  icon: keyof typeof Feather.glyphMap;
  iconBg: string;
  iconColor: string;
  contextLabel: string;
  createdAt: string;
};

export const useAuditFeed = () =>
  useQuery({
    queryKey: ['sa', 'dashboard', 'audit-feed'] as const,
    queryFn: () => auditApi.getList({ limit: 4 }),
    select: (res): DashboardAuditEvent[] =>
      res.data.items.map((entry) => {
        const presented = presentAuditEntry(entry);
        return {
          id: entry.id,
          // Full descriptive sentence (real, e.g. "User X role changed from
          // ADMIN to EMPLOYEE") — not presentAuditEntry's terse `headline`,
          // which is built for the detail screen's title, not a feed row.
          headline: entry.description,
          icon: presented.icon,
          iconBg: presented.iconBg,
          iconColor: presented.iconColor,
          contextLabel: `${dayjs(entry.createdAt).fromNow()} · ${presented.contextLabel}`,
          createdAt: entry.createdAt,
        };
      }),
    staleTime: 2 * 60 * 1000,
  });
