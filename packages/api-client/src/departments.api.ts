import type {
  Department,
  CreateDepartmentDto,
  DepartmentSettings,
  UpdateDepartmentSettingsDto,
} from '@godigitify/types';

import { getApiClient } from './client';

export const departmentsApi = {
  getList: () => getApiClient().get<Department[]>('/departments'),

  getById: (id: string) => getApiClient().get<Department>(`/departments/${id}`),

  create: (dto: CreateDepartmentDto) => getApiClient().post<Department>('/departments', dto),

  update: (id: string, dto: unknown) =>
    getApiClient().patch<Department>(`/departments/${id}`, dto),

  getSettings: (departmentId: string) =>
    getApiClient().get<DepartmentSettings>(`/departments/${departmentId}/settings`),

  updateSettings: (departmentId: string, dto: UpdateDepartmentSettingsDto) =>
    getApiClient().patch<DepartmentSettings>(`/departments/${departmentId}/settings`, dto),
};
