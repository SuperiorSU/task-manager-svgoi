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
