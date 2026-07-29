// ─── Organization Configuration — screen view-model + picker vocabulary ───────
// Reached from Super Admin Profile → System & security → "Organization
// configuration". The screen is wired to the real API (GET/PATCH
// /organization/config) via orgConfig.service.ts, which adapts between this
// compact UI vocabulary and the server's normalized shape. This file no longer
// holds any mock data — only the view-model type and the shared picker options.

import { WORKING_DAYS_OPTIONS, WORKING_HOURS_OPTIONS, WEEKLY_HOLIDAY_OPTIONS } from './adminSettings.mock';

// ─── View-model type ──────────────────────────────────────────────────────────

export type OrgConfig = {
  orgName: string;
  allowCrossDeptEmployeeAssignment: boolean; // 8_overview.md §2: "configurable org setting, default ON"
  workingDays: string; // one of WORKING_DAYS_OPTIONS values: 'MON_SAT' | 'MON_FRI' | 'ALL_DAYS'
  workingHours: string; // WORKING_HOURS_OPTIONS: '9_5' | '8_4' | '10_6'
  weeklyHoliday: string; // WEEKLY_HOLIDAY_OPTIONS: 'SUNDAY' | 'SATURDAY' | 'NONE'
  defaultTaskCategories: string[];
};

// Re-exported so the Org Configuration screen has one import source for its
// pickers, matching Admin's Department Settings screen's own import shape.
export { WORKING_DAYS_OPTIONS, WORKING_HOURS_OPTIONS, WEEKLY_HOLIDAY_OPTIONS };
