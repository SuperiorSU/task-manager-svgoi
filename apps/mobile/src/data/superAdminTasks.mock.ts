/**
 * Super Admin Tasks (Oversight) — Mock Data
 * (HTML reference screens 57-63, 67, 69-70: "Super Admin · Tasks (Oversight)"
 * and "Super Admin · Assign to Admin & Track" and "Super Admin · Staff Load
 * & User Detail").
 *
 * Per FR-72 (8_overview.md / 3_backend_directive.md AUDIT_VIEW_ORG scope),
 * the org-wide oversight tab (Overview / Departments / Escalations / dept
 * drill-down / staff-load) shows counts & health only — never individual task
 * titles. No such aggregate-rollup model exists anywhere else in the app, so
 * department health, escalations and staff-capacity numbers are **authored
 * directly** here, the same way MOCK_AUDIT_EVENTS was authored for the Audit
 * module (see project_super_admin_audit memory) — there is no MOCK_TASKS-style
 * source to derive them from without breaking the aggregate-only design.
 *
 * The one deliberate exception is the single "drill all the way down" staff
 * member (Farhan Khan · IT Department) used to demo screens 69/70 (staff task
 * list/detail) — for him, real MockTask-shaped records are authored and his
 * aggregate numbers are *computed* from those records, so there is exactly
 * one source of truth for that path (see superAdminTasks.service.ts).
 *
 * Departments/admins/employees reuse the real org roster from
 * orgDirectory.mock.ts (5 departments: Physics, IT Department, Admin Office,
 * Academic Office, CS & Electronics) instead of the HTML mock's fictional
 * Sports/Mathematics/Library/Chemistry roster — consistent with every other
 * Super Admin module (no parallel fake department list).
 *
 * Swap USE_MOCK = false and point superAdminTasks.service.ts methods at
 * GET /dashboard/org-stats (task-scoped), GET /departments?includeStats=1,
 * GET /tasks/escalations, GET /tasks?creatorId=me&scope=governance and
 * GET /users/:id/tasks when the backend is ready. Shapes are stable — UI
 * never imports MOCK_* directly, only the service/hooks.
 */

import type { TaskPriority } from '@godigitify/types';

import {
  MOCK_USERS,
  type MockTask,
  type MockUser,
} from './tasks.mock';
import { MOCK_ORG_USERS } from './orgDirectory.mock';
import { MOCK_AUDIT_SELF } from './audit.mock';

export const USE_MOCK = true;

// ─── Types ────────────────────────────────────────────────────────────────────

export type RiskLevel = 'HEALTHY' | 'AT_RISK' | 'CRITICAL';

export type StatusDistribution = {
  pending: number;
  inProgress: number;
  review: number;
  overdue: number;
};

export type DeptTaskHealth = {
  departmentId: string;
  departmentName: string;
  adminId: string;
  adminName: string;
  adminInitials: string;
  staffCount: number;
  activeCount: number;
  overdueCount: number;
  onTimeRate: number; // 0-100
  riskLevel: RiskLevel;
  statusDistribution: StatusDistribution;
};

export type StaffLoadSummary = {
  staffId: string; // org user id
  name: string;
  initials: string;
  avatarBg: string;
  departmentId: string;
  departmentName: string;
  designation: string;
  managerName: string;
  employeeCode: string;
  activeCount: number;
  overdueCount: number;
  onTimeRate: number;
  avgCycleDays: number;
  capacityTarget: number;
  capacityPercent: number; // can exceed 100
  riskLevel: RiskLevel;
  statusDistribution: StatusDistribution;
};

export type EscalationType = 'OVERDUE_CLUSTER' | 'REVIEW_STALLED' | 'PENDING_ACCEPT_STALLED';

export type EscalationEntry = {
  id: string;
  type: EscalationType;
  departmentId: string;
  ownerId: string;
  ownerActioned: boolean;
  detectedAt: string; // ISO
};

