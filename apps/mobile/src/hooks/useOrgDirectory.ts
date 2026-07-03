import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { orgDirectoryService, type OrgUserFilter } from '../services/orgDirectory.service';
import type { CreateOrgUserPayload, CreateOrgDepartmentPayload, OrgRole } from '../data/orgDirectory.mock';

// ─── Keys ─────────────────────────────────────────────────────────────────────

const QK = {
  root: ['sa', 'org'] as const,
  users: (filter: OrgUserFilter, search: string) => ['sa', 'org', 'users', filter, search] as const,
  departments: (search: string) => ['sa', 'org', 'departments', search] as const,
  admins: ['sa', 'org', 'admins'] as const,
  departmentRefs: ['sa', 'org', 'department-refs'] as const,
  userDetail: (id: string) => ['sa', 'org', 'user-detail', id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useOrgUsers = (filter: OrgUserFilter, search: string) =>
  useQuery({
    queryKey: QK.users(filter, search),
    queryFn: () => orgDirectoryService.getUsers(filter, search),
    staleTime: 60 * 1000,
  });

export const useOrgDepartments = (search: string) =>
  useQuery({
    queryKey: QK.departments(search),
    queryFn: () => orgDirectoryService.getDepartments(search),
    staleTime: 60 * 1000,
  });

export const useOrgAdmins = () =>
  useQuery({
    queryKey: QK.admins,
    queryFn: orgDirectoryService.getAdmins,
    staleTime: 5 * 60 * 1000,
  });

export const useOrgDepartmentRefs = () =>
  useQuery({
    queryKey: QK.departmentRefs,
    queryFn: orgDirectoryService.getAllDepartmentRefs,
    staleTime: 5 * 60 * 1000,
  });

export const useOrgUserDetail = (id: string) =>
  useQuery({
    queryKey: QK.userDetail(id),
    queryFn: () => orgDirectoryService.getUserDetail(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useCreateOrgUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrgUserPayload) => orgDirectoryService.createUser(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.root }),
  });
};

export const useCreateOrgDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrgDepartmentPayload) => orgDirectoryService.createDepartment(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.root }),
  });
};

export const useChangeOrgUserRole = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (role: OrgRole) => orgDirectoryService.changeUserRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.root }),
  });
};

export const useResetOrgUserPassword = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => orgDirectoryService.resetUserPassword(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.userDetail(id) }),
  });
};

export const useSuspendOrgUser = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => orgDirectoryService.suspendUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.root }),
  });
};

export const useReactivateOrgUser = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => orgDirectoryService.reactivateUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.root }),
  });
};
