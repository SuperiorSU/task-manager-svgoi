export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_DUE_SOON'
  | 'TASK_OVERDUE'
  | 'COMMENT_ADDED'
  | 'CLARIFICATION_REQUESTED'
  | 'CLARIFICATION_RESPONDED'
  | 'TASK_COMPLETED'
  | 'TASK_REASSIGNED';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  userId: string;
  taskId?: string;
  createdAt: string;
};
