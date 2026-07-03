import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { dashboardApi, tasksApi } from '@godigitify/api-client';
import type { DeptHealth, Escalation, EscalationType, RichTask, StaffLoad } from '@godigitify/types';

import { queryKeys } from '../constants/queryKeys';
import { getInitials } from '../utils/initial';
import { avatarPalette } from '../utils/avatarPalette';
import { superAdminTasksService } from '../services/superAdminTasks.service';

// Governance-only query key — dept-health/staff-load/escalations use the
// shared `queryKeys.dashboard.*` builders instead (real dashboard endpoints).
// Governance task detail/create/approve/revise now live in useGovernance.ts
// (real governanceApi) — only the groups summary below is still mock-backed.
const QK = {
  governanceGroups: ['sa', 'tasks', 'governance'] as const,
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

const isTaskOverdue = (t: RichTask) =>
  !['COMPLETED', 'CANCELLED'].includes(t.status) && dayjs(t.dueDate).isBefore(dayjs());

/** Real `StaffLoad` has no riskLevel (unlike DeptHealth, which the backend
 * computes server-side) — approximated client-side from capacity/overdue
 * since there's no backend-authoritative source for it. Documented heuristic,
 * not fabricated data. */
function deriveStaffRisk(staff: StaffLoad): DeptHealth['riskLevel'] {
  if (staff.capacityPercent >= 140 || staff.overdueCount >= 4) return 'CRITICAL';
  if (staff.capacityPercent >= 80 || staff.overdueCount >= 1) return 'AT_RISK';
  return 'HEALTHY';
}

export type StaffLoadCardData = {
  staffId: string;
  name: string;
  initials: string;
  avatarBg: string;
  departmentId: string | null;
  departmentName: string;
  managerName: string;
  activeCount: number;
  overdueCount: number;
  avgCycleDays: number;
  capacityTarget: number;
  capacityPercent: number;
  riskLevel: DeptHealth['riskLevel'];
};

function toStaffLoadCardData(staff: StaffLoad, dept: DeptHealth | undefined): StaffLoadCardData {
  const initials = getInitials(staff.name);
  return {
    staffId: staff.userId,
    name: staff.name,
    initials,
    avatarBg: avatarPalette(initials).bg,
    departmentId: staff.departmentId ?? null,
    departmentName: dept?.departmentName ?? '—',
    managerName: dept?.adminName ?? '—',
    activeCount: staff.activeCount,
    overdueCount: staff.overdueCount,
    avgCycleDays: staff.avgCycleDays,
    capacityTarget: staff.capacityTarget,
    capacityPercent: staff.capacityPercent,
    riskLevel: deriveStaffRisk(staff),
  };
}

// ─── Department health / staff load / escalations (real dashboard endpoints) ─

export const useDeptHealthList = () =>
  useQuery({
    queryKey: queryKeys.dashboard.deptHealth(),
    queryFn: () => dashboardApi.getDeptHealth(),
    select: (res) => res.data,
    staleTime: 5 * 60 * 1000,
  });

export const useStaffLoadList = () =>
  useQuery({
    queryKey: queryKeys.dashboard.staffLoad(),
    queryFn: () => dashboardApi.getStaffLoad(),
    select: (res) => res.data,
    staleTime: 5 * 60 * 1000,
  });

export type ResolvedEscalation = {
  id: string;
  typeLabel: string;
  badgeBg: string;
  badgeColor: string;
  barColor: string;
  departmentId: string;
  departmentName: string;
  headline: string;
  ownerId: string;
  ownerName: string;
  ownerInitials: string;
  ownerActioned: boolean;
  detectedAt: string;
};

const ESCALATION_TYPE_META: Record<
  EscalationType,
  { label: string; badgeBg: string; badgeColor: string; barColor: string }
> = {
  OVERDUE_CLUSTER: { label: 'Overdue cluster', badgeBg: '#FEF2F2', badgeColor: '#B91C1C', barColor: '#EF4444' },
  REVIEW_STALLED: { label: 'Review stalled', badgeBg: '#FFFBEB', badgeColor: '#B45309', barColor: '#F59E0B' },
  PENDING_ACCEPT_STALLED: { label: 'Pending acceptance', badgeBg: '#FFFBEB', badgeColor: '#B45309', barColor: '#F59E0B' },
};

const ESCALATION_HEADLINE: Record<EscalationType, (deptName: string, count: number) => string> = {
  OVERDUE_CLUSTER: (deptName, count) => `${deptName} · ${count} tasks overdue > 3 days`,
  REVIEW_STALLED: (deptName, count) => `${deptName} · ${count} submissions awaiting review > 48h`,
  PENDING_ACCEPT_STALLED: (deptName, count) => `${deptName} · ${count} tasks pending acceptance > 24h`,
};

function resolveEscalation(entry: Escalation, depts: DeptHealth[]): ResolvedEscalation {
  const meta = ESCALATION_TYPE_META[entry.type];
  const dept = depts.find((d) => d.departmentId === entry.departmentId);
  const ownerName = dept?.adminName ?? 'Admin';

  return {
    id: entry.id,
    typeLabel: meta.label,
    badgeBg: meta.badgeBg,
    badgeColor: meta.badgeColor,
    barColor: meta.barColor,
    departmentId: entry.departmentId,
    departmentName: entry.departmentName,
    headline: ESCALATION_HEADLINE[entry.type](entry.departmentName, entry.count),
    ownerId: entry.ownerId ?? dept?.adminId ?? '',
    ownerName,
    ownerInitials: getInitials(ownerName),
    ownerActioned: entry.ownerActioned,
    detectedAt: entry.detectedAt,
  };
}

export const useEscalations = () => {
  const escalationsQuery = useQuery({
    queryKey: queryKeys.dashboard.escalations(),
    queryFn: () => dashboardApi.getEscalations(),
    select: (res) => res.data,
    staleTime: 2 * 60 * 1000,
  });
  const deptsQuery = useDeptHealthList();

  const data =
    escalationsQuery.data && deptsQuery.data
      ? escalationsQuery.data.map((e) => resolveEscalation(e, deptsQuery.data))
      : undefined;

  return {
    ...escalationsQuery,
    data,
    isLoading: escalationsQuery.isLoading || deptsQuery.isLoading,
  };
};

// ─── Org-wide overview (aggregated client-side from real dept-health) ────────

export type OrgTaskOverview = {
  activeCount: number;
  overdueCount: number;
  overduePercent: number;
  completedThisWeek: number;
  onTimeRate: number;
  statusDistribution: DeptHealth['statusDistribution'];
  departmentCount: number;
};

function weightedOnTimeRate(depts: DeptHealth[]): number {
  const totalActive = depts.reduce((sum, d) => sum + d.activeCount, 0);
  if (!totalActive) return 0;
  const weighted = depts.reduce((sum, d) => sum + d.onTimeRate * d.activeCount, 0);
  return Math.round(weighted / totalActive);
}

function sumDistribution(depts: DeptHealth[]): DeptHealth['statusDistribution'] {
  return depts.reduce(
    (acc, d) => ({
      pending: acc.pending + d.statusDistribution.pending,
      inProgress: acc.inProgress + d.statusDistribution.inProgress,
      review: acc.review + d.statusDistribution.review,
      overdue: acc.overdue + d.statusDistribution.overdue,
      blocked: acc.blocked + d.statusDistribution.blocked,
    }),
    { pending: 0, inProgress: 0, review: 0, overdue: 0, blocked: 0 }
  );
}

// Weekly created/completed trend has no real backend endpoint (dashboardApi
// has no getTrend, and getWorkload() is per-user not per-day, so it can't be
// reshaped into a daily series) — the Weekly Throughput chart is dropped from
// the Overview segment rather than fabricated. completedThisWeek below is
// sourced from the general /dashboard/stats endpoint instead (already real).
export const useOrgTaskOverview = () => {
  const deptsQuery = useDeptHealthList();
  const statsQuery = useQuery({
    queryKey: queryKeys.dashboard.stats('week'),
    queryFn: () => dashboardApi.getStats('week'),
    select: (res) => res.data,
    staleTime: 5 * 60 * 1000,
  });

  const depts = deptsQuery.data;
  const data: OrgTaskOverview | undefined = depts
    ? {
        activeCount: depts.reduce((sum, d) => sum + d.activeCount, 0),
        overdueCount: depts.reduce((sum, d) => sum + d.overdueCount, 0),
        overduePercent: (() => {
          const active = depts.reduce((sum, d) => sum + d.activeCount, 0);
          const overdue = depts.reduce((sum, d) => sum + d.overdueCount, 0);
          return active ? Math.round((overdue / active) * 1000) / 10 : 0;
        })(),
        completedThisWeek: statsQuery.data?.completedThisWeek ?? 0,
        onTimeRate: weightedOnTimeRate(depts),
        statusDistribution: sumDistribution(depts),
        departmentCount: depts.length,
      }
    : undefined;

  return {
    data,
    isLoading: deptsQuery.isLoading || statsQuery.isLoading,
    refetch: () => Promise.all([deptsQuery.refetch(), statsQuery.refetch()]),
  };
};

// ─── Department drill-down (dept-health + staff-load, joined client-side) ────

export const useDeptTaskDetail = (deptId: string) => {
  const deptsQuery = useDeptHealthList();
  const staffQuery = useStaffLoadList();

  const dept = deptsQuery.data?.find((d) => d.departmentId === deptId);
  const staffLoad = dept
    ? (staffQuery.data ?? [])
        .filter((s) => s.departmentId === deptId)
        .map((s) => toStaffLoadCardData(s, dept))
        .sort((a, b) => b.overdueCount - a.overdueCount || b.activeCount - a.activeCount)
    : [];

  return {
    dept,
    staffLoad,
    isLoading: deptsQuery.isLoading || staffQuery.isLoading,
  };
};

// ─── Staff load detail (single record, joined with its department) ──────────

export const useStaffLoadDetail = (staffId: string) => {
  const staffQuery = useStaffLoadList();
  const deptsQuery = useDeptHealthList();

  const staff = staffQuery.data?.find((s) => s.userId === staffId);
  const dept = staff?.departmentId ? deptsQuery.data?.find((d) => d.departmentId === staff.departmentId) : undefined;

  return {
    data: staff ? toStaffLoadCardData(staff, dept) : undefined,
    isLoading: staffQuery.isLoading || deptsQuery.isLoading,
  };
};

// ─── Staff task list / detail (real, per-assignee task queries) ─────────────
// Per-id "staff task list" and "staff task detail" aggregate endpoints don't
// exist server-side — these compose the same real, pre-existing
// tasksApi.getList/getById/getActivity calls the Admin flows already use,
// filtered by assigneeId. Every staff member now has a real task list (not
// just the one FR-72 demo case the mock authored).

export const useStaffTasks = (staffId: string) =>
  useQuery({
    queryKey: queryKeys.tasks.list({ assigneeId: staffId }),
    queryFn: () => tasksApi.getList({ assigneeId: staffId, limit: 100, sortBy: 'dueDate', order: 'asc' }),
    select: (res) => res.data,
    enabled: !!staffId,
    staleTime: 2 * 60 * 1000,
  });

export const useStaffTaskDetail = (taskId: string) => {
  const taskQuery = useQuery({
    queryKey: queryKeys.tasks.detail(taskId),
    queryFn: () => tasksApi.getById(taskId),
    select: (res) => res.data,
    enabled: !!taskId,
    staleTime: 2 * 60 * 1000,
  });
  const activityQuery = useQuery({
    queryKey: queryKeys.tasks.activity(taskId),
    queryFn: () => tasksApi.getActivity(taskId),
    select: (res) => res.data,
    enabled: !!taskId,
    staleTime: 2 * 60 * 1000,
  });

  return {
    data: taskQuery.data ? { task: taskQuery.data, activity: activityQuery.data ?? [] } : undefined,
    isLoading: taskQuery.isLoading || activityQuery.isLoading,
  };
};

// ─── Governance summary tile (aggregate oversight tab) — still mock-backed ──
// Only the grouped-counts summary used by the org-wide oversight tab remains
// here; the SA's own governance list/detail/create/approve/revise flow
// (GovernanceTasksScreen and friends) now uses useGovernance.ts against the
// real governanceApi.

export const useGovernanceTaskGroups = () =>
  useQuery({
    queryKey: QK.governanceGroups,
    queryFn: superAdminTasksService.getGovernanceTaskGroups,
    staleTime: 60 * 1000,
  });
