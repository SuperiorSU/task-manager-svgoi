/**
 * Super Admin Calendar — mock data (HTML screens 64-66).
 *
 * FR-72: department deadlines are authored, aggregate-only counts (no
 * per-task rows back them — same rationale as MOCK_DEPT_TASK_HEALTH in
 * superAdminTasks.mock.ts, since no org-wide daily-deadline source exists).
 * The SA's own governance tasks are NOT re-authored here — the service pulls
 * MOCK_GOVERNANCE_TASKS directly from superAdminTasks.mock.ts so the
 * calendar and the Tasks (Oversight) module never disagree about the same
 * tasks (see that module's single-source-of-truth gotcha).
 */

import dayjs from 'dayjs';

import { MOCK_DEPARTMENTS } from './tasks.mock';
import { MOCK_DEPT_TASK_HEALTH } from './superAdminTasks.mock';

export const USE_MOCK = true;

// ─── Types ────────────────────────────────────────────────────────────────────

export type SuperAdminCalendarDept = {
  id: string;
  name: string;
  /** Accent color for dots/chips/rollups — org-unit identity, not urgency. */
  color: string;
  adminName: string;
  adminInitials: string;
};

export type DeptDeadlineDay = {
  departmentId: string;
  /** YYYY-MM-DD */
  date: string;
  count: number;
};

// ─── Department accents ─────────────────────────────────────────────────────
// Distinct hues per real department, matching the HTML reference's dept-dot
// palette (kept separate from Colors.priority — these identify org units).

const DEPT_COLORS: Record<string, string> = {
  dept_01: '#1D4ED8', // Physics
  dept_02: '#0D9488', // IT Department
  dept_03: '#B45309', // Admin Office
  dept_04: '#7C3AED', // Academic Office
  dept_05: '#EF4444', // CS & Electronics
};

export const MOCK_SA_CALENDAR_DEPARTMENTS: SuperAdminCalendarDept[] = MOCK_DEPARTMENTS.map((dept) => {
  const health = MOCK_DEPT_TASK_HEALTH.find((h) => h.departmentId === dept.id);
  return {
    id: dept.id,
    name: dept.name,
    color: DEPT_COLORS[dept.id] ?? '#64748B',
    adminName: health?.adminName ?? '—',
    adminInitials: health?.adminInitials ?? '—',
  };
});

// ─── Deadline distribution (authored aggregate-only) ──────────────────────
// Anchored to "today" (like adminCalendar.mock.ts's rel()/past() helpers) so
// the demo always has a populated current day regardless of when it's run.

const today = dayjs();
const d = (offset: number) => today.add(offset, 'day').format('YYYY-MM-DD');

export const MOCK_DEPT_DEADLINES: DeptDeadlineDay[] = [
  // today — showcase day (mirrors the HTML's "12 deadlines" focus day)
  { departmentId: 'dept_01', date: d(0), count: 5 },
  { departmentId: 'dept_02', date: d(0), count: 3 },
  { departmentId: 'dept_05', date: d(0), count: 2 },
  { departmentId: 'dept_03', date: d(0), count: 2 },

  { departmentId: 'dept_04', date: d(-4), count: 2 },
  { departmentId: 'dept_01', date: d(-2), count: 1 },
  { departmentId: 'dept_02', date: d(-1), count: 1 },
  { departmentId: 'dept_05', date: d(1), count: 3 },
  { departmentId: 'dept_03', date: d(2), count: 4 },
  { departmentId: 'dept_01', date: d(3), count: 2 },
  { departmentId: 'dept_04', date: d(3), count: 1 },
  { departmentId: 'dept_02', date: d(5), count: 2 },
  { departmentId: 'dept_05', date: d(6), count: 1 },
  { departmentId: 'dept_01', date: d(8), count: 3 },
  { departmentId: 'dept_03', date: d(9), count: 2 },
  { departmentId: 'dept_04', date: d(11), count: 1 },
  { departmentId: 'dept_02', date: d(13), count: 2 },
  { departmentId: 'dept_05', date: d(15), count: 1 },
  { departmentId: 'dept_01', date: d(18), count: 1 },
  { departmentId: 'dept_03', date: d(21), count: 2 },
];
