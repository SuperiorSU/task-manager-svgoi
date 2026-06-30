import type { NotificationType } from '@godigitify/types';

export type NotificationRecord = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  userId: string;
  taskId?: string;
  createdAt: string;
};

const now = new Date('2026-06-30T10:00:00.000Z');
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60000).toISOString();

export const MOCK_NOTIFICATIONS: NotificationRecord[] = [
  {
    id: 'notif_001',
    type: 'TASK_OVERDUE',
    title: 'Task Overdue',
    body: 'Submit AICTE Compliance Report Q1 is 5 days overdue.',
    isRead: false,
    userId: 'user_sa',
    taskId: 'task_001',
    createdAt: ago(30),
  },
  {
    id: 'notif_002',
    type: 'TASK_STATUS_CHANGED',
    title: 'Task Under Review',
    body: 'Mr. Arjun Menon submitted CS Lab Network Infrastructure Audit for review.',
    isRead: false,
    userId: 'user_admin_cs',
    taskId: 'task_007',
    createdAt: ago(90),
  },
  {
    id: 'notif_003',
    type: 'TASK_ASSIGNED',
    title: 'New Task Assigned',
    body: 'Dr. Ramesh Iyer assigned you: Fire Drill — All Labs and Classrooms.',
    isRead: false,
    userId: 'user_admin_adm',
    taskId: 'task_025',
    createdAt: ago(120),
  },
  {
    id: 'notif_004',
    type: 'TASK_DUE_SOON',
    title: 'Task Due in 24 Hours',
    body: 'Faculty Attendance Sheet — June 2026 is due by 5:00 PM today.',
    isRead: false,
    userId: 'user_emp_adm1',
    taskId: 'task_006',
    createdAt: ago(180),
  },
  {
    id: 'notif_005',
    type: 'COMMENT_ADDED',
    title: 'New Comment',
    body: 'Dr. Raj Kumar commented on NAAC Accreditation Documentation — Round 2.',
    isRead: false,
    userId: 'user_admin_adm',
    taskId: 'task_009',
    createdAt: ago(240),
  },
  {
    id: 'notif_006',
    type: 'TASK_OVERDUE',
    title: 'Task Overdue',
    body: 'CS Department Annual Report 2025–26 was due yesterday.',
    isRead: true,
    userId: 'user_emp_cs1',
    taskId: 'task_004',
    createdAt: ago(360),
  },
  {
    id: 'notif_007',
    type: 'TASK_STATUS_CHANGED',
    title: 'Task Accepted',
    body: 'Dr. Priya Sharma accepted: NAAC Faculty Profile Data update.',
    isRead: true,
    userId: 'user_sa',
    taskId: 'task_015',
    createdAt: ago(480),
  },
  {
    id: 'notif_008',
    type: 'TASK_COMPLETED',
    title: 'Task Completed',
    body: 'Ms. Pooja Shah completed: Verify Payroll Data — May 2026.',
    isRead: true,
    userId: 'user_admin_adm',
    taskId: 'task_020',
    createdAt: ago(720),
  },
  {
    id: 'notif_009',
    type: 'TASK_REASSIGNED',
    title: 'Task Reassigned',
    body: 'ME Workshop CNC Machine Calibration has been assigned to Mr. Ravi Kumar.',
    isRead: true,
    userId: 'user_emp_me1',
    taskId: 'task_010',
    createdAt: ago(1440),
  },
  {
    id: 'notif_010',
    type: 'TASK_DUE_SOON',
    title: 'Task Due in 3 Days',
    body: 'Physics Lab Spectrometer Maintenance is due on July 3.',
    isRead: true,
    userId: 'user_admin_phy',
    taskId: 'task_013',
    createdAt: ago(2880),
  },
  {
    id: 'notif_011',
    type: 'COMMENT_ADDED',
    title: 'New Comment',
    body: 'Dr. Vivek Singh commented on ME–ECE Cross-Dept Project Report Submission.',
    isRead: true,
    userId: 'user_admin_ece',
    taskId: 'task_024',
    createdAt: ago(4320),
  },
  {
    id: 'notif_012',
    type: 'TASK_STATUS_CHANGED',
    title: 'Task Completed',
    body: 'Ms. Pooja Shah marked Semester 1 Exam Timetable as complete.',
    isRead: true,
    userId: 'user_sa',
    taskId: 'task_016',
    createdAt: ago(14400),
  },
];

export const NOTIFICATION_UNREAD_COUNT = MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;
