import dayjs from 'dayjs';

import type { TaskStatus, TaskPriority } from '@godigitify/types';

// ─── Domain types ─────────────────────────────────────────────────────────────

export type MockUser = {
  id: string;
  name: string;
  designation: string;
  avatarUrl?: string;
  initials: string;
};

export type MockDepartment = { id: string; name: string };
export type MockProject   = { id: string; name: string };

export type MockSubtask = {
  id: string;
  title: string;
  completed: boolean;
};

export type MockAttachment = {
  id: string;
  fileName: string;
  fileSize: number;      // bytes
  mimeType: string;
  isProof: boolean;
  uploadedBy: MockUser;
  createdAt: string;
};

export type MockActivityEvent = {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'STATUS_CHANGED' | 'ASSIGNED' | 'COMMENT_ADDED' | 'FILE_UPLOADED' | 'REASSIGNED';
  description: string;
  actor: MockUser;
  metadata?: { from?: string; to?: string };
  createdAt: string;
};

export type MockComment = {
  id: string;
  content: string;
  author: MockUser;
  mentions: string[];          // user ids mentioned
  createdAt: string;
  isEdited: boolean;
};

export type MockTask = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  isRecurring: boolean;
  progress: number;            // 0-100 (derived from subtasks in real API)

  department: MockDepartment;
  project: MockProject;
  creator: MockUser;
  assignee: MockUser;

  labels: string[];
  subtasks: MockSubtask[];
  attachments: MockAttachment[];
  activity: MockActivityEvent[];
  comments: MockComment[];

  /**
   * Set when this task is one independent copy of a duplicated batch
   * (FR-23 "assign to multiple people" → N single-assignee task copies
   * sharing the same batchId). Undefined for ordinary single tasks.
   */
  batchId?: string;
  batchLabel?: string;         // e.g. "Copy 1 of 6"
};

// ─── Reference data ───────────────────────────────────────────────────────────

export const MOCK_USERS = {
  rajan: {
    id: 'usr_001',
    name: 'Rajan Sharma',
    designation: 'Lab Technician',
    initials: 'RS',
  },
  akumar: {
    id: 'usr_002',
    name: 'Dr. A. Kumar',
    designation: 'Head of Physics',
    initials: 'AK',
  },
  priya: {
    id: 'usr_003',
    name: 'Priya Mehta',
    designation: 'Lab Assistant',
    initials: 'PM',
  },
  sunil: {
    id: 'usr_004',
    name: 'Sunil Verma',
    designation: 'IT Administrator',
    initials: 'SV',
  },
  nisha: {
    id: 'usr_005',
    name: 'Nisha Patel',
    designation: 'Admin Officer',
    initials: 'NP',
  },
  rsingh: {
    id: 'usr_006',
    name: 'Dr. R. Singh',
    designation: 'Head of CS',
    initials: 'RS',
  },
  anita: {
    id: 'usr_007',
    name: 'Anita Patel',
    designation: 'Senior Analyst',
    initials: 'AP',
  },
  meena: {
    id: 'usr_008',
    name: 'Meena Kulkarni',
    designation: 'Lab Assistant',
    initials: 'MK',
  },
  suresh: {
    id: 'usr_009',
    name: 'Suresh Verma',
    designation: 'Lab Technician',
    initials: 'SV',
  },
  deepa: {
    id: 'usr_010',
    name: 'Deepa Nair',
    designation: 'Analyst',
    initials: 'DN',
  },
  farhan: {
    id: 'usr_011',
    name: 'Farhan Khan',
    designation: 'Lab Assistant',
    initials: 'FK',
  },
} satisfies Record<string, MockUser>;

export const MOCK_DEPARTMENTS: MockDepartment[] = [
  { id: 'dept_01', name: 'Physics' },
  { id: 'dept_02', name: 'IT Department' },
  { id: 'dept_03', name: 'Admin Office' },
  { id: 'dept_04', name: 'Academic Office' },
  { id: 'dept_05', name: 'CS & Electronics' },
];

