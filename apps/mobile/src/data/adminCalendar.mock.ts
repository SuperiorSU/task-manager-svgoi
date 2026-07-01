import dayjs from 'dayjs';

import type { TaskPriority, TaskStatus } from '@godigitify/types';

// ─── Domain types ─────────────────────────────────────────────────────────────

export type AdminCalendarAssignee = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
};

export type AdminCalendarTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** ISO datetime string — includes time for placement */
  dueDate: string;
  assignee: AdminCalendarAssignee;
};

// ─── Physics dept team ────────────────────────────────────────────────────────
// IDs and colors match MOCK_TEAM_MEMBERS in team.mock.ts for consistency.

export const ADMIN_CALENDAR_MEMBERS: AdminCalendarAssignee[] = [
  { id: 'mbr_01', name: 'Rajan Sharma', initials: 'RS', avatarColor: '#1A5CF8' },
  { id: 'mbr_02', name: 'Anita Patel',  initials: 'AP', avatarColor: '#0D9488' },
  { id: 'mbr_03', name: 'Deepa Singh',  initials: 'DS', avatarColor: '#7C3AED' },
  { id: 'mbr_04', name: 'Karan Mehta',  initials: 'KM', avatarColor: '#F59E0B' },
  { id: 'mbr_05', name: 'Priya Roy',    initials: 'PR', avatarColor: '#EF4444' },
];

// ─── Task helpers ─────────────────────────────────────────────────────────────

const today = dayjs();
const rel  = (d: number, h = 17, m = 0) =>
  today.add(d, 'day').hour(h).minute(m).second(0).millisecond(0).toISOString();
const past = (d: number, h = 14, m = 0) =>
  today.subtract(d, 'day').hour(h).minute(m).second(0).millisecond(0).toISOString();

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const R = ADMIN_CALENDAR_MEMBERS[0]!;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const A = ADMIN_CALENDAR_MEMBERS[1]!;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const D = ADMIN_CALENDAR_MEMBERS[2]!;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const K = ADMIN_CALENDAR_MEMBERS[3]!;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const P = ADMIN_CALENDAR_MEMBERS[4]!;

// ─── Mock tasks ───────────────────────────────────────────────────────────────

export const ADMIN_CALENDAR_TASKS: AdminCalendarTask[] = [
  // ── Today ──────────────────────────────────────────────────────────────────
  { id: 'act_001', title: 'Recalibrate spectrometer',     status: 'IN_PROGRESS', priority: 'MEDIUM',   dueDate: rel(0, 17, 0),  assignee: R },
  { id: 'act_002', title: 'Update safety signage',        status: 'ACCEPTED',    priority: 'LOW',      dueDate: rel(0, 18, 0),  assignee: A },
  { id: 'act_003', title: 'Lab access log review',        status: 'PENDING',     priority: 'HIGH',     dueDate: rel(0, 15, 0),  assignee: D },

  // ── Tomorrow ────────────────────────────────────────────────────────────────
  { id: 'act_004', title: 'Physics Lab Inventory Count',  status: 'PENDING',     priority: 'CRITICAL', dueDate: rel(1,  9, 0),  assignee: D },
  { id: 'act_005', title: 'Submit Q3 Lab Budget',         status: 'PENDING',     priority: 'HIGH',     dueDate: rel(1, 18, 30), assignee: R },

  // ── +2 days ─────────────────────────────────────────────────────────────────
  { id: 'act_006', title: 'Fire Safety Equipment Check',  status: 'IN_PROGRESS', priority: 'MEDIUM',   dueDate: rel(2, 14, 0),  assignee: K },
  { id: 'act_007', title: 'Optical bench alignment',      status: 'PENDING',     priority: 'LOW',      dueDate: rel(2, 11, 0),  assignee: P },

  // ── +3 days ─────────────────────────────────────────────────────────────────
  { id: 'act_008', title: 'Lab Safety Report Submission', status: 'ACCEPTED',    priority: 'HIGH',     dueDate: rel(3, 15, 0),  assignee: A },
  { id: 'act_009', title: 'Calibrate Thermal Sensors',    status: 'PENDING',     priority: 'MEDIUM',   dueDate: rel(3, 10, 0),  assignee: D },

  // ── +5 days ─────────────────────────────────────────────────────────────────
  { id: 'act_010', title: 'Annual Performance Report',    status: 'PENDING',     priority: 'HIGH',     dueDate: rel(5, 17, 30), assignee: P },
  { id: 'act_011', title: 'Student Lab Orientation',      status: 'PENDING',     priority: 'LOW',      dueDate: rel(5, 11, 0),  assignee: R },

  // ── +7 days ─────────────────────────────────────────────────────────────────
  { id: 'act_012', title: 'Equipment Maintenance Log',    status: 'PENDING',     priority: 'MEDIUM',   dueDate: rel(7, 15, 0),  assignee: K },
  { id: 'act_013', title: 'Semester Lab Schedule',        status: 'PENDING',     priority: 'CRITICAL', dueDate: rel(7, 13, 0),  assignee: D },

  // ── +10 days ────────────────────────────────────────────────────────────────
  { id: 'act_014', title: 'Quarterly Budget Review',      status: 'PENDING',     priority: 'CRITICAL', dueDate: rel(10, 11, 30),assignee: D },
  { id: 'act_015', title: 'Cross-dept lab coordination',  status: 'PENDING',     priority: 'MEDIUM',   dueDate: rel(10, 14, 0), assignee: A },

  // ── +14 days ────────────────────────────────────────────────────────────────
  { id: 'act_016', title: 'Departmental Staff Meeting',   status: 'PENDING',     priority: 'HIGH',     dueDate: rel(14, 14, 0), assignee: A },
  { id: 'act_017', title: 'Lab Renovation Planning',      status: 'PENDING',     priority: 'LOW',      dueDate: rel(14, 16, 0), assignee: P },

  // ── +20 days ────────────────────────────────────────────────────────────────
  { id: 'act_018', title: 'Year-end Report Submission',   status: 'PENDING',     priority: 'CRITICAL', dueDate: rel(20, 17, 0), assignee: R },
  { id: 'act_019', title: 'Physics Dept Audit',           status: 'PENDING',     priority: 'HIGH',     dueDate: rel(20, 10, 0), assignee: K },

  // ── Past (overdue) ──────────────────────────────────────────────────────────
  { id: 'act_020', title: 'Budget Proposal Submission',   status: 'PENDING',     priority: 'CRITICAL', dueDate: past(2, 18, 0), assignee: R },
  { id: 'act_021', title: 'Calibrate Spectrometer',       status: 'PENDING',     priority: 'HIGH',     dueDate: past(3, 10, 0), assignee: D },
  { id: 'act_022', title: 'Monthly Lab Log Sign-off',     status: 'PENDING',     priority: 'MEDIUM',   dueDate: past(1, 16, 0), assignee: A },
];

// ─── Map builder ──────────────────────────────────────────────────────────────

/** Group tasks by YYYY-MM-DD, optionally scoped to one team member */
export const buildAdminTaskMap = (
  tasks: AdminCalendarTask[],
  memberId?: string,
): Map<string, AdminCalendarTask[]> => {
  const filtered = memberId ? tasks.filter((t) => t.assignee.id === memberId) : tasks;
  const map = new Map<string, AdminCalendarTask[]>();
  for (const task of filtered) {
    const key = dayjs(task.dueDate).format('YYYY-MM-DD');
    map.set(key, [...(map.get(key) ?? []), task]);
  }
  return map;
};
