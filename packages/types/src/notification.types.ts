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

export type NotificationPreferences = {
  id: string;
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  /** NotificationTypes the user has turned off — empty means everything is enabled. */
  mutedTypes: NotificationType[];
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateNotificationPreferencesDto = Partial<
  Omit<NotificationPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;