export const MOCK_PROJECTS: MockProject[] = [
  { id: 'proj_01', name: 'Lab Renewal 2026' },
  { id: 'proj_02', name: 'Budget Planning Q3' },
  { id: 'proj_03', name: 'Safety Compliance' },
  { id: 'proj_04', name: 'Infrastructure Upgrade' },
  { id: 'proj_05', name: 'Semester Preparation' },
  { id: 'proj_06', name: 'Annual Reporting' },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

const now = dayjs();
const past = (d: number) => now.subtract(d, 'day').toISOString();
const future = (d: number, h = 17) =>
  now.add(d, 'day').hour(h).minute(0).second(0).toISOString();

// ─── Mock Task List ───────────────────────────────────────────────────────────

export const MOCK_TASKS: MockTask[] = [
  // ─── task_001 ─────────────────────────────────────────────────────────────
  {
    id: 'task_001',
    title: 'Fix Lab Equipment Schedule for Physics Semester',
    description:
      'The lab equipment in Lab 3 and Lab 4 needs a full inspection and schedule update before the new semester starts. All instruments must be catalogued and any defects reported to the department head. Ensure compliance with safety regulations.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: future(1),
    createdAt: past(7),
    acceptedAt: past(6),
    isRecurring: false,
    progress: 60,
    department: { id: 'dept_01', name: 'Physics' },
    project: { id: 'proj_01', name: 'Lab Renewal 2026' },
    creator: MOCK_USERS.akumar,
    assignee: MOCK_USERS.rajan,
    labels: ['Lab', 'Equipment', 'Urgent'],
    subtasks: [
      { id: 'sub_001a', title: 'Inspect all equipment in Lab 3', completed: true },
      { id: 'sub_001b', title: 'Inspect all equipment in Lab 4', completed: true },
      { id: 'sub_001c', title: 'File maintenance request form', completed: true },
      { id: 'sub_001d', title: 'Update lab schedule document', completed: false },
      { id: 'sub_001e', title: 'Submit updated schedule to Dept. Head', completed: false },
    ],
    attachments: [
      {
        id: 'att_001a',
        fileName: 'equipment_list_lab3.pdf',
        fileSize: 245_000,
        mimeType: 'application/pdf',
        isProof: false,
        uploadedBy: MOCK_USERS.akumar,
        createdAt: past(7),
      },
      {
        id: 'att_001b',
        fileName: 'lab3_inspection.jpg',
        fileSize: 1_200_000,
        mimeType: 'image/jpeg',
        isProof: true,
        uploadedBy: MOCK_USERS.rajan,
        createdAt: past(2),
      },
    ],
    activity: [
      {
        id: 'act_001a',
        action: 'CREATE',
        description: 'Task was created and assigned to Rajan Sharma',
        actor: MOCK_USERS.akumar,
        createdAt: past(7),
      },
      {
        id: 'act_001b',
        action: 'ASSIGNED',
        description: 'Task assigned to Rajan Sharma',
        actor: MOCK_USERS.akumar,
        createdAt: past(7),
      },
      {
        id: 'act_001c',
        action: 'STATUS_CHANGED',
        description: 'Status changed from Pending to Accepted',
        actor: MOCK_USERS.rajan,
        metadata: { from: 'PENDING', to: 'ACCEPTED' },
        createdAt: past(6),
      },
      {
        id: 'act_001d',
        action: 'STATUS_CHANGED',
        description: 'Status changed from Accepted to In Progress',
        actor: MOCK_USERS.rajan,
        metadata: { from: 'ACCEPTED', to: 'IN_PROGRESS' },
        createdAt: past(5),
      },
      {
        id: 'act_001e',
        action: 'FILE_UPLOADED',
        description: 'Rajan Sharma uploaded "lab3_inspection.jpg"',
        actor: MOCK_USERS.rajan,
        createdAt: past(2),
      },
      {
        id: 'act_001f',
        action: 'COMMENT_ADDED',
        description: 'Dr. A. Kumar added a comment',
        actor: MOCK_USERS.akumar,
        createdAt: past(3),
      },
    ],
    comments: [
      {
        id: 'cmt_001a',
        content: 'Please prioritize the oscilloscopes in Lab 3. They are needed for the practical exam next week.',
        author: MOCK_USERS.akumar,
        mentions: [],
        createdAt: past(4),
        isEdited: false,
      },
      {
        id: 'cmt_001b',
        content: 'Understood sir. I have already inspected Lab 3 and filed the maintenance request. Will complete Lab 4 by tomorrow.',
        author: MOCK_USERS.rajan,
        mentions: [],
        createdAt: past(3),
        isEdited: false,
      },
      {
        id: 'cmt_001c',
        content: '@Rajan please upload the updated schedule document as a PDF when done for our records.',
        author: MOCK_USERS.akumar,
        mentions: ['usr_001'],
        createdAt: past(2),
        isEdited: false,
      },
    ],
  },

  // ─── task_002 ─────────────────────────────────────────────────────────────
  {
    id: 'task_002',
    title: 'Submit Department Budget Proposal Q3 2026',
    description:
      'Prepare and submit the detailed department budget proposal for Q3 2026. Include projected expenses for equipment, manpower, and training. The proposal must be reviewed by the department head before submission to the finance committee.',
    status: 'PENDING',
    priority: 'CRITICAL',
    dueDate: past(2),            // OVERDUE
    createdAt: past(10),
    isRecurring: false,
    progress: 0,
    department: { id: 'dept_03', name: 'Admin Office' },
    project: { id: 'proj_02', name: 'Budget Planning Q3' },
    creator: MOCK_USERS.nisha,
    assignee: MOCK_USERS.rajan,
    labels: ['Finance', 'Deadline'],
    subtasks: [
      { id: 'sub_002a', title: 'Collect expense data from all labs', completed: false },
      { id: 'sub_002b', title: 'Prepare draft proposal', completed: false },
      { id: 'sub_002c', title: 'Review with department head', completed: false },
      { id: 'sub_002d', title: 'Submit to finance committee', completed: false },
    ],
    attachments: [],
    activity: [
      {
        id: 'act_002a',
        action: 'CREATE',
        description: 'Task created by Nisha Patel',
        actor: MOCK_USERS.nisha,
        createdAt: past(10),
      },
      {
        id: 'act_002b',
        action: 'ASSIGNED',
        description: 'Task assigned to Rajan Sharma',
        actor: MOCK_USERS.nisha,
        createdAt: past(10),
      },
    ],
    comments: [
      {
        id: 'cmt_002a',
        content: 'This is urgent. The finance committee meets next Thursday. Please ensure the proposal is ready at least 2 days before.',
        author: MOCK_USERS.nisha,
        mentions: ['usr_001'],
        createdAt: past(8),
        isEdited: false,
      },
    ],
  },

  // ─── task_003 ─────────────────────────────────────────────────────────────
  {
    id: 'task_003',
    title: 'Prepare Lab Safety Compliance Report',
    description:
      'Conduct a full safety audit of all physics laboratories and prepare a compliance report as per the NAAC standards. Document all fire exits, emergency equipment, and safety protocols currently in place.',
    status: 'ACCEPTED',
    priority: 'MEDIUM',
    dueDate: future(3, 14),
    createdAt: past(5),
    acceptedAt: past(4),
    isRecurring: false,
    progress: 20,
    department: { id: 'dept_01', name: 'Physics' },
    project: { id: 'proj_03', name: 'Safety Compliance' },
    creator: MOCK_USERS.akumar,
    assignee: MOCK_USERS.rajan,
    labels: ['Safety', 'NAAC', 'Audit'],
    subtasks: [
      { id: 'sub_003a', title: 'Inspect Lab 1 safety equipment', completed: true },
      { id: 'sub_003b', title: 'Inspect Lab 2 safety equipment', completed: false },
      { id: 'sub_003c', title: 'Inspect Lab 3 safety equipment', completed: false },
      { id: 'sub_003d', title: 'Prepare compliance document', completed: false },
    ],
    attachments: [],
    activity: [
      {
        id: 'act_003a',
        action: 'CREATE',
        description: 'Task created by Dr. A. Kumar',
        actor: MOCK_USERS.akumar,
        createdAt: past(5),
      },
      {
        id: 'act_003b',
        action: 'STATUS_CHANGED',
        description: 'Status changed from Pending to Accepted',
        actor: MOCK_USERS.rajan,
        metadata: { from: 'PENDING', to: 'ACCEPTED' },
        createdAt: past(4),
      },
    ],
    comments: [],
  },

  // ─── task_004 ─────────────────────────────────────────────────────────────
  {
    id: 'task_004',
    title: 'Coordinate with IT for Server Room Access Renewal',
    description:
      'The access cards for the server room need to be renewed for all Physics department staff. Coordinate with the IT team to schedule a convenient time and collect the necessary forms.',
    status: 'PENDING',
    priority: 'LOW',
    dueDate: future(5, 10),
    createdAt: past(3),
    isRecurring: false,
    progress: 0,
    department: { id: 'dept_02', name: 'IT Department' },
    project: { id: 'proj_04', name: 'Infrastructure Upgrade' },
    creator: MOCK_USERS.sunil,
    assignee: MOCK_USERS.rajan,
    labels: ['IT', 'Access'],
    subtasks: [
      { id: 'sub_004a', title: 'Collect staff list from Physics Dept.', completed: false },
      { id: 'sub_004b', title: 'Submit access renewal form to IT', completed: false },
      { id: 'sub_004c', title: 'Collect renewed access cards', completed: false },
    ],
    attachments: [],
    activity: [
      {
        id: 'act_004a',
        action: 'CREATE',
        description: 'Task created by Sunil Verma',
        actor: MOCK_USERS.sunil,
        createdAt: past(3),
      },
    ],
    comments: [],
  },

  // ─── task_005 ─────────────────────────────────────────────────────────────
  {
    id: 'task_005',
    title: 'Review Examination Timetable for July 2026 Batch',
    description:
      'Review the proposed examination timetable for the July 2026 batch and provide feedback on scheduling conflicts. Coordinate with other departments for shared laboratory slots.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: future(6, 16),
    createdAt: past(4),
    acceptedAt: past(3),
    isRecurring: false,
    progress: 40,
    department: { id: 'dept_04', name: 'Academic Office' },
    project: { id: 'proj_05', name: 'Semester Preparation' },
    creator: MOCK_USERS.akumar,
    assignee: MOCK_USERS.rajan,
    labels: ['Exams', 'Scheduling'],
    subtasks: [
      { id: 'sub_005a', title: 'Review Physics paper schedule', completed: true },
      { id: 'sub_005b', title: 'Check lab slot conflicts', completed: true },
      { id: 'sub_005c', title: 'Coordinate with CS department', completed: false },
      { id: 'sub_005d', title: 'Submit final feedback', completed: false },
    ],
    attachments: [
      {
        id: 'att_005a',
        fileName: 'timetable_draft_july2026.pdf',
        fileSize: 380_000,
        mimeType: 'application/pdf',
        isProof: false,
        uploadedBy: MOCK_USERS.akumar,
        createdAt: past(4),
      },
    ],
    activity: [
      {
        id: 'act_005a',
        action: 'CREATE',
        description: 'Task created by Dr. A. Kumar',
        actor: MOCK_USERS.akumar,
        createdAt: past(4),
      },
      {
        id: 'act_005b',
        action: 'STATUS_CHANGED',
        description: 'Status changed from Pending to Accepted',
        actor: MOCK_USERS.rajan,
        metadata: { from: 'PENDING', to: 'ACCEPTED' },
        createdAt: past(3),
      },
      {
        id: 'act_005c',
        action: 'STATUS_CHANGED',
        description: 'Status changed from Accepted to In Progress',
        actor: MOCK_USERS.rajan,
        metadata: { from: 'ACCEPTED', to: 'IN_PROGRESS' },
        createdAt: past(2),
      },
    ],
    comments: [],
  },

  // ─── task_006 ─────────────────────────────────────────────────────────────
  {
    id: 'task_006',
    title: 'Student Attendance Report — May 2026',
    description:
      'Compile the monthly student attendance report for May 2026 and submit to the academic office. Include subject-wise attendance breakdowns and flag students below 75%.',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    dueDate: past(5),
    createdAt: past(15),
    acceptedAt: past(14),
    completedAt: past(6),
    isRecurring: true,
    progress: 100,
    department: { id: 'dept_01', name: 'Physics' },
    project: { id: 'proj_06', name: 'Annual Reporting' },
    creator: MOCK_USERS.akumar,
    assignee: MOCK_USERS.rajan,
    labels: ['Report', 'Attendance', 'Monthly'],
    subtasks: [
      { id: 'sub_006a', title: 'Extract attendance data from portal', completed: true },
      { id: 'sub_006b', title: 'Prepare subject-wise breakdown', completed: true },
      { id: 'sub_006c', title: 'Flag defaulters (<75%)', completed: true },
      { id: 'sub_006d', title: 'Submit to academic office', completed: true },
    ],
    attachments: [
      {
        id: 'att_006a',
        fileName: 'attendance_may2026_proof.pdf',
        fileSize: 520_000,
        mimeType: 'application/pdf',
        isProof: true,
        uploadedBy: MOCK_USERS.rajan,
        createdAt: past(6),
      },
    ],
    activity: [
      {
        id: 'act_006a',
        action: 'CREATE',
        description: 'Task created by Dr. A. Kumar',
        actor: MOCK_USERS.akumar,
        createdAt: past(15),
      },
      {
        id: 'act_006b',
        action: 'STATUS_CHANGED',
        description: 'Status changed from Pending to Accepted',
        actor: MOCK_USERS.rajan,
        metadata: { from: 'PENDING', to: 'ACCEPTED' },
        createdAt: past(14),
      },
      {
        id: 'act_006c',
        action: 'STATUS_CHANGED',
        description: 'Status changed from Accepted to In Progress',
        actor: MOCK_USERS.rajan,
        metadata: { from: 'ACCEPTED', to: 'IN_PROGRESS' },
        createdAt: past(10),
      },
      {
        id: 'act_006d',
        action: 'STATUS_CHANGED',
        description: 'Status changed from In Progress to Under Review',
        actor: MOCK_USERS.rajan,
        metadata: { from: 'IN_PROGRESS', to: 'UNDER_REVIEW' },
        createdAt: past(7),
      },
      {
        id: 'act_006e',
        action: 'STATUS_CHANGED',
        description: 'Status changed from Under Review to Completed',
        actor: MOCK_USERS.akumar,
        metadata: { from: 'UNDER_REVIEW', to: 'COMPLETED' },
        createdAt: past(6),
      },
    ],
    comments: [
      {
        id: 'cmt_006a',
        content: 'Excellent work Rajan. The report is comprehensive and well-formatted. Approved.',
        author: MOCK_USERS.akumar,
        mentions: ['usr_001'],
        createdAt: past(6),
        isEdited: false,
      },
    ],
  },

  // ─── task_007 ─────────────────────────────────────────────────────────────
  {
    id: 'task_007',
    title: 'Network Infrastructure Audit — Physics Wing',
    description:
      'Conduct a full audit of the network infrastructure in the Physics department wing. Document all access points, cables, and switches. Identify any bottlenecks or outdated equipment.',
    status: 'UNDER_REVIEW',
    priority: 'HIGH',
    dueDate: past(1),
    createdAt: past(12),
    acceptedAt: past(11),
    isRecurring: false,
    progress: 90,
    department: { id: 'dept_02', name: 'IT Department' },
    project: { id: 'proj_04', name: 'Infrastructure Upgrade' },
    creator: MOCK_USERS.sunil,
    assignee: MOCK_USERS.rajan,
    labels: ['Network', 'Audit', 'IT'],
    subtasks: [
      { id: 'sub_007a', title: 'Map all network access points', completed: true },
      { id: 'sub_007b', title: 'Document cable infrastructure', completed: true },
      { id: 'sub_007c', title: 'Test connection speeds', completed: true },
      { id: 'sub_007d', title: 'Prepare audit report', completed: true },
      { id: 'sub_007e', title: 'Submit for IT team review', completed: false },
    ],
    attachments: [
      {
        id: 'att_007a',
        fileName: 'network_audit_report.pdf',
        fileSize: 1_840_000,
        mimeType: 'application/pdf',
        isProof: true,
        uploadedBy: MOCK_USERS.rajan,
        createdAt: past(2),
      },
    ],
    activity: [
      {
        id: 'act_007a',
        action: 'CREATE',
        description: 'Task created by Sunil Verma',
        actor: MOCK_USERS.sunil,
        createdAt: past(12),
      },
      {
        id: 'act_007b',
        action: 'STATUS_CHANGED',
        description: 'Status changed to In Progress',
        actor: MOCK_USERS.rajan,
        metadata: { from: 'PENDING', to: 'IN_PROGRESS' },
        createdAt: past(10),
      },
      {
        id: 'act_007c',
        action: 'STATUS_CHANGED',
        description: 'Status changed to Under Review',
        actor: MOCK_USERS.rajan,
        metadata: { from: 'IN_PROGRESS', to: 'UNDER_REVIEW' },
        createdAt: past(2),
      },
    ],
    comments: [
      {
        id: 'cmt_007a',
        content: 'Good work. Reviewing the report now. Will get back to you by EOD.',
        author: MOCK_USERS.sunil,
        mentions: [],
        createdAt: past(1),
        isEdited: false,
      },
    ],
  },

  // ─── task_008 ─────────────────────────────────────────────────────────────
  {
    id: 'task_008',
    title: 'Physics Lab Equipment Inventory 2026',
    description:
      'Conduct a complete inventory of all equipment across Physics department labs. Each item must be tagged with its current condition, last service date, and replacement timeline.',
    status: 'PENDING',
    priority: 'CRITICAL',
    dueDate: past(3),            // OVERDUE
    createdAt: past(14),
    isRecurring: false,
    progress: 0,
    department: { id: 'dept_01', name: 'Physics' },
    project: { id: 'proj_01', name: 'Lab Renewal 2026' },
    creator: MOCK_USERS.akumar,
    assignee: MOCK_USERS.rajan,
    labels: ['Inventory', 'Critical', 'Equipment'],
    subtasks: [
      { id: 'sub_008a', title: 'Inventory Lab 1', completed: false },
      { id: 'sub_008b', title: 'Inventory Lab 2', completed: false },
      { id: 'sub_008c', title: 'Inventory Lab 3', completed: false },
      { id: 'sub_008d', title: 'Compile master inventory sheet', completed: false },
    ],
    attachments: [],
    activity: [
      {
        id: 'act_008a',
        action: 'CREATE',
        description: 'Task created by Dr. A. Kumar',
        actor: MOCK_USERS.akumar,
        createdAt: past(14),
      },
    ],
    comments: [
      {
        id: 'cmt_008a',
        content: 'This is already overdue! Please start immediately @Rajan.',
        author: MOCK_USERS.akumar,
        mentions: ['usr_001'],
        createdAt: past(1),
        isEdited: false,
      },
    ],
  },

  // ─── task_009 ─────────────────────────────────────────────────────────────
  {
    id: 'task_009',
    title: 'Annual Report Submission — Physics Department',
    description:
      'Compile and submit the annual report for the Physics department covering academic year 2025-26. Include research output, student performance, and lab upgrades.',
    status: 'PENDING',
    priority: 'HIGH',
    dueDate: future(10, 12),
    createdAt: past(2),
    isRecurring: false,
    progress: 0,
    department: { id: 'dept_01', name: 'Physics' },
    project: { id: 'proj_06', name: 'Annual Reporting' },
    creator: MOCK_USERS.akumar,
    assignee: MOCK_USERS.rajan,
    labels: ['Annual Report', 'Documentation'],
    subtasks: [],
    attachments: [],
    activity: [
      {
        id: 'act_009a',
        action: 'CREATE',
        description: 'Task created by Dr. A. Kumar',
        actor: MOCK_USERS.akumar,
        createdAt: past(2),
      },
    ],
    comments: [],
  },

  // ─── task_010 ─────────────────────────────────────────────────────────────
  {
    id: 'task_010',
    title: 'Emergency Exit Safety Inspection — All Labs',
    description:
      'Inspect all emergency exits across the Physics department for compliance with fire safety norms. Ensure all exit signs are lit, paths are unobstructed, and fire extinguishers are within expiry.',
    status: 'IN_PROGRESS',
    priority: 'CRITICAL',
    dueDate: future(0, 18),     // Due today
    createdAt: past(5),
    acceptedAt: past(4),
    isRecurring: false,
    progress: 50,
    department: { id: 'dept_03', name: 'Admin Office' },
    project: { id: 'proj_03', name: 'Safety Compliance' },
    creator: MOCK_USERS.nisha,
    assignee: MOCK_USERS.rajan,
    labels: ['Safety', 'Fire', 'Urgent'],
    subtasks: [
      { id: 'sub_010a', title: 'Inspect Lab 1 exit', completed: true },
      { id: 'sub_010b', title: 'Inspect Lab 2 exit', completed: true },
      { id: 'sub_010c', title: 'Inspect Lab 3 exit', completed: false },
      { id: 'sub_010d', title: 'Inspect Lab 4 exit', completed: false },
    ],
    attachments: [],
    activity: [
      {
        id: 'act_010a',
        action: 'CREATE',
        description: 'Task created by Nisha Patel',
        actor: MOCK_USERS.nisha,
        createdAt: past(5),
      },
      {
        id: 'act_010b',
        action: 'STATUS_CHANGED',
        description: 'Status changed to In Progress',
        actor: MOCK_USERS.rajan,
        metadata: { from: 'PENDING', to: 'IN_PROGRESS' },
        createdAt: past(3),
      },
    ],
    comments: [],
  },

  // ─── task_011 ─────────────────────────────────────────────────────────────
  {
    id: 'task_011',
    title: 'Library Resource Procurement — Science Section',
    description:
      'Identify and procure recommended textbooks and reference materials for the science section of the college library for the 2026-27 academic year.',
    status: 'COMPLETED',
    priority: 'LOW',
    dueDate: past(8),
    createdAt: past(20),
    acceptedAt: past(19),
    completedAt: past(9),
    isRecurring: false,
    progress: 100,
    department: { id: 'dept_04', name: 'Academic Office' },
    project: { id: 'proj_06', name: 'Annual Reporting' },
    creator: MOCK_USERS.rsingh,
    assignee: MOCK_USERS.rajan,
    labels: ['Library', 'Procurement'],
    subtasks: [
      { id: 'sub_011a', title: 'Collect reading list from faculty', completed: true },
      { id: 'sub_011b', title: 'Get quotations from vendors', completed: true },
      { id: 'sub_011c', title: 'Submit purchase order', completed: true },
    ],
    attachments: [
      {
        id: 'att_011a',
        fileName: 'book_list_approved.pdf',
        fileSize: 290_000,
        mimeType: 'application/pdf',
        isProof: true,
        uploadedBy: MOCK_USERS.rajan,
        createdAt: past(9),
      },
    ],
    activity: [
      {
        id: 'act_011a',
        action: 'CREATE',
        description: 'Task created by Dr. R. Singh',
        actor: MOCK_USERS.rsingh,
        createdAt: past(20),
      },
      {
        id: 'act_011b',
        action: 'STATUS_CHANGED',
        description: 'Status changed to Completed',
        actor: MOCK_USERS.rsingh,
        metadata: { from: 'UNDER_REVIEW', to: 'COMPLETED' },
        createdAt: past(9),
      },
    ],
    comments: [],
  },

  // ─── task_013 ─────────────────────────────────────────────────────────────
  {
    id: 'task_013',
    title: 'Monthly Safety Inspection Report — Physics Labs',
    description:
      'Conduct the monthly inspection of all Physics department laboratory safety equipment including fire extinguishers, emergency exits, chemical storage, and PPE availability. Generate a detailed compliance report.',
    status: 'UNDER_REVIEW',
    priority: 'CRITICAL',
    dueDate: past(1),
    createdAt: past(10),
    acceptedAt: past(9),
    isRecurring: true,
    progress: 95,
    department: { id: 'dept_01', name: 'Physics' },
    project: { id: 'proj_03', name: 'Safety Compliance' },
    creator: MOCK_USERS.akumar,
    assignee: MOCK_USERS.priya,
    labels: ['Safety', 'Inspection', 'Compliance'],
    subtasks: [
      { id: 'sub_013a', title: 'Inspect fire extinguishers', completed: true },
      { id: 'sub_013b', title: 'Check emergency exit signage', completed: true },
      { id: 'sub_013c', title: 'Audit PPE stock', completed: true },
      { id: 'sub_013d', title: 'Document findings in report', completed: true },
      { id: 'sub_013e', title: 'Submit report to department head', completed: false },
    ],
    attachments: [
      {
        id: 'att_013a',
        fileName: 'safety_inspection_july.pdf',
        fileSize: 2_100_000,
        mimeType: 'application/pdf',
        isProof: true,
        uploadedBy: MOCK_USERS.priya,
        createdAt: past(1),
      },
      {
        id: 'att_013b',
        fileName: 'lab_photos_july.zip',
        fileSize: 5_400_000,
        mimeType: 'application/zip',
        isProof: true,
        uploadedBy: MOCK_USERS.priya,
        createdAt: past(1),
      },
    ],
    activity: [
      {
        id: 'act_013a',
        action: 'CREATE',
        description: 'Task created by Arjun Kumar',
        actor: MOCK_USERS.akumar,
        createdAt: past(10),
      },
      {
        id: 'act_013b',
        action: 'STATUS_CHANGED',
        description: 'Status changed to In Progress',
        actor: MOCK_USERS.priya,
        metadata: { from: 'ACCEPTED', to: 'IN_PROGRESS' },
        createdAt: past(5),
      },
      {
        id: 'act_013c',
        action: 'STATUS_CHANGED',
        description: 'Status changed to Under Review',
        actor: MOCK_USERS.priya,
        metadata: { from: 'IN_PROGRESS', to: 'UNDER_REVIEW' },
        createdAt: past(1),
      },
    ],
    comments: [
      {
        id: 'cmt_013a',
        content: 'Completed the full inspection. Report and photos attached for your review.',
        author: MOCK_USERS.priya,
        mentions: [],
        createdAt: past(1),
        isEdited: false,
      },
    ],
  },

  // ─── task_014 ─────────────────────────────────────────────────────────────
  {
    id: 'task_014',
    title: 'Student Lab Access Database Update',
    description:
      'Update the student lab access database with new semester enrollment data. Revoke access for students who have completed the module and grant access for new enrollees. Verify entries with the registrar.',
    status: 'UNDER_REVIEW',
    priority: 'HIGH',
    dueDate: future(1, 17),
    createdAt: past(4),
    acceptedAt: past(3),
    isRecurring: false,
    progress: 88,
    department: { id: 'dept_01', name: 'Physics' },
    project: { id: 'proj_01', name: 'Lab Renewal 2026' },
    creator: MOCK_USERS.akumar,
    assignee: MOCK_USERS.rajan,
    labels: ['Database', 'Admin', 'Access Control'],
    subtasks: [
      { id: 'sub_014a', title: 'Export current access list', completed: true },
      { id: 'sub_014b', title: 'Cross-check with registrar data', completed: true },
      { id: 'sub_014c', title: 'Revoke expired access entries', completed: true },
      { id: 'sub_014d', title: 'Add new semester enrollees', completed: true },
      { id: 'sub_014e', title: 'Final verification pass', completed: false },
    ],
    attachments: [
      {
        id: 'att_014a',
        fileName: 'access_db_update_v2.xlsx',
        fileSize: 380_000,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        isProof: true,
        uploadedBy: MOCK_USERS.rajan,
        createdAt: past(0),
      },
    ],
    activity: [
      {
        id: 'act_014a',
        action: 'CREATE',
        description: 'Task created by Arjun Kumar',
        actor: MOCK_USERS.akumar,
        createdAt: past(4),
      },
      {
        id: 'act_014b',
        action: 'STATUS_CHANGED',
        description: 'Status changed to Under Review',
        actor: MOCK_USERS.rajan,
        metadata: { from: 'IN_PROGRESS', to: 'UNDER_REVIEW' },
        createdAt: past(0),
      },
    ],
    comments: [],
  },

  // ─── task_015 ─────────────────────────────────────────────────────────────
  {
    id: 'task_015',
    title: 'Semester Equipment Inventory — Lab 3 & Lab 4',
    description:
      'Compile a full inventory of all scientific equipment in Lab 3 and Lab 4 for the upcoming semester. Record serial numbers, condition status, and flag any items requiring maintenance or replacement.',
    status: 'UNDER_REVIEW',
    priority: 'MEDIUM',
    dueDate: future(2, 14),
    createdAt: past(6),
    acceptedAt: past(5),
    isRecurring: false,
    progress: 100,
    department: { id: 'dept_01', name: 'Physics' },
    project: { id: 'proj_01', name: 'Lab Renewal 2026' },
    creator: MOCK_USERS.akumar,
    assignee: MOCK_USERS.priya,
    labels: ['Inventory', 'Equipment', 'Lab'],
    subtasks: [
      { id: 'sub_015a', title: 'Inventory Lab 3 equipment', completed: true },
      { id: 'sub_015b', title: 'Inventory Lab 4 equipment', completed: true },
      { id: 'sub_015c', title: 'Flag maintenance items', completed: true },
      { id: 'sub_015d', title: 'Submit inventory sheet', completed: true },
    ],
    attachments: [],
    activity: [
      {
        id: 'act_015a',
        action: 'CREATE',
        description: 'Task created by Arjun Kumar',
        actor: MOCK_USERS.akumar,
        createdAt: past(6),
      },
      {
        id: 'act_015b',
        action: 'STATUS_CHANGED',
        description: 'Status changed to Under Review',
        actor: MOCK_USERS.priya,
        metadata: { from: 'IN_PROGRESS', to: 'UNDER_REVIEW' },
        createdAt: past(1),
      },
    ],
    comments: [
      {
        id: 'cmt_015a',
        content: 'All items catalogued. Lab 3 has 2 oscilloscopes that need calibration — flagged in the sheet.',
        author: MOCK_USERS.priya,
        mentions: [],
        createdAt: past(1),
        isEdited: false,
      },
    ],
  },

  // ─── task_012 ─────────────────────────────────────────────────────────────
  {
    id: 'task_012',
    title: 'Staff Training Schedule — Lab Safety Protocols',
    description:
      'Organize and schedule mandatory lab safety protocol training sessions for all Physics department staff. Coordinate with the HR department for logistics.',
    status: 'ACCEPTED',
    priority: 'MEDIUM',
    dueDate: future(7, 15),
    createdAt: past(6),
    acceptedAt: past(5),
    isRecurring: false,
    progress: 10,
    department: { id: 'dept_01', name: 'Physics' },
    project: { id: 'proj_03', name: 'Safety Compliance' },
    creator: MOCK_USERS.nisha,
    assignee: MOCK_USERS.rajan,
    labels: ['Training', 'HR', 'Safety'],
    subtasks: [
      { id: 'sub_012a', title: 'Identify training vendor', completed: true },
      { id: 'sub_012b', title: 'Confirm dates with staff', completed: false },
      { id: 'sub_012c', title: 'Book training venue', completed: false },
      { id: 'sub_012d', title: 'Share invite with all staff', completed: false },
    ],
    attachments: [],
    activity: [
      {
        id: 'act_012a',
        action: 'CREATE',
        description: 'Task created by Nisha Patel',
        actor: MOCK_USERS.nisha,
        createdAt: past(6),
      },
      {
        id: 'act_012b',
        action: 'STATUS_CHANGED',
        description: 'Status changed to Accepted',
        actor: MOCK_USERS.rajan,
        metadata: { from: 'PENDING', to: 'ACCEPTED' },
        createdAt: past(5),
      },
    ],
    comments: [],
  },

  // ─── batch_001 — Fire-Drill Compliance Check (duplicated to 6 people) ──────
  // Admin duplicated one task across the Physics team (FR-23). Each person
  // gets an independent, private copy — tracked together via Batch Progress.
  {
    id: 'task_016',
    title: 'Fire-Drill Compliance Check',
    description:
      'Run the scheduled fire-drill for your section of the Physics building. Record evacuation time, confirm the muster point headcount, and attach the signed log plus photo evidence.',
    status: 'UNDER_REVIEW',
    priority: 'MEDIUM',
    dueDate: future(2, 17),
    createdAt: past(3),
    acceptedAt: past(3),
    isRecurring: false,
    progress: 90,
    department: { id: 'dept_01', name: 'Physics' },
    project: { id: 'proj_03', name: 'Safety Compliance' },
    creator: MOCK_USERS.akumar,
    assignee: MOCK_USERS.rajan,
    labels: ['Safety', 'Fire Drill'],
    subtasks: [
      { id: 'sub_016a', title: 'Run evacuation drill', completed: true },
      { id: 'sub_016b', title: 'Confirm muster point headcount', completed: true },
      { id: 'sub_016c', title: 'Submit signed log + photos', completed: true },
    ],
    attachments: [
      { id: 'att_016a', fileName: 'firedrill_log_signed.pdf', fileSize: 310_000, mimeType: 'application/pdf', isProof: true, uploadedBy: MOCK_USERS.rajan, createdAt: past(0) },
      { id: 'att_016b', fileName: 'muster_point.jpg', fileSize: 980_000, mimeType: 'image/jpeg', isProof: true, uploadedBy: MOCK_USERS.rajan, createdAt: past(0) },
      { id: 'att_016c', fileName: 'wiring_fix.jpg', fileSize: 1_050_000, mimeType: 'image/jpeg', isProof: true, uploadedBy: MOCK_USERS.rajan, createdAt: past(0) },
    ],
    activity: [
      { id: 'act_016a', action: 'CREATE', description: 'Task duplicated to 6 people and assigned to Rajan Sharma', actor: MOCK_USERS.akumar, createdAt: past(3) },
      { id: 'act_016b', action: 'STATUS_CHANGED', description: 'Status changed to Under Review', actor: MOCK_USERS.rajan, metadata: { from: 'IN_PROGRESS', to: 'UNDER_REVIEW' }, createdAt: past(0) },
    ],
    comments: [
      {
        id: 'cmt_016a',
        content: 'Drill completed at 11:40 AM, full evacuation in 4m 20s. Photos of muster point and the signed log attached.',
        author: MOCK_USERS.rajan,
        mentions: [],
        createdAt: past(0),
        isEdited: false,
      },
    ],
    batchId: 'batch_001',
    batchLabel: 'Copy 1 of 6',
  },
  {
    id: 'task_017',
    title: 'Fire-Drill Compliance Check',
    description:
      'Run the scheduled fire-drill for your section of the Physics building. Record evacuation time, confirm the muster point headcount, and attach the signed log plus photo evidence.',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    dueDate: future(2, 17),
    createdAt: past(3),
    acceptedAt: past(3),
    completedAt: past(1),
    isRecurring: false,
    progress: 100,
    department: { id: 'dept_01', name: 'Physics' },
    project: { id: 'proj_03', name: 'Safety Compliance' },
    creator: MOCK_USERS.akumar,
    assignee: MOCK_USERS.anita,
    labels: ['Safety', 'Fire Drill'],
    subtasks: [
      { id: 'sub_017a', title: 'Run evacuation drill', completed: true },
      { id: 'sub_017b', title: 'Confirm muster point headcount', completed: true },
      { id: 'sub_017c', title: 'Submit signed log + photos', completed: true },
    ],
    attachments: [
      { id: 'att_017a', fileName: 'firedrill_log_signed.pdf', fileSize: 298_000, mimeType: 'application/pdf', isProof: true, uploadedBy: MOCK_USERS.anita, createdAt: past(1) },
    ],
    activity: [
      { id: 'act_017a', action: 'CREATE', description: 'Task duplicated to 6 people and assigned to Anita Patel', actor: MOCK_USERS.akumar, createdAt: past(3) },
      { id: 'act_017b', action: 'STATUS_CHANGED', description: 'Approved and marked as completed', actor: MOCK_USERS.akumar, metadata: { from: 'UNDER_REVIEW', to: 'COMPLETED' }, createdAt: past(1) },
    ],
    comments: [],
    batchId: 'batch_001',
    batchLabel: 'Copy 2 of 6',
  },
  {
    id: 'task_018',
    title: 'Fire-Drill Compliance Check',
    description:
      'Run the scheduled fire-drill for your section of the Physics building. Record evacuation time, confirm the muster point headcount, and attach the signed log plus photo evidence.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: future(2, 17),
    createdAt: past(3),
    acceptedAt: past(2),
    isRecurring: false,
    progress: 40,
    department: { id: 'dept_01', name: 'Physics' },
    project: { id: 'proj_03', name: 'Safety Compliance' },
    creator: MOCK_USERS.akumar,
    assignee: MOCK_USERS.meena,
    labels: ['Safety', 'Fire Drill'],
    subtasks: [
      { id: 'sub_018a', title: 'Run evacuation drill', completed: true },
      { id: 'sub_018b', title: 'Confirm muster point headcount', completed: false },
      { id: 'sub_018c', title: 'Submit signed log + photos', completed: false },
    ],
    attachments: [
      { id: 'att_018a', fileName: 'evacuation_photo.jpg', fileSize: 870_000, mimeType: 'image/jpeg', isProof: true, uploadedBy: MOCK_USERS.meena, createdAt: past(1) },
    ],
    activity: [
      { id: 'act_018a', action: 'CREATE', description: 'Task duplicated to 6 people and assigned to Meena Kulkarni', actor: MOCK_USERS.akumar, createdAt: past(3) },
      { id: 'act_018b', action: 'STATUS_CHANGED', description: 'Status changed to Accepted', actor: MOCK_USERS.meena, metadata: { from: 'PENDING', to: 'ACCEPTED' }, createdAt: past(2) },
    ],
    comments: [],
    batchId: 'batch_001',
    batchLabel: 'Copy 3 of 6',
  },
  {
    id: 'task_019',
    title: 'Fire-Drill Compliance Check',
    description:
      'Run the scheduled fire-drill for your section of the Physics building. Record evacuation time, confirm the muster point headcount, and attach the signed log plus photo evidence.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: future(2, 17),
    createdAt: past(3),
    acceptedAt: past(2),
    isRecurring: false,
    progress: 20,
    department: { id: 'dept_01', name: 'Physics' },
    project: { id: 'proj_03', name: 'Safety Compliance' },
    creator: MOCK_USERS.akumar,
    assignee: MOCK_USERS.suresh,
    labels: ['Safety', 'Fire Drill'],
    subtasks: [
      { id: 'sub_019a', title: 'Run evacuation drill', completed: true },
      { id: 'sub_019b', title: 'Confirm muster point headcount', completed: false },
      { id: 'sub_019c', title: 'Submit signed log + photos', completed: false },
    ],
    attachments: [],
    activity: [
      { id: 'act_019a', action: 'CREATE', description: 'Task duplicated to 6 people and assigned to Suresh Verma', actor: MOCK_USERS.akumar, createdAt: past(3) },
      { id: 'act_019b', action: 'STATUS_CHANGED', description: 'Status changed to Accepted', actor: MOCK_USERS.suresh, metadata: { from: 'PENDING', to: 'ACCEPTED' }, createdAt: past(2) },
    ],
    comments: [],
    batchId: 'batch_001',
    batchLabel: 'Copy 4 of 6',
  },
  {
    id: 'task_020',
    title: 'Fire-Drill Compliance Check',
    description:
      'Run the scheduled fire-drill for your section of the Physics building. Record evacuation time, confirm the muster point headcount, and attach the signed log plus photo evidence.',
    status: 'PENDING',
    priority: 'MEDIUM',
    dueDate: future(2, 17),
    createdAt: past(3),
    isRecurring: false,
    progress: 0,
    department: { id: 'dept_01', name: 'Physics' },
    project: { id: 'proj_03', name: 'Safety Compliance' },
    creator: MOCK_USERS.akumar,
    assignee: MOCK_USERS.deepa,
    labels: ['Safety', 'Fire Drill'],
    subtasks: [
      { id: 'sub_020a', title: 'Run evacuation drill', completed: false },
      { id: 'sub_020b', title: 'Confirm muster point headcount', completed: false },
      { id: 'sub_020c', title: 'Submit signed log + photos', completed: false },
    ],
    attachments: [],
    activity: [
      { id: 'act_020a', action: 'CREATE', description: 'Task duplicated to 6 people and assigned to Deepa Nair', actor: MOCK_USERS.akumar, createdAt: past(3) },
    ],
    comments: [],
    batchId: 'batch_001',
    batchLabel: 'Copy 5 of 6',
  },
  {
    id: 'task_021',
    title: 'Fire-Drill Compliance Check',
    description:
      'Run the scheduled fire-drill for your section of the Physics building. Record evacuation time, confirm the muster point headcount, and attach the signed log plus photo evidence.',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    dueDate: future(2, 17),
    createdAt: past(3),
    acceptedAt: past(3),
    completedAt: past(0),
    isRecurring: false,
    progress: 100,
    department: { id: 'dept_01', name: 'Physics' },
    project: { id: 'proj_03', name: 'Safety Compliance' },
    creator: MOCK_USERS.akumar,
    assignee: MOCK_USERS.farhan,
    labels: ['Safety', 'Fire Drill'],
    subtasks: [
      { id: 'sub_021a', title: 'Run evacuation drill', completed: true },
      { id: 'sub_021b', title: 'Confirm muster point headcount', completed: true },
      { id: 'sub_021c', title: 'Submit signed log + photos', completed: true },
    ],
    attachments: [
      { id: 'att_021a', fileName: 'firedrill_log_signed.pdf', fileSize: 305_000, mimeType: 'application/pdf', isProof: true, uploadedBy: MOCK_USERS.farhan, createdAt: past(0) },
    ],
    activity: [
      { id: 'act_021a', action: 'CREATE', description: 'Task duplicated to 6 people and assigned to Farhan Khan', actor: MOCK_USERS.akumar, createdAt: past(3) },
      { id: 'act_021b', action: 'STATUS_CHANGED', description: 'Approved and marked as completed', actor: MOCK_USERS.akumar, metadata: { from: 'UNDER_REVIEW', to: 'COMPLETED' }, createdAt: past(0) },
    ],
    comments: [],
    batchId: 'batch_001',
    batchLabel: 'Copy 6 of 6',
  },
];

// ─── Computed helpers (used by hooks) ────────────────────────────────────────

export const isTaskOverdue = (task: MockTask): boolean =>
  !['COMPLETED', 'CANCELLED'].includes(task.status) &&
  dayjs(task.dueDate).isBefore(dayjs());

export const isTaskDueToday = (task: MockTask): boolean =>
  dayjs(task.dueDate).isSame(dayjs(), 'day');

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};
