import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, departmentsApi, dashboardApi, auditApi } from '@godigitify/api-client';
import type { UserFilters } from '@godigitify/api-client';
import type { User, CreateDepartmentDto, AuditLogEntry } from '@godigitify/types';

import { queryKeys } from '../constants/queryKeys';
import { getInitials } from '../utils/initial';
import { avatarPalette } from '../utils/avatarPalette';

// ─── Types ────────────────────────────────────────────────────────────────────
// Org-wide, cross-department, both roles (ADMIN + EMPLOYEE) — distinct from
// usePeople/useUsers, which serves the generic user directory. Presentation
// fields (initials/avatarBg/avatarText) are computed client-side here since
// the API only returns the underlying User.

export type OrgRole = 'ADMIN' | 'EMPLOYEE';
export type OrgUserStatus = 'ACTIVE' | 'SUSPENDED';
export type OrgUserFilter = 'ALL' | 'ADMINS' | 'EMPLOYEES' | 'SUSPENDED';

export type OrgDepartmentRef = { id: string; name: string };

export type OrgUser = {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  avatarText: string;
  staffId: string;
  email: string;
  phone?: string;
  designation: string;
  role: OrgRole;
  /** Prisma `departmentId` is a singular FK, so this holds at most one entry. */
  departments: OrgDepartmentRef[];
  status: OrgUserStatus;
  createdAt: string;
};

export type OrgDepartmentWithStats = {
  id: string;
  name: string;
  code: string;
  headUserId?: string;
  headName?: string;
  memberCount: number;
  completionRate: number;
  /** True only for departments created during this session — drives the "NEW" badge. */
  createdInSession: boolean;
};

// ─── User detail — account activity + ongoing load (SA "User detail", 68) ────

export type OrgUserActivityKind = 'ACCOUNT_CREATED' | 'ROLE_CHANGED' | 'PASSWORD_RESET' | 'SUSPENDED' | 'REACTIVATED' | 'PROFILE_UPDATED';

export type OrgUserActivityEvent = {
  id: string;
  kind: OrgUserActivityKind;
  description: string;
  createdAt: string;
};

export const ORG_USER_ACTIVITY_META: Record<OrgUserActivityKind, { dotColor: string; ringColor: string }> = {
  ACCOUNT_CREATED: { dotColor: '#94A3B8', ringColor: '#E2E8F0' },
  ROLE_CHANGED: { dotColor: '#4F46E5', ringColor: '#C7D2FE' },
  PASSWORD_RESET: { dotColor: '#F59E0B', ringColor: '#FDE68A' },
  SUSPENDED: { dotColor: '#60A5FA', ringColor: '#BFDBFE' },
  REACTIVATED: { dotColor: '#22C55E', ringColor: '#BBF7D0' },
  PROFILE_UPDATED: { dotColor: '#94A3B8', ringColor: '#E2E8F0' },
};

export type OrgUserOngoingLoad =
  | { kind: 'STAFF'; activeCount: number; overdueCount: number; onTimeRate: number; avgCycleDays: number }
  | { kind: 'DEPT'; staffCount: number; activeCount: number; overdueCount: number; onTimeRate: number };

export type OrgUserDetail = OrgUser & {
  lastActiveAt: string;
  lastActiveIp: string;
  /** Employee → the dept they belong to's home screen; Admin → the dept they administer. */
  primaryDepartmentId: string | null;
  ongoingLoad: OrgUserOngoingLoad;
  activityHistory: OrgUserActivityEvent[];
};

// Departments created in this session — client-only bookkeeping for the "NEW"
// badge, since the API has no such flag.
const sessionCreatedDeptIds = new Set<string>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toOrgUser = (user: User): OrgUser => {
  const initials = getInitials(user.name);
  const palette = avatarPalette(initials);
  return {
    id: user.id,
    name: user.name,
    initials,
    avatarBg: palette.bg,
    avatarText: palette.fg,
    staffId: user.employeeId ?? '—',
    email: user.email,
    ...(user.phone ? { phone: user.phone } : {}),
    designation: user.designation ?? '',
    role: user.role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
    departments: user.department ? [{ id: user.department.id, name: user.department.name }] : [],
    status: user.isActive ? 'ACTIVE' : 'SUSPENDED',
    createdAt: user.createdAt,
  };
};

