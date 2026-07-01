// ─── Profile Mock Data ────────────────────────────────────────────────────────
// Swap USE_MOCK = false and point fetchProfile / fetchNotificationPrefs to real
// API calls when the backend is ready. No other file changes required.

export const USE_MOCK = true;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfileStats = {
  onTimeRate: number;   // percentage, e.g. 94
  completed: number;    // total tasks completed
  active: number;       // currently active tasks
};

export type ProfileUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  employeeId: string;
  designation: string;
  department: string;
  role: string;
  reportingManager: string;
  avatarUrl?: string;
};

export type DeliveryMethod = {
  id: string;
  key: 'inApp' | 'email' | 'push';
  label: string;
  enabled: boolean;
};

export type NotificationType = {
  id: string;
  key: string;
  label: string;
  enabled: boolean;
};

export type NotificationPreferences = {
  delivery: DeliveryMethod[];
  types: NotificationType[];
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
};

// ─── Mock profile ─────────────────────────────────────────────────────────────

export const MOCK_PROFILE_USER: ProfileUser = {
  id: 'usr_001',
  name: 'Rajan Sharma',
  email: 'rajan.sharma@svgoi.edu.in',
  phone: '+91 98765 43210',
  employeeId: 'EMP-2024-0047',
  designation: 'Lab Technician',
  department: 'Physics',
  role: 'Employee',
  reportingManager: 'Dr. Priya Nair',
};

export const MOCK_PROFILE_STATS: ProfileStats = {
  onTimeRate: 94,
  completed: 128,
  active: 12,
};

// ─── Admin mock profile ───────────────────────────────────────────────────────

export const MOCK_ADMIN_PROFILE_USER: ProfileUser = {
  id: 'usr_admin_001',
  name: 'Dr. Priya Nair',
  email: 'priya.nair@svgoi.edu.in',
  phone: '+91 98765 11111',
  employeeId: 'EMP-2019-0003',
  designation: 'Head of Department',
  department: 'Physics',
  role: 'Admin',
  reportingManager: 'Dr. R. K. Sharma, Principal',
};

export const MOCK_ADMIN_PROFILE_STATS: ProfileStats = {
  onTimeRate: 97,
  completed: 56,
  active: 8,
};

// ─── Mock notification preferences ───────────────────────────────────────────

export const MOCK_NOTIFICATION_PREFS: NotificationPreferences = {
  delivery: [
    { id: 'del_1', key: 'inApp', label: 'In-app', enabled: true },
    { id: 'del_2', key: 'email', label: 'Email', enabled: true },
    { id: 'del_3', key: 'push', label: 'Push', enabled: false },
  ],
  types: [
    { id: 'typ_1', key: 'task_assignments', label: 'Task assignments', enabled: true },
    { id: 'typ_2', key: 'due_reminders', label: 'Due date reminders', enabled: true },
    { id: 'typ_3', key: 'overdue_alerts', label: 'Overdue alerts', enabled: true },
    { id: 'typ_4', key: 'comments', label: 'Comments & @mentions', enabled: true },
    { id: 'typ_5', key: 'completions', label: 'Completion & approvals', enabled: false },
  ],
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};
