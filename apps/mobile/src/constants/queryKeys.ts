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
    batch: (batchId: string) => ['tasks', 'batch', batchId] as const,
  },
  governance: {
    all: () => ['governance', 'tasks'] as const,
    list: (filters?: Record<string, unknown>) => ['governance', 'tasks', 'list', filters] as const,
    detail: (id: string) => ['governance', 'tasks', 'detail', id] as const,
  },
  audit: {
    all: () => ['audit'] as const,
    list: (filters?: Record<string, unknown>) => ['audit', 'list', filters] as const,
    detail: (id: string) => ['audit', 'detail', id] as const,
    verify: (id: string) => ['audit', 'verify', id] as const,
    byActor: (actorId: string) => ['audit', 'by-actor', actorId] as const,
  },
  users: {
    all: () => ['users'] as const,
    list: (filters?: Record<string, unknown>) => ['users', 'list', filters] as const,
    profile: (id: string) => ['users', id] as const,
    taskStats: (id: string) => ['users', id, 'task-stats'] as const,
    recentTasks: (id: string) => ['users', id, 'recent-tasks'] as const,
    orgDetail: (id: string) => ['users', id, 'org-detail'] as const,
  },
  dashboard: {
    stats: (period: string) => ['dashboard', 'stats', period] as const,
    activity: () => ['dashboard', 'activity'] as const,
    deptStats: () => ['dashboard', 'dept-stats'] as const,
    workload: () => ['dashboard', 'workload'] as const,
    deptHealth: () => ['dashboard', 'dept-health'] as const,
    staffLoad: () => ['dashboard', 'staff-load'] as const,
    escalations: () => ['dashboard', 'escalations'] as const,
    calendarDeadlines: (from: string, to: string) => ['dashboard', 'calendar', from, to] as const,
  },
  notifications: {
    list: () => ['notifications'] as const,
    unreadCount: () => ['notifications', 'unread-count'] as const,
  },
  departments: {
    list: () => ['departments'] as const,
    settings: (id: string) => ['departments', id, 'settings'] as const,
  },
} as const;
