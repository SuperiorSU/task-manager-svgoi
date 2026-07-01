// Precomputed dashboard statistics from mock task/user data
// In production these come from API aggregation queries

export type DashboardStats = {
  totalTasks: number;
  pending: number;
  accepted: number;
  inProgress: number;
  underReview: number;
  completed: number;
  cancelled: number;
  overdue: number;
  completedThisWeek: number;
  dueToday: number;
  crossDeptTasks: number;
  activeUsers: number;
  departments: number;
  completionRate: number; // 0-100
};

export type TrendDataPoint = {
  date: string;   // MMM D
  completed: number;
  created: number;
};

export type DeptStat = {
  name: string;
  code: string;
  completionRate: number;
  total: number;
  completed: number;
  overdue: number;
};

export type WorkloadEntry = {
  userId: string;
  name: string;
  assigned: number;
  completed: number;
  overdue: number;
};

export type RecentActivityEntry = {
  id: string;
  action: string;
  note?: string;
  createdAt: string;
  actor?: { name: string; avatarUrl?: string | null } | null;
  task?: { id: string; title: string } | null;
};

export const DASHBOARD_STATS: DashboardStats = {
  totalTasks: 30,
  pending: 8,
  accepted: 5,
  inProgress: 7,
  underReview: 2,
  completed: 6,
  cancelled: 1,
  overdue: 5,
  completedThisWeek: 3,
  dueToday: 2,
  crossDeptTasks: 4,
  activeUsers: 12,
  departments: 6,
  completionRate: 67,
};

// 30-day trend data
export const TASK_TREND_DATA: TrendDataPoint[] = [
  { date: 'Jun 1', completed: 1, created: 3 },
  { date: 'Jun 2', completed: 0, created: 1 },
  { date: 'Jun 3', completed: 2, created: 2 },
  { date: 'Jun 4', completed: 0, created: 0 },
  { date: 'Jun 5', completed: 1, created: 2 },
  { date: 'Jun 6', completed: 0, created: 1 },
  { date: 'Jun 7', completed: 1, created: 0 },
  { date: 'Jun 8', completed: 0, created: 2 },
  { date: 'Jun 9', completed: 2, created: 1 },
  { date: 'Jun 10', completed: 0, created: 3 },
  { date: 'Jun 11', completed: 1, created: 0 },
  { date: 'Jun 12', completed: 0, created: 1 },
  { date: 'Jun 13', completed: 2, created: 2 },
  { date: 'Jun 14', completed: 1, created: 1 },
  { date: 'Jun 15', completed: 0, created: 0 },
  { date: 'Jun 16', completed: 1, created: 2 },
  { date: 'Jun 17', completed: 0, created: 1 },
  { date: 'Jun 18', completed: 2, created: 0 },
  { date: 'Jun 19', completed: 1, created: 3 },
  { date: 'Jun 20', completed: 0, created: 1 },
  { date: 'Jun 21', completed: 1, created: 2 },
  { date: 'Jun 22', completed: 0, created: 0 },
  { date: 'Jun 23', completed: 2, created: 1 },
  { date: 'Jun 24', completed: 1, created: 2 },
  { date: 'Jun 25', completed: 0, created: 1 },
  { date: 'Jun 26', completed: 1, created: 0 },
  { date: 'Jun 27', completed: 0, created: 1 },
  { date: 'Jun 28', completed: 2, created: 2 },
  { date: 'Jun 29', completed: 1, created: 1 },
  { date: 'Jun 30', completed: 1, created: 3 },
];

