import type { Department } from '@godigitify/types';

import { getApiClient } from './client';

export const departmentsApi = {
  getList: () => getApiClient().get<Department[]>('/departments'),

  getById: (id: string) => getApiClient().get<Department>(`/departments/${id}`),

  create: (dto: unknown) => getApiClient().post<Department>('/departments', dto),

  update: (id: string, dto: unknown) =>
    getApiClient().patch<Department>(`/departments/${id}`, dto),
};
