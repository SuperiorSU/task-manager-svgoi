export type ReportType =
  | 'TASK_SUMMARY'
  | 'USER_PERFORMANCE'
  | 'DEPARTMENT_COMPARISON'
  | 'OVERDUE_ANALYSIS'
  | 'CROSS_DEPT_ASSIGNMENT';

export type ReportStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type ReportRecord = {
  id: string;
  type: ReportType;
  label: string;
  status: ReportStatus;
  requestedBy: string;
  requesterName: string;
  dateRange: { from: string; to: string };
  downloadUrl?: string;
  fileSizeKb?: number;
  createdAt: string;
  completedAt?: string;
};

export type RequestReportDto = {
  type: ReportType;
  dateRange?: { from: string; to: string };
};
