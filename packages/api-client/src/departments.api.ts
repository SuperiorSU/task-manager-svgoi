import type {
  Department,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentSettings,
  UpdateDepartmentSettingsDto,
  DepartmentMember,
  ReassignDepartmentHeadDto,
} from '@godigitify/types';

import { getApiClient } from './client';

export const departmentsApi = {
  getList: () => getApiClient().get<Department[]>('/departments'),

  getById: (id: string) => getApiClient().get<Department>(`/departments/${id}`),

  create: (dto: CreateDepartmentDto) => getApiClient().post<Department>('/departments', dto),

  update: (id: string, dto: UpdateDepartmentDto) =>
    getApiClient().patch<Department>(`/departments/${id}`, dto),

  getSettings: (departmentId: string) =>
    getApiClient().get<DepartmentSettings>(`/departments/${departmentId}/settings`),

  updateSettings: (departmentId: string, dto: UpdateDepartmentSettingsDto) =>
    getApiClient().patch<DepartmentSettings>(`/departments/${departmentId}/settings`, dto),

  getMembers: (id: string) => getApiClient().get<DepartmentMember[]>(`/departments/${id}/members`),

  archive: (id: string) => getApiClient().patch<void>(`/departments/${id}/archive`),

  reactivate: (id: string) => getApiClient().patch<void>(`/departments/${id}/reactivate`),

  reassignHead: (id: string, dto: ReassignDepartmentHeadDto) =>
    getApiClient().post<Department>(`/departments/${id}/reassign-head`, dto),
};
