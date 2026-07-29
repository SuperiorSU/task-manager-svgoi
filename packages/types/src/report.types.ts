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

// ─── Generate (real download) ─────────────────────────────────────────────────

/** Whose data the report covers. ADMIN is always locked to their own dept. */
export type ReportScope = 'org' | 'department' | 'admin' | 'employee';
export type ReportFormat = 'csv' | 'xlsx' | 'pdf';

export type ReportFilters = {
  status?: string;
  priority?: string;
};

export type GenerateReportDto = {
  type: ReportType;
  scope: ReportScope;
  /** Department id (scope=department) or user id (scope=admin|employee). */
  targetId?: string;
  dateRange: { from: string; to: string };
  filters?: ReportFilters;
  format: ReportFormat;
};
