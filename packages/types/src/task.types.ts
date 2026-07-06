export type TaskStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'COMPLETED'
  | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export type RecurringConfig = {
  frequency: RecurringFrequency;
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: string;
  lastCreatedAt?: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isRecurring: boolean;
  recurringConfig?: RecurringConfig;
  parentTaskId?: string;
  isDeleted: boolean;
  creatorId: string;
  assigneeId: string;
  departmentId?: string;
  batchId?: string;
  isGovernance: boolean;
  acceptedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskFilters = {
  status?: TaskStatus;
  priority?: TaskPriority;
  departmentId?: string;
  assigneeId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'title';
  order?: 'asc' | 'desc';
  dueAfter?: string;
  dueBefore?: string;
  batchId?: string;
  isGovernance?: boolean;
};

/** Shape returned by the API for task lists — nested creator, assignee, department included */
export type RichTask = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isRecurring: boolean;
  recurringConfig?: unknown;
  parentTaskId?: string | null;
  isDeleted: boolean;
  creatorId: string;
  assigneeId: string;
  departmentId?: string | null;
  batchId?: string | null;
  isGovernance: boolean;
  acceptedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  creator: { id: string; name: string; avatarUrl?: string | null };
  assignee: { id: string; name: string; avatarUrl?: string | null };
  department?: { id: string; name: string; code: string } | null;
  _count: { comments: number; attachments: number };
};

export type UpdateTaskStatusDto = {
  status: TaskStatus;
  comment?: string;
};

export type CreateTaskDto = {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string;
  departmentId?: string;
  isRecurring?: boolean;
  recurringConfig?: RecurringConfig;
};

export type TaskCommentAuthor = { id: string; name: string; avatarUrl?: string | null };

export type TaskComment = {
  id: string;
  content: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt?: string;
  author: TaskCommentAuthor;
};

export type TaskActivityAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_CHANGED'
  | 'ROLE_CHANGED'
  | 'STATUS_CHANGED'
  | 'ASSIGNED'
  | 'REASSIGNED';

export type TaskActivityEvent = {
  id: string;
  action: TaskActivityAction;
  description: string;
  metadata?: { from?: string; to?: string; revisionNote?: string } | null;
  createdAt: string;
  actor: { id: string; name: string; avatarUrl?: string | null };
};

export type TaskAttachment = {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isProof: boolean;
  createdAt: string;
  uploadedBy: string;
};

/** Full Prisma FileAttachment shape — includes fields TaskAttachment's read-projection omits. */
export type FileAttachment = TaskAttachment & {
  taskId: string;
  storageKey: string;
  downloadCount: number;
};

export type PresignFileDto = {
  taskId: string;
  fileName: string;
  mimeType: string;
  isProof?: boolean;
};

export type PresignFileResponse = {
  uploadUrl: string;
  storageKey: string;
  fileKey: string;
};

export type ConfirmFileDto = {
  taskId: string;
  storageKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isProof: boolean;
};

// ─── Batch (task duplication) ────────────────────────────────────────────────

export type TaskBatch = {
  id: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  dueDate: string;
  isolationNote?: string | null;
  creatorId: string;
  departmentId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskBatchDto = {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate: string;
  departmentId?: string;
  assigneeIds: string[];
  isolationNote?: string;
};

export type BatchProgressSegment = {
  status: TaskStatus;
  label: string;
  count: number;
  percent: number;
};

export type BatchProgressSummary = {
  batch: TaskBatch;
  members: RichTask[];
  totalMembers: number;
  doneCount: number;
  atRiskCount: number;
  segments: BatchProgressSegment[];
};

// ─── Governance (Super Admin authored/reviewed tasks) ────────────────────────

export type GovernanceStage = 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED';

export type GovernanceTask = RichTask & {
  stage: GovernanceStage;
  lastRevisionNote?: string | null;
};

export type RequestRevisionDto = {
  note: string;
};
