import { getApiClient } from './client';

export const reportsApi = {
  requestReport: (type: string, params: Record<string, unknown>) =>
    getApiClient().post<{ reportId: string }>('/reports', { type, ...params }),

  getDownloadUrl: (reportId: string) =>
    getApiClient().get<{ url: string }>(`/reports/${reportId}/download`),

  getList: () => getApiClient().get<unknown[]>('/reports'),
};
