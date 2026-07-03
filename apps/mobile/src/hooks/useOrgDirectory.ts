import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, departmentsApi, dashboardApi } from '@godigitify/api-client';
import type { UserFilters } from '@godigitify/api-client';
import type { User, CreateDepartmentDto } from '@godigitify/types';

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
    onSuccess: (res) => {
      sessionCreatedDeptIds.add(res.data.id);
      void qc.invalidateQueries({ queryKey: queryKeys.departments.list() });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.deptStats() });
    },
  });
};