export type WeeklyThroughputPoint = {
  day: string;
  created: number;
  completed: number;
};

export const ESCALATION_TYPE_META: Record<
  EscalationType,
  { label: string; badgeBg: string; badgeColor: string; barColor: string }
> = {
  OVERDUE_CLUSTER: { label: 'Overdue cluster', badgeBg: '#FEF2F2', badgeColor: '#B91C1C', barColor: '#EF4444' },
  REVIEW_STALLED: { label: 'Review stalled', badgeBg: '#FFFBEB', badgeColor: '#B45309', barColor: '#F59E0B' },
  PENDING_ACCEPT_STALLED: { label: 'Pending acceptance', badgeBg: '#FFFBEB', badgeColor: '#B45309', barColor: '#F59E0B' },
};

// ─── Departments (5 real depts, authored aggregate health) ───────────────────
// Sorted worst→best by on-time rate is done in the service, not here.

export const MOCK_DEPT_TASK_HEALTH: DeptTaskHealth[] = [
  {
    departmentId: 'dept_02',
    departmentName: 'IT Department',
    adminId: MOCK_USERS.sunil.id,
    adminName: MOCK_USERS.sunil.name,
    adminInitials: MOCK_USERS.sunil.initials,
    // IT has exactly one employee (Farhan Khan) — these numbers are kept in
    // lockstep with his authored MOCK_STAFF_TASKS records below (see
    // hydrateStaffLoad in the service) so the department drill-down and the
    // staff-load drill-through never disagree on his counts.
    staffCount: 1,
    activeCount: 5,
    overdueCount: 2,
    onTimeRate: 42,
    riskLevel: 'CRITICAL',
    statusDistribution: { pending: 1, inProgress: 1, review: 1, overdue: 2 },
  },
  {
    departmentId: 'dept_03',
    departmentName: 'Admin Office',
    adminId: MOCK_USERS.nisha.id,
    adminName: MOCK_USERS.nisha.name,
    adminInitials: MOCK_USERS.nisha.initials,
    staffCount: 1,
    activeCount: 18,
    overdueCount: 5,
    onTimeRate: 58,
    riskLevel: 'AT_RISK',
    statusDistribution: { pending: 5, inProgress: 6, review: 2, overdue: 5 },
  },
  {
    departmentId: 'dept_05',
    departmentName: 'CS & Electronics',
    adminId: MOCK_USERS.rsingh.id,
    adminName: MOCK_USERS.rsingh.name,
    adminInitials: MOCK_USERS.rsingh.initials,
    staffCount: 2,
    activeCount: 22,
    overdueCount: 4,
    onTimeRate: 66,
    riskLevel: 'AT_RISK',
    statusDistribution: { pending: 6, inProgress: 8, review: 4, overdue: 4 },
  },
  {
    departmentId: 'dept_04',
    departmentName: 'Academic Office',
    adminId: 'org_usr_012',
    adminName: 'Meera Iyer',
    adminInitials: 'MI',
    staffCount: 1,
    activeCount: 16,
    overdueCount: 2,
    onTimeRate: 74,
    riskLevel: 'AT_RISK',
    statusDistribution: { pending: 5, inProgress: 6, review: 3, overdue: 2 },
  },
  {
    departmentId: 'dept_01',
    departmentName: 'Physics',
    adminId: MOCK_USERS.akumar.id,
    adminName: MOCK_USERS.akumar.name,
    adminInitials: MOCK_USERS.akumar.initials,
    staffCount: 2,
    activeCount: 20,
    overdueCount: 1,
    onTimeRate: 85,
    riskLevel: 'HEALTHY',
    statusDistribution: { pending: 6, inProgress: 9, review: 4, overdue: 1 },
  },
];

// ─── Weekly throughput (authored — no persisted daily-trend source exists) ───

