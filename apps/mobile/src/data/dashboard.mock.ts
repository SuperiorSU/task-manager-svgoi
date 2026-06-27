import dayjs from 'dayjs';

import type { TaskPriority, TaskStatus } from '@godigitify/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DashboardStats = {
  myTasks: number;
  dueToday: number;
  completed: number;
  overdue: number;
};

export type UpcomingTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  department: string;
};

export type ActivityType =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'STATUS_CHANGED'
  | 'COMMENT_ADDED'
  | 'COMPLETED'
  | 'SUBMITTED'
  | 'REASSIGNED';

export type ActivityItem = {
  id: string;
  type: ActivityType;
  description: string;
  taskTitle: string;
  taskId: string;
  actorName: string;
  actorInitials: string;
  isMe: boolean;
  createdAt: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const now = dayjs();

export const MOCK_STATS: DashboardStats = {
  myTasks: 14,
  dueToday: 3,
  completed: 8,
  overdue: 2,
};

// Tasks due in the next 7 days (sorted by due date ascending)
export const MOCK_UPCOMING_TASKS: UpcomingTask[] = [
  {
    id: 'task_001',
    title: 'Fix Lab Equipment Schedule for Physics Semester',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: now.add(1, 'day').hour(17).minute(0).second(0).toISOString(),
    department: 'Physics Dept',
  },
  {
    id: 'task_002',
    title: 'Submit Department Budget Proposal Q3 2026',
    status: 'PENDING',
    priority: 'CRITICAL',
    dueDate: now.add(2, 'day').hour(12).minute(0).second(0).toISOString(),
    department: 'Admin Office',
  },
  {
    id: 'task_003',
    title: 'Prepare Lab Safety Compliance Report',
    status: 'ACCEPTED',
    priority: 'MEDIUM',
    dueDate: now.add(3, 'day').hour(14).minute(30).second(0).toISOString(),
    department: 'Physics Dept',
  },
  {
    id: 'task_004',
    title: 'Coordinate with IT for Server Room Access Renewal',
    status: 'PENDING',
    priority: 'LOW',
    dueDate: now.add(5, 'day').hour(10).minute(0).second(0).toISOString(),
    department: 'IT Department',
  },
  {
    id: 'task_005',
    title: 'Review Examination Timetable for July 2026 Batch',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: now.add(6, 'day').hour(16).minute(0).second(0).toISOString(),
    department: 'Academic Office',
  },
];

// Last 5 activity events across all my tasks
export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 'act_001',
    type: 'ACCEPTED',
    description: 'accepted the task',
    taskTitle: 'Fix Lab Equipment Schedule',
    taskId: 'task_001',
    actorName: 'You',
    actorInitials: 'RS',
    isMe: true,
    createdAt: now.subtract(1, 'hour').toISOString(),
  },
  {
    id: 'act_002',
    type: 'COMMENT_ADDED',
    description: 'commented on',
    taskTitle: 'Budget Proposal Q3 2026',
    taskId: 'task_002',
    actorName: 'Dr. A. Kumar',
    actorInitials: 'AK',
    isMe: false,
    createdAt: now.subtract(3, 'hour').toISOString(),
  },
  {
    id: 'act_003',
    type: 'ASSIGNED',
    description: 'assigned you to',
    taskTitle: 'Lab Safety Compliance Report',
    taskId: 'task_003',
    actorName: 'Dr. A. Kumar',
    actorInitials: 'AK',
    isMe: false,
    createdAt: now.subtract(5, 'hour').toISOString(),
  },
  {
    id: 'act_004',
    type: 'STATUS_CHANGED',
    description: 'marked as In Progress',
    taskTitle: 'Server Room Access Renewal',
    taskId: 'task_004',
    actorName: 'You',
    actorInitials: 'RS',
    isMe: true,
    createdAt: now.subtract(1, 'day').toISOString(),
  },
  {
    id: 'act_005',
    type: 'COMPLETED',
    description: 'completed',
    taskTitle: 'Student Attendance Report — May 2026',
    taskId: 'task_006',
    actorName: 'You',
    actorInitials: 'RS',
    isMe: true,
    createdAt: now.subtract(2, 'day').toISOString(),
  },
];

// Mock unread notification count
export const MOCK_UNREAD_COUNT = 4;
