/**
 * Organization Configuration Service — Super Admin org-wide settings.
 *
 * Wired to the real API (`GET/PATCH /organization/config`). This service is an
 * adapter: the Org Configuration screen speaks a compact UI vocabulary
 * (workingDays: 'MON_SAT', workingHours: '9_5', weeklyHoliday: 'SUNDAY'), while
 * the server stores the normalized form (day-number arrays, explicit start/end
 * times, a single holiday day-number). The maps below translate both ways so
 * the screen keeps its picker vocabulary and the server keeps its schema.
 */

import { organizationApi } from '@godigitify/api-client';
import type { UpdateOrganizationConfigDto, OrganizationConfig } from '@godigitify/types';

import type { OrgConfig } from '../data/orgConfig.mock';

// ─── working days ─────────────────────────────────────────────────────────────
// Day numbers follow JS getDay(): 0 = Sunday … 6 = Saturday.
const WORKING_DAYS_TO_ARRAY: Record<string, number[]> = {
  MON_SAT: [1, 2, 3, 4, 5, 6],
  MON_FRI: [1, 2, 3, 4, 5],
  ALL_DAYS: [0, 1, 2, 3, 4, 5, 6],
};
const arrayToWorkingDays = (days: number[] | null | undefined): OrgConfig['workingDays'] => {
  const key = [...(days ?? [])].sort((a, b) => a - b).join(',');
  if (key === '1,2,3,4,5') return 'MON_FRI';
  if (key === '0,1,2,3,4,5,6') return 'ALL_DAYS';
  return 'MON_SAT';
};

// ─── working hours ────────────────────────────────────────────────────────────
const WORKING_HOURS_TO_TIMES: Record<string, { start: string; end: string }> = {
  '9_5': { start: '09:00', end: '17:00' },
  '8_4': { start: '08:00', end: '16:00' },
  '10_6': { start: '10:00', end: '18:00' },
};
const timesToWorkingHours = (start: string | null | undefined): OrgConfig['workingHours'] => {
  if (start?.startsWith('08')) return '8_4';
  if (start?.startsWith('10')) return '10_6';
  return '9_5';
};

// ─── weekly holiday ───────────────────────────────────────────────────────────
// The server has no representation for "no holiday" (weeklyHoliday is 0–6), so
// selecting NONE simply leaves the stored value unchanged (see toDto).
const WEEKLY_HOLIDAY_TO_NUM: Record<string, number> = { SUNDAY: 0, SATURDAY: 6 };
const numToWeeklyHoliday = (n: number | null | undefined): OrgConfig['weeklyHoliday'] =>
  n === 6 ? 'SATURDAY' : 'SUNDAY';

// ─── mappers ──────────────────────────────────────────────────────────────────
const toView = (c: OrganizationConfig): OrgConfig => ({
  orgName: c.orgName,
  allowCrossDeptEmployeeAssignment: c.allowCrossDeptEmployeeAssignment,
  workingDays: arrayToWorkingDays(c.workingDays),
  workingHours: timesToWorkingHours(c.workingHoursStart),
  weeklyHoliday: numToWeeklyHoliday(c.weeklyHoliday),
  defaultTaskCategories: c.taskCategories ?? [],
});

const toDto = (v: Partial<OrgConfig>): UpdateOrganizationConfigDto => {
  const dto: UpdateOrganizationConfigDto = {};
  if (v.orgName !== undefined) dto.orgName = v.orgName;
  if (v.allowCrossDeptEmployeeAssignment !== undefined) {
    dto.allowCrossDeptEmployeeAssignment = v.allowCrossDeptEmployeeAssignment;
  }
  if (v.workingDays !== undefined) {
    dto.workingDays = WORKING_DAYS_TO_ARRAY[v.workingDays] ?? [1, 2, 3, 4, 5, 6];
  }
  if (v.workingHours !== undefined) {
    const t = WORKING_HOURS_TO_TIMES[v.workingHours] ?? WORKING_HOURS_TO_TIMES['9_5']!;
    dto.workingHoursStart = t.start;
    dto.workingHoursEnd = t.end;
  }
  // NONE is intentionally not sent — the server can't store "no holiday".
  if (v.weeklyHoliday !== undefined && v.weeklyHoliday in WEEKLY_HOLIDAY_TO_NUM) {
    dto.weeklyHoliday = WEEKLY_HOLIDAY_TO_NUM[v.weeklyHoliday] ?? 0;
  }
  if (v.defaultTaskCategories !== undefined) dto.taskCategories = v.defaultTaskCategories;
  return dto;
};

export const orgConfigService = {
  async getOrgConfig(): Promise<OrgConfig> {
    const res = await organizationApi.getConfig();
    return toView(res.data);
  },

  async updateOrgConfig(patch: Partial<OrgConfig>): Promise<OrgConfig> {
    const res = await organizationApi.updateConfig(toDto(patch));
    return toView(res.data);
  },
};