export const MOCK_WEEKLY_THROUGHPUT: WeeklyThroughputPoint[] = [
  { day: 'Mon', created: 5, completed: 3 },
  { day: 'Tue', created: 8, completed: 6 },
  { day: 'Wed', created: 6, completed: 7 },
  { day: 'Thu', created: 7, completed: 6 },
  { day: 'Fri', created: 5, completed: 5 },
  { day: 'Sat', created: 2, completed: 3 },
];

// ─── Staff load — aggregate rollups per employee ──────────────────────────────
// Farhan Khan's numbers intentionally equal IT Department's totals (he's the
// dept's only employee) and are re-derived from MOCK_STAFF_TASKS in the
// service — everyone else here is authored aggregate-only, same rationale
// as department health above.

export const MOCK_STAFF_LOAD: StaffLoadSummary[] = [
  {
    staffId: MOCK_USERS.farhan.id,
    name: MOCK_USERS.farhan.name,
    initials: MOCK_USERS.farhan.initials,
    avatarBg: '#0D9488',
    departmentId: 'dept_02',
    departmentName: 'IT Department',
    designation: MOCK_USERS.farhan.designation,
    managerName: MOCK_USERS.sunil.name,
    employeeCode: 'SVGOI-0151',
    // Matches his 5 authored MOCK_STAFF_TASKS records exactly (2 overdue, 1
    // in-progress, 1 pending, 1 under review) — hydrateStaffLoad() in the
    // service recomputes activeCount/overdueCount/statusDistribution live
    // from those records, so these three fields are overwritten at read time;
    // they're kept accurate here anyway so this file reads consistently on
    // its own. onTimeRate/avgCycleDays are trailing-average metrics with no
    // live source (no completed tasks in the 5) and stay authored.
    activeCount: 5,
    overdueCount: 2,
    onTimeRate: 42,
    avgCycleDays: 3.4,
    capacityTarget: 3,
    capacityPercent: 167,
    riskLevel: 'CRITICAL',
    statusDistribution: { pending: 1, inProgress: 1, review: 1, overdue: 2 },
  },
  {
    staffId: MOCK_USERS.rajan.id,
    name: MOCK_USERS.rajan.name,
    initials: MOCK_USERS.rajan.initials,
    avatarBg: '#0EA5E9',
    departmentId: 'dept_01',
    departmentName: 'Physics',
    designation: MOCK_USERS.rajan.designation,
    managerName: MOCK_USERS.akumar.name,
    employeeCode: 'SVGOI-0041',
    activeCount: 12,
    overdueCount: 1,
    onTimeRate: 84,
    avgCycleDays: 2.0,
    capacityTarget: 10,
    capacityPercent: 120,
    riskLevel: 'AT_RISK',
    statusDistribution: { pending: 4, inProgress: 5, review: 2, overdue: 1 },
  },
  {
    staffId: MOCK_USERS.priya.id,
    name: MOCK_USERS.priya.name,
    initials: MOCK_USERS.priya.initials,
    avatarBg: '#7C3AED',
    departmentId: 'dept_01',
    departmentName: 'Physics',
    designation: MOCK_USERS.priya.designation,
    managerName: MOCK_USERS.akumar.name,
    employeeCode: 'SVGOI-0133',
    activeCount: 8,
    overdueCount: 0,
    onTimeRate: 91,
    avgCycleDays: 1.6,
    capacityTarget: 10,
    capacityPercent: 80,
    riskLevel: 'HEALTHY',
    statusDistribution: { pending: 2, inProgress: 4, review: 2, overdue: 0 },
  },
  {
    staffId: MOCK_USERS.suresh.id,
    name: MOCK_USERS.suresh.name,
    initials: MOCK_USERS.suresh.initials,
    avatarBg: '#F59E0B',
    departmentId: 'dept_03',
    departmentName: 'Admin Office',
    designation: MOCK_USERS.suresh.designation,
    managerName: MOCK_USERS.nisha.name,
    employeeCode: 'SVGOI-0342',
    activeCount: 18,
    overdueCount: 5,
    onTimeRate: 58,
    avgCycleDays: 2.8,
    capacityTarget: 12,
    capacityPercent: 150,
    riskLevel: 'CRITICAL',
    statusDistribution: { pending: 5, inProgress: 6, review: 2, overdue: 5 },
  },
  {
    staffId: MOCK_USERS.anita.id,
    name: MOCK_USERS.anita.name,
    initials: MOCK_USERS.anita.initials,
    avatarBg: '#EC4899',
    departmentId: 'dept_05',
    departmentName: 'CS & Electronics',
    designation: MOCK_USERS.anita.designation,
    managerName: MOCK_USERS.rsingh.name,
    employeeCode: 'SVGOI-0231',
    activeCount: 13,
    overdueCount: 2,
    onTimeRate: 72,
    avgCycleDays: 2.2,
    capacityTarget: 10,
    capacityPercent: 130,
    riskLevel: 'AT_RISK',
    statusDistribution: { pending: 4, inProgress: 5, review: 2, overdue: 2 },
  },
  {
    staffId: MOCK_USERS.meena.id,
    name: MOCK_USERS.meena.name,
    initials: MOCK_USERS.meena.initials,
    avatarBg: '#22C55E',
    departmentId: 'dept_05',
    departmentName: 'CS & Electronics',
    designation: MOCK_USERS.meena.designation,
    managerName: MOCK_USERS.rsingh.name,
    employeeCode: 'SVGOI-0244',
    activeCount: 9,
    overdueCount: 2,
    onTimeRate: 61,
    avgCycleDays: 2.6,
    capacityTarget: 10,
    capacityPercent: 90,
    riskLevel: 'AT_RISK',
    statusDistribution: { pending: 2, inProgress: 3, review: 2, overdue: 2 },
  },
  {
    staffId: MOCK_USERS.deepa.id,
    name: MOCK_USERS.deepa.name,
    initials: MOCK_USERS.deepa.initials,
    avatarBg: '#8B5CF6',
    departmentId: 'dept_04',
    departmentName: 'Academic Office',
    designation: MOCK_USERS.deepa.designation,
    managerName: 'Meera Iyer',
    employeeCode: 'SVGOI-0287',
    activeCount: 16,
    overdueCount: 2,
    onTimeRate: 74,
    avgCycleDays: 2.1,
    capacityTarget: 12,
    capacityPercent: 133,
    riskLevel: 'AT_RISK',
    statusDistribution: { pending: 5, inProgress: 6, review: 3, overdue: 2 },
  },
];

