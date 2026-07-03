/**
 * Super Admin Tasks (Oversight) — Governance Mock Data
 *
 * Department health, staff load, escalations and the org-wide overview are
 * now wired to the real backend (dashboardApi.getDeptHealth/getStaffLoad/
 * getEscalations in packages/api-client, consumed via
 * apps/mobile/src/hooks/useSuperAdminTasks.ts) — those mock exports have
 * been removed from this file.
 *
 * What's still mock-backed here: the org-wide oversight tab's "Assigned by
 * me" governance summary tile (superAdminTasksService.getGovernanceTaskGroups)
 * and GOVERNANCE_PRIORITY_OPTIONS (AssignGovernanceTaskScreen's compose UI) —
 * plus MOCK_GOVERNANCE_TASKS, which useSuperAdminCalendar.ts also still reads
 * for calendar dots. The SA's own governance list/detail/create/approve/
 * revise flow (GovernanceTasksScreen, AssignGovernanceTaskScreen,
 * useGovernanceReviewActions.ts) has separately moved to the real
 * governanceApi via hooks/useGovernance.ts and no longer touches this file.
 */

import type { TaskPriority } from '@godigitify/types';

import {
  MOCK_USERS,
  type MockTask,
  type MockUser,
} from './tasks.mock';
import { MOCK_ORG_USERS } from './orgDirectory.mock';
import { MOCK_AUDIT_SELF } from './audit.mock';

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
