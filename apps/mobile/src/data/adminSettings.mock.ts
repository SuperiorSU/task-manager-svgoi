// ─── Admin Settings Mock Data ─────────────────────────────────────────────────
// Approval preferences + department settings shown from Profile → Management
// (screens 46-47 of the HTML reference). Swap USE_MOCK = false and point
// adminSettingsService methods to real API calls when the backend is ready.

export const USE_MOCK = true;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApproverScope = 'ADMIN_ONLY' | 'ADMIN_AND_SENIOR';
export type RejectionRequirement = 'RESUBMIT_PROOF' | 'COMMENT_ONLY';

export type ApprovalPreferences = {
  requireProofOfWork: boolean;
  autoApproveLowPriority: boolean;
  onRejection: RejectionRequirement;
  approverScope: ApproverScope;
  reviewWithinHours: number;
  escalateOverdueReviews: boolean;
};

export type TaskPriorityKey = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type DepartmentSettings = {
  departmentName: string;
  departmentCode: string;
  workingDays: string;
  workingHours: string;
  weeklyHoliday: string;
  defaultPriority: TaskPriorityKey;
  defaultDueWindowDays: number;
  membersSeeOnlyOwnTasks: boolean;
  taskCategories: string[];
};

// ─── Picker option presets ────────────────────────────────────────────────────

export const ON_REJECTION_OPTIONS: { value: RejectionRequirement; label: string }[] = [
  { value: 'RESUBMIT_PROOF', label: 'Re-submit proof' },
  { value: 'COMMENT_ONLY', label: 'Comment only' },
];

export const REVIEW_WITHIN_OPTIONS: { value: number; label: string }[] = [
  { value: 4, label: '4 hours' },
  { value: 12, label: '12 hours' },
  { value: 24, label: '24 hours' },
  { value: 48, label: '48 hours' },
];

export const WORKING_DAYS_OPTIONS: { value: string; label: string }[] = [
  { value: 'MON_SAT', label: 'Mon – Sat' },
  { value: 'MON_FRI', label: 'Mon – Fri' },
  { value: 'ALL_DAYS', label: 'All days' },
];

export const WORKING_HOURS_OPTIONS: { value: string; label: string }[] = [
  { value: '9_5', label: '9:00 AM – 5:00 PM' },
  { value: '8_4', label: '8:00 AM – 4:00 PM' },
  { value: '10_6', label: '10:00 AM – 6:00 PM' },
];

export const WEEKLY_HOLIDAY_OPTIONS: { value: string; label: string }[] = [
  { value: 'SUNDAY', label: 'Sunday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'NONE', label: 'None' },
];

export const DUE_WINDOW_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '1 day' },
  { value: 2, label: '2 days' },
  { value: 3, label: '3 days' },
  { value: 7, label: '7 days' },
];

export const DEFAULT_PRIORITY_OPTIONS: { value: TaskPriorityKey; label: string }[] = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

// ─── Mock data (Physics dept — Admin scope) ───────────────────────────────────

export const MOCK_APPROVAL_PREFERENCES: ApprovalPreferences = {
  requireProofOfWork: true,
  autoApproveLowPriority: false,
  onRejection: 'RESUBMIT_PROOF',
  approverScope: 'ADMIN_ONLY',
  reviewWithinHours: 24,
  escalateOverdueReviews: true,
};

export const MOCK_DEPARTMENT_SETTINGS: DepartmentSettings = {
  departmentName: 'Physics',
  departmentCode: 'PHY',
  workingDays: 'MON_SAT',
  workingHours: '9_5',
  weeklyHoliday: 'SUNDAY',
  defaultPriority: 'MEDIUM',
  defaultDueWindowDays: 3,
  membersSeeOnlyOwnTasks: true,
  taskCategories: ['Lab', 'Safety', 'Admin', 'Events'],
};
