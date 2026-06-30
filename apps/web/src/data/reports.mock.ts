export type ReportRecord = {
  id: string;
  type: string;
  label: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'PROCESSING';
  requestedBy: string;
  requesterName: string;
  dateRange: { from: string; to: string };
  downloadUrl?: string;
  fileSizeKb?: number;
  createdAt: string;
  completedAt?: string;
};

const past = (days: number) =>
  new Date(Date.now() - days * 86400000).toISOString();

export const MOCK_REPORTS: ReportRecord[] = [
  {
    id: 'report_001',
    type: 'TASK_SUMMARY',
    label: 'Task Summary',
    status: 'COMPLETED',
    requestedBy: 'user_sa',
    requesterName: 'Dr. Ramesh Iyer',
    dateRange: { from: past(30), to: past(0) },
    downloadUrl: '#',
    fileSizeKb: 248,
    createdAt: past(2),
    completedAt: past(2),
  },
  {
    id: 'report_002',
    type: 'DEPARTMENT_COMPARISON',
    label: 'Department Comparison',
    status: 'COMPLETED',
    requestedBy: 'user_sa',
    requesterName: 'Dr. Ramesh Iyer',
    dateRange: { from: past(60), to: past(0) },
    downloadUrl: '#',
    fileSizeKb: 385,
    createdAt: past(5),
    completedAt: past(5),
  },
  {
    id: 'report_003',
    type: 'USER_PERFORMANCE',
    label: 'User Performance',
    status: 'COMPLETED',
    requestedBy: 'user_admin_cs',
    requesterName: 'Dr. Raj Kumar',
    dateRange: { from: past(30), to: past(0) },
    downloadUrl: '#',
    fileSizeKb: 192,
    createdAt: past(7),
    completedAt: past(7),
  },
  {
    id: 'report_004',
    type: 'OVERDUE_ANALYSIS',
    label: 'Overdue Analysis',
    status: 'FAILED',
    requestedBy: 'user_admin_ece',
    requesterName: 'Dr. Priya Sharma',
    dateRange: { from: past(14), to: past(0) },
    createdAt: past(1),
  },
  {
    id: 'report_005',
    type: 'CROSS_DEPT_ASSIGNMENT',
    label: 'Cross-Dept Assignments',
    status: 'PROCESSING',
    requestedBy: 'user_sa',
    requesterName: 'Dr. Ramesh Iyer',
    dateRange: { from: past(90), to: past(0) },
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
];

export const REPORT_TYPES = [
  {
    type: 'TASK_SUMMARY',
    label: 'Task Summary',
    description: 'Overview of all tasks by status, priority, and department',
    icon: 'bar-chart',
  },
  {
    type: 'USER_PERFORMANCE',
    label: 'User Performance',
    description: 'Individual completion rates, on-time delivery, and workload per employee',
    icon: 'user',
  },
  {
    type: 'DEPARTMENT_COMPARISON',
    label: 'Department Comparison',
    description: 'Cross-department completion rates, overdue counts, and trend comparison',
    icon: 'building',
  },
  {
    type: 'OVERDUE_ANALYSIS',
    label: 'Overdue Analysis',
    description: 'Breakdown of overdue tasks by age, department, and assignee',
    icon: 'alert-triangle',
  },
  {
    type: 'TASK_AUDIT',
    label: 'Task Audit Report',
    description: 'Full activity trail for all tasks in the selected date range',
    icon: 'shield',
  },
  {
    type: 'CROSS_DEPT_ASSIGNMENT',
    label: 'Cross-Dept Assignments',
    description: 'Tasks assigned across departments — tracks completion vs own-dept rate',
    icon: 'arrows-left-right',
  },
] as const;
