import dayjs from 'dayjs';

import type { TaskPriority, TaskStatus } from '@godigitify/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  department: string;
  /** ISO datetime string — includes time for week/day view placement */
  dueDate: string;
  progress: number; // 0-100
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const today = dayjs();

/** Build a due-date ISO string relative to today */
const rel = (dayOffset: number, hour = 17, minute = 0) =>
  today.add(dayOffset, 'day').hour(hour).minute(minute).second(0).millisecond(0).toISOString();

/** Back-fill dates (already past) */
const past = (dayOffset: number, hour = 14, minute = 0) =>
  today.subtract(dayOffset, 'day').hour(hour).minute(minute).second(0).millisecond(0).toISOString();

// ─── Mock Tasks ───────────────────────────────────────────────────────────────
// Spread across current month + next few days for realistic calendar density.
// dayOffset 0 = today, positive = future, negative subtracted

export const CALENDAR_TASKS: CalendarTask[] = [
  // ── Today ──────────────────────────────────────────────────────────────────
  {
    id: 'task_001',
    title: 'Emergency Exit Safety Audit',
    status: 'IN_PROGRESS',
    priority: 'CRITICAL',
    department: 'Admin Office',
    dueDate: rel(0, 10, 0),
    progress: 35,
  },
  {
    id: 'task_002',
    title: 'Staff Daily Attendance Report',
    status: 'ACCEPTED',
    priority: 'MEDIUM',
    department: 'Physics',
    dueDate: rel(0, 14, 30),
    progress: 0,
  },
  {
    id: 'task_003',
    title: 'Server Backup Verification',
    status: 'PENDING',
    priority: 'HIGH',
    department: 'IT Department',
    dueDate: rel(0, 17, 0),
    progress: 0,
  },

  // ── Tomorrow ────────────────────────────────────────────────────────────────
  {
    id: 'task_004',
    title: 'Fix Lab Equipment Schedule',
    status: 'IN_PROGRESS',
    priority: 'CRITICAL',
    department: 'Physics',
    dueDate: rel(1, 17, 0),
    progress: 60,
  },
  {
    id: 'task_005',
    title: 'Faculty Meeting Notes',
    status: 'PENDING',
    priority: 'LOW',
    department: 'Academic Office',
    dueDate: rel(1, 11, 0),
    progress: 0,
  },

  // ── Day after tomorrow ──────────────────────────────────────────────────────
  {
    id: 'task_006',
    title: 'Lab Safety Report Submission',
    status: 'ACCEPTED',
    priority: 'MEDIUM',
    department: 'Physics',
    dueDate: rel(2, 15, 0),
    progress: 0,
  },
  {
    id: 'task_007',
    title: 'Network Switch Firmware Update',
    status: 'PENDING',
    priority: 'HIGH',
    department: 'IT Department',
    dueDate: rel(2, 9, 0),
    progress: 0,
  },

  // ── In 3 days ───────────────────────────────────────────────────────────────
  {
    id: 'task_008',
    title: 'Student Exam Timetable Prep',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    department: 'Academic Office',
    dueDate: rel(3, 16, 0),
    progress: 45,
  },

  // ── In 4 days ───────────────────────────────────────────────────────────────
  {
    id: 'task_009',
    title: 'Quarterly Budget Review',
    status: 'PENDING',
    priority: 'CRITICAL',
    department: 'Admin Office',
    dueDate: rel(4, 11, 30),
    progress: 0,
  },
  {
    id: 'task_010',
    title: 'Library Book Procurement',
    status: 'COMPLETED',
    priority: 'LOW',
    department: 'Academic Office',
    dueDate: rel(4, 14, 0),
    progress: 100,
  },

  // ── In 5 days ───────────────────────────────────────────────────────────────
  {
    id: 'task_011',
    title: 'Server Room Access Audit',
    status: 'PENDING',
    priority: 'LOW',
    department: 'IT Department',
    dueDate: rel(5, 13, 0),
    progress: 0,
  },

  // ── In 6 days ───────────────────────────────────────────────────────────────
  {
    id: 'task_012',
    title: 'Annual Performance Report',
    status: 'PENDING',
    priority: 'HIGH',
    department: 'Physics',
    dueDate: rel(6, 17, 30),
    progress: 0,
  },
  {
    id: 'task_001',
    title: 'Staff Training Programme',
    status: 'ACCEPTED',
    priority: 'MEDIUM',
    department: 'Physics',
    dueDate: rel(6, 10, 0),
    progress: 0,
  },

  // ── In 7 days ───────────────────────────────────────────────────────────────
  {
    id: 'task_002',
    title: 'Physics Lab Inventory Count',
    status: 'PENDING',
    priority: 'CRITICAL',
    department: 'Physics',
    dueDate: rel(7, 9, 0),
    progress: 0,
  },

  // ── In 10 days ──────────────────────────────────────────────────────────────
  {
    id: 'task_003',
    title: 'Student Feedback Survey',
    status: 'PENDING',
    priority: 'MEDIUM',
    department: 'Academic Office',
    dueDate: rel(10, 12, 0),
    progress: 0,
  },
  {
    id: 'task_004',
    title: 'Wireless Infrastructure Review',
    status: 'PENDING',
    priority: 'HIGH',
    department: 'IT Department',
    dueDate: rel(10, 15, 30),
    progress: 0,
  },

  // ── In 14 days ──────────────────────────────────────────────────────────────
  {
    id: 'task_005',
    title: 'Departmental Budget Q3',
    status: 'PENDING',
    priority: 'CRITICAL',
    department: 'Admin Office',
    dueDate: rel(14, 11, 0),
    progress: 0,
  },

  // ── Past (overdue) ──────────────────────────────────────────────────────────
  {
    id: 'task_006',
    title: 'Budget Proposal Submission',
    status: 'PENDING',
    priority: 'CRITICAL',
    department: 'Admin Office',
    dueDate: past(2, 18, 0),
    progress: 0,
  },
  {
    id: 'task_007',
    title: 'Network Audit Sign-Off',
    status: 'UNDER_REVIEW',
    priority: 'HIGH',
    department: 'IT Department',
    dueDate: past(1, 14, 0),
    progress: 90,
  },
  {
    id: 'task_008',
    title: 'Calibrate Spectrometer Readings',
    status: 'PENDING',
    priority: 'HIGH',
    department: 'Physics',
    dueDate: past(3, 10, 0),
    progress: 0,
  },
  {
    id: 'task_009',
    title: 'Fire Safety Equipment Check',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    department: 'Admin Office',
    dueDate: past(1, 16, 0),
    progress: 55,
  },
];

// ─── Derived helpers ──────────────────────────────────────────────────────────

/** Group tasks by YYYY-MM-DD key */
export const buildTaskMap = (): Map<string, CalendarTask[]> => {
  const map = new Map<string, CalendarTask[]>();
  for (const task of CALENDAR_TASKS) {
    const key = dayjs(task.dueDate).format('YYYY-MM-DD');
    const existing = map.get(key) ?? [];
    map.set(key, [...existing, task]);
  }
  return map;
};

/** Highest-priority color for a day (for dot display) */
export const PRIORITY_ORDER: TaskPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export const isTaskOverdue = (task: CalendarTask): boolean =>
  !['COMPLETED', 'CANCELLED'].includes(task.status) &&
  dayjs(task.dueDate).isBefore(dayjs());