const filterToUserFilters = (filter: OrgUserFilter, search: string): UserFilters => {
  const base: UserFilters = { limit: 100, ...(search ? { search } : {}) };
  switch (filter) {
    case 'ADMINS':
      return { ...base, role: 'ADMIN', isActive: true };
    case 'EMPLOYEES':
      return { ...base, role: 'EMPLOYEE', isActive: true };
    case 'SUSPENDED':
      return { ...base, isActive: false };
    case 'ALL':
    default:
      return base;
  }
};

// User-management mutations all log identical `action: 'UPDATE', entityType:
// 'User'` audit entries (see users.service.ts / users.routes.ts on the API) —
// the description text is the only signal that distinguishes them.
const inferActivityKind = (entry: AuditLogEntry): OrgUserActivityKind => {
  if (entry.action === 'CREATE') return 'ACCOUNT_CREATED';
  const d = entry.description.toLowerCase();
  if (d.includes('reactivat')) return 'REACTIVATED';
  if (d.includes('deactivat') || d.includes('suspend')) return 'SUSPENDED';
  if (d.includes('password reset')) return 'PASSWORD_RESET';
  if (d.includes('role')) return 'ROLE_CHANGED';
  return 'PROFILE_UPDATED';
};

const toActivityEvent = (entry: AuditLogEntry): OrgUserActivityEvent => ({
  id: entry.id,
  kind: inferActivityKind(entry),
  description: entry.description,
  createdAt: entry.createdAt,
});

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useOrgUsers = (filter: OrgUserFilter, search: string) => {
  const filters = filterToUserFilters(filter, search);
  return useQuery({
    queryKey: queryKeys.users.list(filters as Record<string, unknown>),
    queryFn: () => usersApi.getList(filters),
    select: (res) => ({ users: res.data.items.map(toOrgUser), total: res.data.total }),
    staleTime: 60 * 1000,
  });
};

export const useOrgDepartments = (search: string) => {
  const departmentsQuery = useQuery({
    queryKey: queryKeys.departments.list(),
    queryFn: () => departmentsApi.getList(),
    select: (res) => res.data,
    staleTime: 60 * 1000,
  });

  const deptStatsQuery = useQuery({
    queryKey: queryKeys.dashboard.deptStats(),
    queryFn: () => dashboardApi.getDeptStats(),
    select: (res) => res.data,
    staleTime: 60 * 1000,
  });

  // Org-wide member list, reused to derive per-department head name + member
  // count — there's no dedicated aggregate endpoint for these yet.
  const membersQuery = useQuery({
    queryKey: queryKeys.users.list({ scope: 'org-members', limit: 500 }),
    queryFn: () => usersApi.getList({ limit: 500 }),
    select: (res) => res.data.items,
    staleTime: 60 * 1000,
  });

  const isLoading = departmentsQuery.isLoading || deptStatsQuery.isLoading || membersQuery.isLoading;

  const data = useMemo(() => {
    const departments = departmentsQuery.data ?? [];
    const users = membersQuery.data ?? [];
    const completionByDept = new Map((deptStatsQuery.data ?? []).map((d) => [d.id, d.completionRate]));

    const q = search.toLowerCase();
    const withStats: OrgDepartmentWithStats[] = departments
      .filter((d) => !q || d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q))
      .map((dept) => {
        const head = users.find((u) => u.id === dept.headId);
        return {
          id: dept.id,
          name: dept.name,
          code: dept.code,
          ...(dept.headId ? { headUserId: dept.headId } : {}),
          ...(head ? { headName: head.name } : {}),
          memberCount: users.filter((u) => u.departmentId === dept.id).length,
          completionRate: completionByDept.get(dept.id) ?? 0,
          createdInSession: sessionCreatedDeptIds.has(dept.id),
        };
      });

    return { departments: withStats, total: departments.length };
  }, [departmentsQuery.data, deptStatsQuery.data, membersQuery.data, search]);

  return {
    data,
    isLoading,
    refetch: () => Promise.all([departmentsQuery.refetch(), deptStatsQuery.refetch(), membersQuery.refetch()]),
  };
};

