export const queryKeys = {
  auth: {
    profile: () => ['auth', 'profile'] as const,
  },
  tasks: {
    all: () => ['tasks'] as const,
    list: (filters?: Record<string, unknown>) => ['tasks', 'list', filters] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
    comments: (taskId: string) => ['tasks', taskId, 'comments'] as const,
    activity: (taskId: string) => ['tasks', taskId, 'activity'] as const,
    attachments: (taskId: string) => ['tasks', taskId, 'attachments'] as const,
  },
  users: {
    all: () => ['users'] as const,
    list: (filters?: Record<string, unknown>) => ['users', 'list', filters] as const,
    profile: (id: string) => ['users', id] as const,
    taskStats: (id: string) => ['users', id, 'task-stats'] as const,
    recentTasks: (id: string) => ['users', id, 'recent-tasks'] as const,
  },
  dashboard: {
    stats: (period: string) => ['dashboard', 'stats', period] as const,
    activity: () => ['dashboard', 'activity'] as const,
    deptStats: () => ['dashboard', 'dept-stats'] as const,
    workload: () => ['dashboard', 'workload'] as const,
  },
  notifications: {
    list: () => ['notifications'] as const,
    unreadCount: () => ['notifications', 'unread-count'] as const,
  },
  departments: {
    list: () => ['departments'] as const,
  },
} as const;
