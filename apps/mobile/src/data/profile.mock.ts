// ─── Profile Mock Data ────────────────────────────────────────────────────────
// Swap USE_MOCK = false and point fetchProfile / fetchNotificationPrefs to real
// API calls when the backend is ready. No other file changes required.

import { MOCK_AUDIT_SELF } from './audit.mock';

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
  reportingManager?: string;
  reportingManagerRole?: string;
  avatarUrl?: string;
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
  reportingManager: 'Dr. R. K. Sharma',
  reportingManagerRole: 'Super Admin',
};

export const MOCK_ADMIN_PROFILE_STATS: ProfileStats = {
  onTimeRate: 97,
  completed: 56,
  active: 8,
};

// ─── Super Admin mock profile ─────────────────────────────────────────────────
// Identity reuses MOCK_AUDIT_SELF (audit.mock.ts) — the "S. Verma" account is
// already the single source of truth for the current Super Admin's name/id
// across the Audit and Tasks Oversight modules; not re-authored here.

export const MOCK_SA_PROFILE_USER: ProfileUser = {
  id: MOCK_AUDIT_SELF.id,
  name: MOCK_AUDIT_SELF.name,
  email: 's.verma@svgoi.edu',
  phone: '+91 98220 10001',
  employeeId: MOCK_AUDIT_SELF.employeeId ?? '',
  designation: 'Super Administrator',
  department: 'SVGOI',
  role: 'Super Admin',
};
