// ─── Organization Configuration — Mock Data ───────────────────────────────────
// Reached from Super Admin Profile → System & security → "Organization
// configuration" (screen 71 of the HTML reference has no dedicated mockup for
// this destination — the row is present but unlinked, unlike "Audit log"
// which points to #50a). Content is grounded directly in 8_overview.md §2's
// explicit "configurable per org" call-outs (cross-dept employee assignment)
// rather than invented settings, plus the org-wide analog of Admin's
// per-department "Task defaults"/"Task categories" (adminSettings.mock.ts).
//
// Swap USE_MOCK = false and point orgConfig.service.ts methods to a real
// PATCH /organization/config endpoint when the backend is ready.

import { WORKING_DAYS_OPTIONS, WORKING_HOURS_OPTIONS, WEEKLY_HOLIDAY_OPTIONS } from './adminSettings.mock';

export const USE_MOCK = true;

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrgConfig = {
  orgName: string;
  allowCrossDeptEmployeeAssignment: boolean; // 8_overview.md §2: "configurable org setting, default ON"
  workingDays: string;
  workingHours: string;
  weeklyHoliday: string;
  defaultTaskCategories: string[];
};

// Re-exported so the Org Configuration screen has one import source for its
// pickers, matching Admin's Department Settings screen's own import shape.
export { WORKING_DAYS_OPTIONS, WORKING_HOURS_OPTIONS, WEEKLY_HOLIDAY_OPTIONS };

// ─── Mock data ─────────────────────────────────────────────────────────────────

export const MOCK_ORG_CONFIG: OrgConfig = {
  orgName: 'SVGOI',
  allowCrossDeptEmployeeAssignment: true,
  workingDays: 'MON_SAT',
  workingHours: '9_5',
  weeklyHoliday: 'SUNDAY',
  defaultTaskCategories: ['Lab', 'Safety', 'Admin', 'Events', 'Maintenance'],
};
