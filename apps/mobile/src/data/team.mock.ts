/**
 * Team / People mock data
 * Swap service calls for real API — shapes match the Prisma User model from 3_backend_directive.md
 */

import dayjs from 'dayjs';

// ─── Domain types ─────────────────────────────────────────────────────────────

export type TeamMemberRole = 'EMPLOYEE' | 'ADMIN';
export type TeamMemberStatus = 'ACTIVE' | 'SUSPENDED';

export type TeamDepartment = {
  id: string;
  name: string;
};

export type RecentTaskItem = {
  id: string;
  title: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'CANCELLED';
  dueDate: string;
};

export type TeamTaskStats = {
  assigned: number;
  completed: number;
  overdue: number;
  onTimeRate: number; // percentage 0-100
};

export type TeamMember = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  employeeId: string;
  email: string;
  phone?: string;
  designation: string;
  role: TeamMemberRole;
  department: TeamDepartment;
  isActive: boolean;
  joinedAt: string;
  lastLoginAt: string;
  taskStats: TeamTaskStats;
  recentTasks: RecentTaskItem[];
};

export type CreateMemberPayload = {
  name: string;
  employeeId: string;
  email: string;
  phone?: string;
  designation?: string;
  role: TeamMemberRole;
  departmentId: string;
};

// ─── Reference departments (Admin is scoped to own dept) ──────────────────────

export const TEAM_DEPARTMENTS: TeamDepartment[] = [
  { id: 'dept_01', name: 'Physics' },
  { id: 'dept_02', name: 'IT Department' },
  { id: 'dept_03', name: 'Admin Office' },
  { id: 'dept_04', name: 'Academic Office' },
  { id: 'dept_05', name: 'CS & Electronics' },
];

export const ADMIN_DEPT: TeamDepartment = TEAM_DEPARTMENTS[0]!;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const now = dayjs();
const past = (d: number) => now.subtract(d, 'day').toISOString();
const future = (d: number, h = 17) =>
  now.add(d, 'day').hour(h).minute(0).second(0).toISOString();

