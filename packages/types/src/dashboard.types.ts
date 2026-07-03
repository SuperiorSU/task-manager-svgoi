export type DeptStatusDistribution = {
  pending: number;
  inProgress: number;
  review: number;
  overdue: number;
  blocked: number;
};

export type DeptHealth = {
  departmentId: string;
  departmentName: string;
  adminId?: string | null;
  adminName?: string | null;
  staffCount: number;
  activeCount: number;
  overdueCount: number;
  onTimeRate: number;
  riskLevel: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
  statusDistribution: DeptStatusDistribution;
};

export type StaffLoad = {
  userId: string;
  name: string;
  departmentId?: string | null;
  designation?: string | null;
  activeCount: number;
  overdueCount: number;
  avgCycleDays: number;
  capacityTarget: number;
  capacityPercent: number;
};

export type EscalationType = 'OVERDUE_CLUSTER' | 'REVIEW_STALLED' | 'PENDING_ACCEPT_STALLED';

export type Escalation = {
  id: string;
  type: EscalationType;
  departmentId: string;
  departmentName: string;
  ownerId?: string | null;
  ownerActioned: boolean;
  detectedAt: string;
  count: number;
};

export type CalendarDeadlineDay = {
  departmentId: string;
  date: string;
  count: number;
};
