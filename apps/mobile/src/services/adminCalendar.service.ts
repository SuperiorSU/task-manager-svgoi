/**
 * Admin Calendar Service
 *
 * Mock implementation — replace each method body with real API calls.
 * Signatures are stable: UI never imports ADMIN_CALENDAR_TASKS directly.
 */

import {
  ADMIN_CALENDAR_TASKS,
  ADMIN_CALENDAR_MEMBERS,
  buildAdminTaskMap,
  type AdminCalendarTask,
  type AdminCalendarAssignee,
} from '../data/adminCalendar.mock';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const adminCalendarService = {
  /**
   * Fetch task map for the calendar grid.
   * Pass memberId to filter to a single team member; omit for whole-team view.
   * Real API: GET /tasks/calendar?departmentId=&memberId=&month=
   */
  async getTaskMap(memberId?: string): Promise<Map<string, AdminCalendarTask[]>> {
    await delay(350);
    return buildAdminTaskMap(ADMIN_CALENDAR_TASKS, memberId);
  },

  /**
   * Fetch filterable team members (the person-filter chips in the header).
   * Real API: GET /users?departmentId=&role=EMPLOYEE&isActive=true
   */
  async getMembers(): Promise<AdminCalendarAssignee[]> {
    await delay(200);
    return ADMIN_CALENDAR_MEMBERS;
  },
};