// ─── Escalations (authored, reference dept health by id — no duplicate counts) ─

export const MOCK_ESCALATIONS: EscalationEntry[] = [
  {
    id: 'esc_001',
    type: 'OVERDUE_CLUSTER',
    departmentId: 'dept_02',
    ownerId: MOCK_USERS.sunil.id,
    ownerActioned: false,
    detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'esc_002',
    type: 'REVIEW_STALLED',
    departmentId: 'dept_03',
    ownerId: MOCK_USERS.nisha.id,
    ownerActioned: false,
    detectedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'esc_003',
    type: 'PENDING_ACCEPT_STALLED',
    departmentId: 'dept_05',
    ownerId: MOCK_USERS.rsingh.id,
    ownerActioned: false,
    detectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Governance tasks — "Assign to Admin & Track" (SA owns these in full) ────
// Reuses the exact MockTask shape from tasks.mock.ts (no duplicated type).
// Creator is always the current Super Admin (S. Verma — the identity already
// established in audit.mock.ts's MOCK_AUDIT_SELF, reused here rather than
// inventing a second SA identity). Assignees are real org-directory admins.

export const SA_SELF_USER: MockUser = {
  id: MOCK_AUDIT_SELF.id,
  name: MOCK_AUDIT_SELF.name,
  designation: 'Super Admin',
  initials: MOCK_AUDIT_SELF.initials,
};

const ADMIN_KUMAR = MOCK_USERS.akumar;
const ADMIN_IYER: MockUser = {
  id: 'org_usr_012',
  name: 'Meera Iyer',
  designation: 'Head of Academic Office',
  initials: 'MI',
};

const now = new Date();
const past = (days: number, hours = 0) =>
  new Date(now.getTime() - (days * 24 + hours) * 60 * 60 * 1000).toISOString();
const future = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

export const MOCK_GOVERNANCE_TASKS: MockTask[] = [
  {
    id: 'gov_001',
    title: 'Lab equipment register update',
    description:
      "Compile the Physics department's full lab-equipment register with condition notes and disposal flags. Attach the signed sheet as proof.",
    status: 'UNDER_REVIEW',
    priority: 'MEDIUM',
    dueDate: future(-1),
    createdAt: past(1, 9),
    acceptedAt: past(1, 1),
    isRecurring: false,
    progress: 90,
    department: { id: 'dept_01', name: 'Physics' },
    project: { id: 'proj_gov', name: 'Governance' },
    creator: SA_SELF_USER,
    assignee: ADMIN_KUMAR,
    labels: ['Governance'],
    subtasks: [],
    attachments: [
      {
        id: 'att_gov_001',
        fileName: 'Equipment_register_Q2.pdf',
        fileSize: 2_100_000,
        mimeType: 'application/pdf',
        isProof: true,
        uploadedBy: ADMIN_KUMAR,
        createdAt: past(0, 2),
      },
    ],
    activity: [
      {
        id: 'act_gov_001a',
        action: 'CREATE',
        description: 'You assigned this task',
        actor: SA_SELF_USER,
        createdAt: past(1, 9),
      },
      {
        id: 'act_gov_001b',
        action: 'STATUS_CHANGED',
        description: 'A. Kumar marked In progress',
        actor: ADMIN_KUMAR,
        metadata: { from: 'ACCEPTED', to: 'IN_PROGRESS' },
        createdAt: past(1, 1),
      },
      {
        id: 'act_gov_001c',
        action: 'STATUS_CHANGED',
        description: 'A. Kumar submitted for review',
        actor: ADMIN_KUMAR,
        metadata: { from: 'IN_PROGRESS', to: 'UNDER_REVIEW' },
        createdAt: past(0, 2),
      },
    ],
    comments: [
      {
        id: 'cmt_gov_001',
        content: 'All 214 items reconciled; 3 flagged for disposal are listed on page 4.',
        author: ADMIN_KUMAR,
        mentions: [],
        createdAt: past(0, 2),
        isEdited: false,
      },
    ],
  },
  {
    id: 'gov_002',
    title: 'Faculty appraisal forms — Physics',
    description: 'Collect and countersign annual appraisal forms for all Physics faculty.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: future(2),
    createdAt: past(3),
    acceptedAt: past(2),
    isRecurring: false,
    progress: 40,
    department: { id: 'dept_01', name: 'Physics' },
    project: { id: 'proj_gov', name: 'Governance' },
    creator: SA_SELF_USER,
    assignee: ADMIN_KUMAR,
    labels: ['Governance'],
    subtasks: [],
    attachments: [],
    activity: [
      {
        id: 'act_gov_002a',
        action: 'CREATE',
        description: 'You assigned this task',
        actor: SA_SELF_USER,
        createdAt: past(3),
      },
      {
        id: 'act_gov_002b',
        action: 'STATUS_CHANGED',
        description: 'A. Kumar marked In progress',
        actor: ADMIN_KUMAR,
        metadata: { from: 'ACCEPTED', to: 'IN_PROGRESS' },
        createdAt: past(2),
      },
    ],
    comments: [],
  },
  {
    id: 'gov_003',
    title: 'Accreditation self-study — Academic Office',
    description: 'Draft the accreditation self-study section for academic operations.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: future(9),
    createdAt: past(4),
    acceptedAt: past(3),
    isRecurring: false,
    progress: 25,
    department: { id: 'dept_04', name: 'Academic Office' },
    project: { id: 'proj_gov', name: 'Governance' },
    creator: SA_SELF_USER,
    assignee: ADMIN_IYER,
    labels: ['Governance'],
    subtasks: [],
    attachments: [],
    activity: [
      {
        id: 'act_gov_003a',
        action: 'CREATE',
        description: 'You assigned this task',
        actor: SA_SELF_USER,
        createdAt: past(4),
      },
      {
        id: 'act_gov_003b',
        action: 'STATUS_CHANGED',
        description: 'M. Iyer marked In progress',
        actor: ADMIN_IYER,
        metadata: { from: 'ACCEPTED', to: 'IN_PROGRESS' },
        createdAt: past(3),
      },
    ],
    comments: [],
  },
  {
    id: 'gov_004',
    title: 'Submit Q2 department budget',
    description:
      "Compile the Physics department's Q2 operating budget with headcount and lab-equipment lines. Attach the signed sheet as proof.",
    status: 'PENDING',
    priority: 'HIGH',
    dueDate: future(7),
    createdAt: past(0),
    isRecurring: false,
    progress: 0,
    department: { id: 'dept_01', name: 'Physics' },
    project: { id: 'proj_gov', name: 'Governance' },
    creator: SA_SELF_USER,
    assignee: ADMIN_KUMAR,
    labels: ['Governance'],
    subtasks: [],
    attachments: [],
    activity: [
      {
        id: 'act_gov_004a',
        action: 'CREATE',
        description: 'You assigned this task',
        actor: SA_SELF_USER,
        createdAt: past(0),
      },
    ],
    comments: [],
  },
];

// ─── Staff tasks — one fully-detailed drill-through (Farhan Khan · IT) ────────
// Backing records for screens 69/70. Every other staff member in
// MOCK_STAFF_LOAD is aggregate-only by design (FR-72) and has no entry here —
// getStaffTasks() returns an empty list for them, and the UI shows EmptyState.

export const MOCK_STAFF_TASKS: Record<string, MockTask[]> = {
  [MOCK_USERS.farhan.id]: [
    {
      id: 'stask_001',
      title: 'Patch lab desktop antivirus — Block C',
      description:
        'Roll out the latest antivirus definitions and patch set to all 24 lab desktops in Block C. Log completion per machine in the IT asset sheet.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: past(5),
      createdAt: past(12),
      acceptedAt: past(11),
      isRecurring: false,
      progress: 55,
      department: { id: 'dept_02', name: 'IT Department' },
      project: { id: 'proj_it', name: 'IT Operations' },
      creator: MOCK_USERS.sunil,
      assignee: MOCK_USERS.farhan,
      labels: ['IT', 'Security'],
      subtasks: [],
      attachments: [],
      activity: [
        {
          id: 'act_st001a',
          action: 'CREATE',
          description: 'S. Verma assigned this task',
          actor: MOCK_USERS.sunil,
          createdAt: past(12),
        },
        {
          id: 'act_st001b',
          action: 'STATUS_CHANGED',
          description: 'Passed due date — now overdue',
          actor: MOCK_USERS.farhan,
          metadata: { from: 'IN_PROGRESS', to: 'IN_PROGRESS' },
          createdAt: past(5),
        },
      ],
      comments: [],
    },
    {
      id: 'stask_002',
      title: 'Submit network access audit log',
      description:
        'Export and submit the quarterly network access audit log for review, flagging any accounts with stale privileges.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: past(4),
      createdAt: past(10),
      acceptedAt: past(9),
      isRecurring: false,
      progress: 30,
      department: { id: 'dept_02', name: 'IT Department' },
      project: { id: 'proj_it', name: 'IT Operations' },
      creator: MOCK_USERS.sunil,
      assignee: MOCK_USERS.farhan,
      labels: ['IT', 'Audit'],
      subtasks: [],
      attachments: [],
      activity: [
        {
          id: 'act_st002a',
          action: 'CREATE',
          description: 'S. Verma assigned this task',
          actor: MOCK_USERS.sunil,
          createdAt: past(10),
        },
      ],
      comments: [],
    },
    {
      id: 'stask_003',
      title: 'Refresh classroom projector firmware',
      description: 'Update firmware on all classroom projectors ahead of the new semester.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      dueDate: future(3),
      createdAt: past(4),
      acceptedAt: past(3),
      isRecurring: false,
      progress: 20,
      department: { id: 'dept_02', name: 'IT Department' },
      project: { id: 'proj_it', name: 'IT Operations' },
      creator: MOCK_USERS.sunil,
      assignee: MOCK_USERS.farhan,
      labels: ['IT'],
      subtasks: [],
      attachments: [],
      activity: [
        {
          id: 'act_st003a',
          action: 'CREATE',
          description: 'S. Verma assigned this task',
          actor: MOCK_USERS.sunil,
          createdAt: past(4),
        },
      ],
      comments: [],
    },
    {
      id: 'stask_004',
      title: 'Update IT asset inventory sheet',
      description: 'Reconcile the IT asset inventory sheet against the last physical stock check.',
      status: 'PENDING',
      priority: 'LOW',
      dueDate: future(5),
      createdAt: past(1),
      isRecurring: false,
      progress: 0,
      department: { id: 'dept_02', name: 'IT Department' },
      project: { id: 'proj_it', name: 'IT Operations' },
      creator: MOCK_USERS.sunil,
      assignee: MOCK_USERS.farhan,
      labels: ['IT'],
      subtasks: [],
      attachments: [],
      activity: [
        {
          id: 'act_st004a',
          action: 'CREATE',
          description: 'S. Verma assigned this task',
          actor: MOCK_USERS.sunil,
          createdAt: past(1),
        },
      ],
      comments: [],
    },
    {
      id: 'stask_005',
      title: 'Migrate staff email signatures',
      description: 'Roll out the new institutional email signature template to all IT-managed accounts.',
      status: 'UNDER_REVIEW',
      priority: 'MEDIUM',
      dueDate: future(1),
      createdAt: past(6),
      acceptedAt: past(5),
      isRecurring: false,
      progress: 95,
      department: { id: 'dept_02', name: 'IT Department' },
      project: { id: 'proj_it', name: 'IT Operations' },
      creator: MOCK_USERS.sunil,
      assignee: MOCK_USERS.farhan,
      labels: ['IT'],
      subtasks: [],
      attachments: [],
      activity: [
        {
          id: 'act_st005a',
          action: 'CREATE',
          description: 'S. Verma assigned this task',
          actor: MOCK_USERS.sunil,
          createdAt: past(6),
        },
        {
          id: 'act_st005b',
          action: 'STATUS_CHANGED',
          description: 'F. Khan submitted for review',
          actor: MOCK_USERS.farhan,
          metadata: { from: 'IN_PROGRESS', to: 'UNDER_REVIEW' },
          createdAt: past(0, 3),
        },
      ],
      comments: [],
    },
  ],
};

// ─── Governance-assignable admins (reused from org directory) ────────────────

export const GOVERNANCE_ASSIGNABLE_ADMINS = MOCK_ORG_USERS.filter((u) => u.role === 'ADMIN');

// ─── Priority pill options for the compose screen (Low / Med / High only —
// matches HTML screen 61 exactly; Critical is intentionally not offered for
// governance/administrative tasks) ─────────────────────────────────────────

export const GOVERNANCE_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Med' },
  { value: 'HIGH', label: 'High' },
];
