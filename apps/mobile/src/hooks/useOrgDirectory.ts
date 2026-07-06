import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, departmentsApi, dashboardApi, auditApi } from '@godigitify/api-client';
import type { UserFilters } from '@godigitify/api-client';
import type {
  User,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentMember,
  AuditLogEntry,
} from '@godigitify/types';

import { queryKeys } from '../constants/queryKeys';
import { getInitials } from '../utils/initial';
import { avatarPalette } from '../utils/avatarPalette';
import { useAuthStore } from '../stores/auth.store';
import { useApiMutation } from './useApiMutation';

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

// ─── Department detail + members (SA "Department detail/members", 56a/56b) ───

export type OrgDepartmentDetail = {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  memberCount: number;
  headId?: string;
  headName?: string;
  taskStats: {
    activeCount: number;
    completedCount: number;
    inProgressCount: number;
    overdueCount: number;
    onTimeRate: number;
  };
};

export type OrgDepartmentMemberFilter = 'ALL' | 'ADMINS' | 'EMPLOYEES' | 'SUSPENDED';

export type OrgDepartmentMember = {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  avatarText: string;
  staffId: string;
  designation: string;
  role: OrgRole;
  isHead: boolean;
  status: OrgUserStatus;
};

const toOrgDepartmentMember = (m: DepartmentMember, headId?: string): OrgDepartmentMember => {
  const initials = getInitials(m.name);
  const palette = avatarPalette(initials);
  return {
    id: m.id,
    name: m.name,
    initials,
    avatarBg: palette.bg,
    avatarText: palette.fg,
    staffId: m.employeeId ?? '—',
    designation: m.designation ?? '',
    role: m.role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
    isHead: m.id === headId,
    status: m.isActive ? 'ACTIVE' : 'SUSPENDED',
  };
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
  const currentUserId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: queryKeys.users.list(filters as Record<string, unknown>),
    queryFn: () => usersApi.getList(filters),
    // This is a "manage other people" console — the viewer's own account
    // never belongs in it (they can't suspend/change-role/reset-password on
    // themselves; see OrgUserDetailScreen's isSelf guard for the same rule
    // enforced again at the detail screen, and users.service.ts's deactivate/
    // resetPassword/changeRole for the server-side enforcement).
    select: (res) => {
      const selfIncluded = res.data.items.some((u) => u.id === currentUserId);
      return {
        users: res.data.items.filter((u) => u.id !== currentUserId).map(toOrgUser),
        total: res.data.total - (selfIncluded ? 1 : 0),
      };
    },
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
 * Department detail (screen 56a): identity + task-stat KPIs, assembled from
 * departmentsApi (identity/head/member count) + dashboardApi.getDeptStats
 * (the same org-wide aggregate useOrgDepartments already uses), filtered to
 * this one department.
 */
export const useOrgDepartmentDetail = (id: string) =>
  useQuery({
    queryKey: queryKeys.departments.detail(id),
    queryFn: async () => {
      const [{ data: dept }, { data: allStats }] = await Promise.all([
        departmentsApi.getById(id),
        dashboardApi.getDeptStats(),
      ]);
      const stats = allStats.find((s) => s.id === id);
      const total = stats?.total ?? 0;
      const completed = stats?.completed ?? 0;
      const overdue = stats?.overdue ?? 0;

      const detail: OrgDepartmentDetail = {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        ...(dept.description ? { description: dept.description } : {}),
        createdAt: dept.createdAt,
        memberCount: dept._count?.users ?? 0,
        ...(dept.headId ? { headId: dept.headId } : {}),
        ...(dept.head?.name ? { headName: dept.head.name } : {}),
        taskStats: {
          activeCount: Math.max(total - completed, 0),
          completedCount: completed,
          inProgressCount: Math.max(total - completed - overdue, 0),
          overdueCount: overdue,
          onTimeRate: stats?.completionRate ?? 0,
        },
      };
      return detail;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });

/** Department roster (screen 56b), with client-side role/status filtering + composition counts. */
export const useOrgDepartmentMembers = (id: string, filter: OrgDepartmentMemberFilter) =>
  useQuery({
    queryKey: queryKeys.departments.members(id),
    queryFn: async () => {
      const [{ data: members }, { data: dept }] = await Promise.all([
        departmentsApi.getMembers(id),
        departmentsApi.getById(id),
      ]);
      const all = members.map((m) => toOrgDepartmentMember(m, dept.headId));

      const filtered = all.filter((m) => {
        switch (filter) {
          case 'ADMINS': return m.role === 'ADMIN' && m.status === 'ACTIVE';
          case 'EMPLOYEES': return m.role === 'EMPLOYEE' && m.status === 'ACTIVE';
          case 'SUSPENDED': return m.status === 'SUSPENDED';
          case 'ALL':
          default: return true;
        }
      });

      return {
        members: filtered,
        total: all.length,
        composition: {
          admins: all.filter((m) => m.role === 'ADMIN' && m.status === 'ACTIVE').length,
          employees: all.filter((m) => m.role === 'EMPLOYEE' && m.status === 'ACTIVE').length,
          suspended: all.filter((m) => m.status === 'SUSPENDED').length,
        },
      };
    },
    enabled: !!id,
    staleTime: 60 * 1000,
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
  return useApiMutation({
    mutationFn: (dto: unknown) => usersApi.create(dto),
    successMessage: 'User created',
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
};

export const useCreateOrgDepartment = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (dto: CreateDepartmentDto) => departmentsApi.create(dto),
    successMessage: 'Department created',
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.departments.list() });
    },
  });
};

export const useChangeOrgUserRole = (id: string) => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (role: OrgRole) => usersApi.changeRole(id, { role }),
    successMessage: 'Role updated',
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.orgDetail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
};

export const useResetOrgUserPassword = (id: string) => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: () => usersApi.resetPassword(id),
    successMessage: 'Password reset link sent',
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users.orgDetail(id) }),
  });
};

export const useSuspendOrgUser = (id: string) => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: () => usersApi.deactivate(id),
    successMessage: 'User suspended',
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.orgDetail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
};

export const useReactivateOrgUser = (id: string) => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: () => usersApi.reactivate(id),
    successMessage: 'User reactivated',
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.users.orgDetail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
};

export const useUpdateOrgDepartment = (id: string) => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (dto: UpdateDepartmentDto) => departmentsApi.update(id, dto),
    successMessage: 'Department updated',
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.departments.detail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.departments.list() });
    },
  });
};

export const useArchiveOrgDepartment = (id: string) => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: () => departmentsApi.archive(id),
    successMessage: 'Department archived',
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.departments.list() });
    },
  });
};

export const useReassignDepartmentHead = (id: string) => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (newHeadId: string) => departmentsApi.reassignHead(id, { newHeadId }),
    successMessage: 'Department head reassigned',
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.departments.detail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.departments.members(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.departments.list() });
      // Reassignment also flips both users' roles.
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
};
