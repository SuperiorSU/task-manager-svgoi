// All times computed relative to now so relative timestamps stay realistic at any render time.

export type MockNotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_DUE_SOON'
  | 'TASK_OVERDUE'
  | 'COMMENT_ADDED'
  | 'MENTION'
  | 'CLARIFICATION_REQUESTED'
  | 'CLARIFICATION_RESPONDED'
  | 'TASK_COMPLETED'
  | 'TASK_REASSIGNED';

export type MockNotification = {
  id: string;
  type: MockNotificationType;
  title: string;     // Bold prefix segment
  body: string;      // Rest of message text
  taskTitle?: string; // Optional highlighted task name (shown in brand.primary)
  taskId?: string;   // Navigation target
  isRead: boolean;
  createdAt: string; // ISO string
};

function minsAgo(n: number) {
  return new Date(Date.now() - n * 60 * 1000).toISOString();
}
function hoursAgo(n: number) {
  return new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
}
function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  // ── Today ──────────────────────────────────────────────────────────
  {
    id: 'notif-001',
    type: 'TASK_OVERDUE',
    title: 'Task overdue:',
    body: 'Calibrate spectrometer readings is 2 days past due',
    taskTitle: 'Calibrate Spectrometer Readings',
    taskId: 'task-03',
    isRead: false,
    createdAt: minsAgo(10),
  },
  {
    id: 'notif-002',
    type: 'MENTION',
    title: 'Dr. Kumar',
    body: 'mentioned you in',
    taskTitle: 'Fix Lab Equipment Schedule',
    taskId: 'task-01',
    isRead: false,
    createdAt: hoursAgo(1),
  },
  {
    id: 'notif-003',
    type: 'TASK_ASSIGNED',
    title: 'New task assigned',
    body: 'by Dr. Kumar · High priority, due today',
    taskTitle: 'Submit Q3 Budget Projections',
    taskId: 'task-07',
    isRead: false,
    createdAt: hoursAgo(3),
  },
  // ── Yesterday ──────────────────────────────────────────────────────
  {
    id: 'notif-004',
    type: 'TASK_COMPLETED',
    title: 'Dr. Kumar approved',
    body: 'your Lab Safety Report',
    taskTitle: 'Lab Safety Report',
    taskId: 'task-05',
    isRead: true,
    createdAt: daysAgo(1),
  },
  {
    id: 'notif-005',
    type: 'TASK_DUE_SOON',
    title: 'Reminder:',
    body: 'Submit Q3 lab budget due in 24 hours',
    taskTitle: 'Q3 Lab Budget',
    taskId: 'task-06',
    isRead: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
  },
  // ── This week ──────────────────────────────────────────────────────
  {
    id: 'notif-006',
    type: 'TASK_STATUS_CHANGED',
    title: 'Status updated:',
    body: 'Rajan Singh moved Inventory Audit to In Progress',
    taskTitle: 'Inventory Audit Report',
    taskId: 'task-08',
    isRead: true,
    createdAt: daysAgo(3),
  },
  {
    id: 'notif-007',
    type: 'COMMENT_ADDED',
    title: 'New comment',
    body: 'from Priya Sharma on',
    taskTitle: 'Safety Protocol Documentation',
    taskId: 'task-09',
    isRead: true,
    createdAt: daysAgo(4),
  },
  {
    id: 'notif-008',
    type: 'TASK_REASSIGNED',
    title: 'Task reassigned:',
    body: 'Dr. Kumar reassigned Equipment Maintenance to you',
    taskTitle: 'Equipment Maintenance Check',
    taskId: 'task-10',
    isRead: true,
    createdAt: daysAgo(5),
  },
  // ── Earlier ───────────────────────────────────────────────────────
  {
    id: 'notif-009',
    type: 'CLARIFICATION_REQUESTED',
    title: 'Clarification needed:',
    body: 'Dr. Kumar requested more details on',
    taskTitle: 'Annual Lab Maintenance Report',
    taskId: 'task-11',
    isRead: true,
    createdAt: daysAgo(9),
  },
  {
    id: 'notif-010',
    type: 'TASK_ASSIGNED',
    title: 'New task assigned',
    body: 'by Prof. Sharma · Medium priority',
    taskTitle: 'Campus Safety Audit Checklist',
    taskId: 'task-12',
    isRead: true,
    createdAt: daysAgo(12),
  },
];