export const useOrgAdmins = () =>
  useQuery({
    queryKey: queryKeys.users.list({ role: 'ADMIN', isActive: true, scope: 'org-admins' }),
    queryFn: () => usersApi.getList({ role: 'ADMIN', isActive: true, limit: 100 }),
    select: (res) => res.data.items.map(toOrgUser),
    staleTime: 5 * 60 * 1000,
  });

export const useOrgDepartmentRefs = () =>
  useQuery({
    queryKey: queryKeys.departments.list(),
    queryFn: () => departmentsApi.getList(),
    select: (res) => res.data.map((d): OrgDepartmentRef => ({ id: d.id, name: d.name })),
    staleTime: 5 * 60 * 1000,
  });

/**
 * Full user record for the "User detail" screen (68): identity + account
 * info + ongoing load + activity history — assembled from usersApi (identity),
 * dashboardApi (dept-health / staff-load, the same aggregates the rest of the
 * SA task oversight module already uses) and auditApi (activity ledger).
 */
export const useOrgUserDetail = (id: string) =>
  useQuery({
    queryKey: queryKeys.users.orgDetail(id),
    queryFn: async () => {
      const [{ data: user }, { data: activityPage }] = await Promise.all([
        usersApi.getById(id),
        auditApi.getByActor(id, 1, 25),
      ]);

      const ongoingLoad: OrgUserOngoingLoad =
        user.role === 'ADMIN'
          ? await (async () => {
              const { data: depts } = await dashboardApi.getDeptHealth();
              const dept = depts.find((d) => d.adminId === user.id);
              return {
                kind: 'DEPT' as const,
                staffCount: dept?.staffCount ?? 0,
                activeCount: dept?.activeCount ?? 0,
                overdueCount: dept?.overdueCount ?? 0,
                onTimeRate: dept?.onTimeRate ?? 0,
              };
            })()
          : await (async () => {
              const [{ data: stats }, { data: staffLoad }] = await Promise.all([
                usersApi.getTaskStats(id),
                dashboardApi.getStaffLoad(),
              ]);
              const load = staffLoad.find((s) => s.userId === id);
              return {
                kind: 'STAFF' as const,
                activeCount: Math.max(stats.assigned - stats.completed, 0),
                overdueCount: stats.overdue,
                onTimeRate: stats.onTimeRate,
                avgCycleDays: load?.avgCycleDays ?? 0,
              };
            })();

      const lastIpEvent = activityPage.items.find((e) => e.ipAddress);

      const detail: OrgUserDetail = {
        ...toOrgUser(user),
        lastActiveAt: user.lastLoginAt ?? user.createdAt,
        lastActiveIp: lastIpEvent?.ipAddress ?? '—',
        primaryDepartmentId: user.department?.id ?? null,
        ongoingLoad,
        activityHistory: activityPage.items.map(toActivityEvent),
      };
      return detail;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useCreateOrgUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: unknown) => usersApi.create(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
};

export const useCreateOrgDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDepartmentDto) => departmentsApi.create(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.departments.list() });
    },
  });
};

/**
 * NOTE: the backend's PATCH /users/:id whitelists only name/phone/designation/
 * departmentId/managerId — `role` is currently accepted here but silently
 * dropped server-side (no role-change endpoint exists yet). Wired ahead of
 * that backend support landing rather than left unimplemented.
 */
export const useChangeOrgUserRole = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (role: OrgRole) => usersApi.update(id, { role }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.orgDetail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
};

export const useResetOrgUserPassword = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => usersApi.resetPassword(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users.orgDetail(id) }),
  });
};

export const useSuspendOrgUser = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => usersApi.deactivate(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.orgDetail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
};

export const useReactivateOrgUser = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => usersApi.reactivate(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.orgDetail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
};