// ─── Mock team members (Physics dept — Admin scope) ───────────────────────────

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'mbr_001',
    name: 'Rajan Sharma',
    initials: 'RS',
    avatarColor: '#1A5CF8',
    employeeId: 'EMP-2041',
    email: 'rajan.sharma@svgoi.ac.in',
    phone: '+91 98765 43210',
    designation: 'Lab Technician',
    role: 'EMPLOYEE',
    department: ADMIN_DEPT,
    isActive: true,
    joinedAt: past(420),
    lastLoginAt: past(0),
    taskStats: { assigned: 18, completed: 15, overdue: 1, onTimeRate: 92 },
    recentTasks: [
      {
        id: 'task_001',
        title: 'Lab Safety Report — Q2',
        priority: 'HIGH',
        status: 'UNDER_REVIEW',
        dueDate: now.hour(17).minute(0).toISOString(),
      },
      {
        id: 'task_002',
        title: 'Recalibrate spectrometer',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        dueDate: future(1),
      },
    ],
  },
  {
    id: 'mbr_002',
    name: 'Anita Patel',
    initials: 'AP',
    avatarColor: '#0D9488',
    employeeId: 'EMP-1987',
    email: 'anita.patel@svgoi.ac.in',
    phone: '+91 91234 56789',
    designation: 'Senior Analyst',
    role: 'EMPLOYEE',
    department: ADMIN_DEPT,
    isActive: true,
    joinedAt: past(680),
    lastLoginAt: past(1),
    taskStats: { assigned: 12, completed: 11, overdue: 0, onTimeRate: 97 },
    recentTasks: [
      {
        id: 'task_003',
        title: 'Budget report submission — FY26',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: future(2),
      },
    ],
  },
  {
    id: 'mbr_003',
    name: 'Meena Kulkarni',
    initials: 'MK',
    avatarColor: '#7C3AED',
    employeeId: 'EMP-2210',
    email: 'meena.kulkarni@svgoi.ac.in',
    designation: 'Lab Assistant',
    role: 'EMPLOYEE',
    department: ADMIN_DEPT,
    isActive: true,
    joinedAt: past(180),
    lastLoginAt: past(2),
    taskStats: { assigned: 8, completed: 6, overdue: 0, onTimeRate: 88 },
    recentTasks: [
      {
        id: 'task_004',
        title: 'Inventory check — Lab 2',
        priority: 'LOW',
        status: 'PENDING',
        dueDate: future(3),
      },
    ],
  },
  {
    id: 'mbr_004',
    name: 'Deepak Nair',
    initials: 'DN',
    avatarColor: '#EA580C',
    employeeId: 'EMP-2088',
    email: 'deepak.nair@svgoi.ac.in',
    phone: '+91 99001 23456',
    designation: 'Lab Supervisor',
    role: 'EMPLOYEE',
    department: ADMIN_DEPT,
    isActive: true,
    joinedAt: past(380),
    lastLoginAt: past(0),
    taskStats: { assigned: 14, completed: 12, overdue: 1, onTimeRate: 85 },
    recentTasks: [
      {
        id: 'task_005',
        title: 'Fix Lab Equipment Schedule',
        priority: 'CRITICAL',
        status: 'IN_PROGRESS',
        dueDate: future(1),
      },
    ],
  },
  {
    id: 'mbr_005',
    name: 'Priya Mehta',
    initials: 'PM',
    avatarColor: '#0891B2',
    employeeId: 'EMP-2133',
    email: 'priya.mehta@svgoi.ac.in',
    designation: 'Research Associate',
    role: 'EMPLOYEE',
    department: ADMIN_DEPT,
    isActive: true,
    joinedAt: past(250),
    lastLoginAt: past(3),
    taskStats: { assigned: 6, completed: 5, overdue: 0, onTimeRate: 100 },
    recentTasks: [],
  },
  {
    id: 'mbr_006',
    name: 'Karthik Venkat',
    initials: 'KV',
    avatarColor: '#16A34A',
    employeeId: 'EMP-2190',
    email: 'karthik.venkat@svgoi.ac.in',
    phone: '+91 87654 32109',
    designation: 'Technical Officer',
    role: 'EMPLOYEE',
    department: ADMIN_DEPT,
    isActive: true,
    joinedAt: past(140),
    lastLoginAt: past(1),
    taskStats: { assigned: 10, completed: 8, overdue: 0, onTimeRate: 90 },
    recentTasks: [
      {
        id: 'task_006',
        title: 'Safety protocol documentation',
        priority: 'MEDIUM',
        status: 'ACCEPTED',
        dueDate: future(4),
      },
    ],
  },
  {
    id: 'mbr_007',
    name: 'Sneha Joshi',
    initials: 'SJ',
    avatarColor: '#BE185D',
    employeeId: 'EMP-2245',
    email: 'sneha.joshi@svgoi.ac.in',
    designation: 'Lab Assistant',
    role: 'EMPLOYEE',
    department: ADMIN_DEPT,
    isActive: true,
    joinedAt: past(60),
    lastLoginAt: past(5),
    taskStats: { assigned: 3, completed: 2, overdue: 0, onTimeRate: 100 },
    recentTasks: [],
  },
  {
    id: 'mbr_008',
    name: 'Rahul Iyer',
    initials: 'RI',
    avatarColor: '#B45309',
    employeeId: 'EMP-2061',
    email: 'rahul.iyer@svgoi.ac.in',
    phone: '+91 93456 78901',
    designation: 'Senior Lab Technician',
    role: 'EMPLOYEE',
    department: ADMIN_DEPT,
    isActive: true,
    joinedAt: past(560),
    lastLoginAt: past(0),
    taskStats: { assigned: 20, completed: 16, overdue: 2, onTimeRate: 78 },
    recentTasks: [
      {
        id: 'task_007',
        title: 'Calibration log submission',
        priority: 'HIGH',
        status: 'PENDING',
        dueDate: past(1),
      },
    ],
  },
  // Suspended member
  {
    id: 'mbr_009',
    name: 'Suresh Verma',
    initials: 'SV',
    avatarColor: '#94A3B8',
    employeeId: 'EMP-2055',
    email: 'suresh.verma@svgoi.ac.in',
    designation: 'Lab Technician',
    role: 'EMPLOYEE',
    department: ADMIN_DEPT,
    isActive: false,
    joinedAt: past(820),
    lastLoginAt: past(45),
    taskStats: { assigned: 2, completed: 0, overdue: 2, onTimeRate: 0 },
    recentTasks: [],
  },
];