export const DEPT_STATS: DeptStat[] = [
  { name: 'Computer Science', code: 'CS', completionRate: 72, total: 10, completed: 7, overdue: 3 },
  { name: 'Electronics', code: 'ECE', completionRate: 65, total: 8, completed: 5, overdue: 5 },
  { name: 'Mechanical', code: 'ME', completionRate: 80, total: 5, completed: 4, overdue: 1 },
  { name: 'Physics', code: 'PHY', completionRate: 87, total: 3, completed: 3, overdue: 0 },
  { name: 'Chemistry', code: 'CHEM', completionRate: 58, total: 4, completed: 2, overdue: 4 },
  { name: 'Admin', code: 'ADM', completionRate: 91, total: 6, completed: 5, overdue: 2 },
];

export const WORKLOAD_DATA: WorkloadEntry[] = [
  { userId: 'user_emp_adm1', name: 'Ms. Pooja Shah', assigned: 9, completed: 9, overdue: 0 },
  { userId: 'user_emp_cs1', name: 'Ms. Meera Nair', assigned: 8, completed: 6, overdue: 1 },
  { userId: 'user_emp_cs2', name: 'Mr. Arjun Menon', assigned: 10, completed: 7, overdue: 2 },
  { userId: 'user_emp_me1', name: 'Mr. Ravi Kumar', assigned: 5, completed: 5, overdue: 0 },
  { userId: 'user_emp_ece1', name: 'Ms. Kavita Rao', assigned: 6, completed: 4, overdue: 1 },
];

export const RECENT_ACTIVITY: RecentActivityEntry[] = [
  {
    id: 'act_001',
    action: 'STATUS_CHANGED',
    note: 'CS Lab Network Infrastructure Audit moved to UNDER_REVIEW',
    createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
    actor: { name: 'Mr. Arjun Menon' },
    task: { id: 'task_007', title: 'CS Lab Network Infrastructure Audit' },
  },
  {
    id: 'act_002',
    action: 'ASSIGNED',
    note: 'Fire Drill — All Labs and Classrooms assigned to Ms. Sunita Verma',
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    actor: { name: 'Dr. Ramesh Iyer' },
    task: { id: 'task_025', title: 'Fire Drill — All Labs and Classrooms' },
  },
  {
    id: 'act_003',
    action: 'COMMENT',
    note: 'New comment on NAAC Accreditation Documentation — Round 2',
    createdAt: new Date(Date.now() - 240 * 60000).toISOString(),
    actor: { name: 'Dr. Raj Kumar' },
    task: { id: 'task_009', title: 'NAAC Accreditation Documentation — Round 2' },
  },
  {
    id: 'act_004',
    action: 'STATUS_CHANGED',
    note: 'ME–ECE Cross-Dept Project Report accepted by Dr. Priya Sharma',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
    actor: { name: 'Dr. Priya Sharma' },
    task: { id: 'task_024', title: 'ME–ECE Cross-Dept Project Report Submission' },
  },
  {
    id: 'act_005',
    action: 'CREATE',
    note: 'New task created: Fire Drill — All Labs and Classrooms',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
    actor: { name: 'Dr. Ramesh Iyer' },
    task: { id: 'task_025', title: 'Fire Drill — All Labs and Classrooms' },
  },
  {
    id: 'act_006',
    action: 'STATUS_CHANGED',
    note: 'Semester 1 Exam Timetable marked COMPLETED',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60000).toISOString(),
    actor: { name: 'Ms. Pooja Shah' },
    task: { id: 'task_016', title: 'Semester 1 Exam Timetable — Publish' },
  },
  {
    id: 'act_007',
    action: 'STATUS_CHANGED',
    note: 'ME Workshop Safety Drill marked COMPLETED',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60000).toISOString(),
    actor: { name: 'Mr. Ravi Kumar' },
    task: { id: 'task_017', title: 'ME Workshop Safety Drill — June' },
  },
  {
    id: 'act_008',
    action: 'STATUS_CHANGED',
    note: 'Physics Lab Safety Certification marked COMPLETED',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60000).toISOString(),
    actor: { name: 'Dr. Anita Patel' },
    task: { id: 'task_021', title: 'Physics Lab Safety Certification Renewal' },
  },
];
