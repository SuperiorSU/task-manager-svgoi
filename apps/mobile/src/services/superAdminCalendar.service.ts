/**
 * Super Admin Calendar Service — org-wide deadline oversight.
 *
 * Mock implementation. Two data sources merge into one day-keyed entry map,
 * matching FR-72: department deadlines are aggregate counts (authored, no
 * per-task rows — see superAdminCalendar.mock.ts); the SA's own governance
 * tasks (MOCK_GOVERNANCE_TASKS, shared with the Tasks (Oversight) module —
 * single source of truth) appear in full. Replace method bodies with real
 * API calls (GET /calendar/departments, GET /calendar/entries?departmentId=)
 * when the backend is ready. Signatures are stable: UI never imports MOCK_*
 * directly.
 */

import dayjs from 'dayjs';

import type { MockTask } from '../data/tasks.mock';
import {
  MOCK_DEPT_TASK_HEALTH,
  MOCK_GOVERNANCE_TASKS,
  type DeptTaskHealth,
} from '../data/superAdminTasks.mock';
import {
  MOCK_SA_CALENDAR_DEPARTMENTS,
  MOCK_DEPT_DEADLINES,
  type SuperAdminCalendarDept,
} from '../data/superAdminCalendar.mock';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export type CalendarDayEntry =
  | { kind: 'dept'; departmentId: string; departmentName: string; color: string; count: number }
  | { kind: 'governance'; task: MockTask };

export const superAdminCalendarService = {
  /** Real API: GET /departments?includeAdmin=1 */
  async getDepartments(): Promise<SuperAdminCalendarDept[]> {
    await delay(200);
    return MOCK_SA_CALENDAR_DEPARTMENTS;
  },

  /**
   * Fetch the day-keyed entry map backing the month grid, agenda list, and
   * day breakdown. Pass departmentId to filter to a single department;
   * omit for org-wide. Real API: GET /calendar/entries?departmentId=
   */
  async getEntryMap(departmentId?: string): Promise<Map<string, CalendarDayEntry[]>> {
    await delay(350);

    const deptById = new Map(MOCK_SA_CALENDAR_DEPARTMENTS.map((dept) => [dept.id, dept]));
    const map = new Map<string, CalendarDayEntry[]>();

    for (const entry of MOCK_DEPT_DEADLINES) {
      if (departmentId && entry.departmentId !== departmentId) continue;
      const dept = deptById.get(entry.departmentId);
      if (!dept) continue;
      const list = map.get(entry.date) ?? [];
      list.push({
        kind: 'dept',
        departmentId: dept.id,
        departmentName: dept.name,
        color: dept.color,
        count: entry.count,
      });
      map.set(entry.date, list);
    }

    for (const task of MOCK_GOVERNANCE_TASKS) {
      if (departmentId && task.department.id !== departmentId) continue;
      const key = dayjs(task.dueDate).format('YYYY-MM-DD');
      const list = map.get(key) ?? [];
      list.push({ kind: 'governance', task });
      map.set(key, list);
    }

    return map;
  },

  /** Real API: GET /dashboard/department-health (shared with Tasks Oversight) */
  async getDeptHealth(): Promise<DeptTaskHealth[]> {
    await delay(150);
    return MOCK_DEPT_TASK_HEALTH;
  },
};
