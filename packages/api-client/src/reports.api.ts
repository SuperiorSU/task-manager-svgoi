import type { ReportRecord, RequestReportDto } from '@godigitify/types';

import { getApiClient } from './client';

export const reportsApi = {
  requestReport: (dto: RequestReportDto) =>
    getApiClient().post<ReportRecord>('/reports/request', dto),

  getDownloadUrl: (reportId: string) =>
    getApiClient().get<{ reportId: string; label: string; message: string }>(`/reports/${reportId}/download`),

  getList: () => getApiClient().get<ReportRecord[]>('/reports'),
};
