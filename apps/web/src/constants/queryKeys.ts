export const queryKeys = {
  auth: {
    profile: () => ['auth', 'profile'],
  },
  tasks: {
    all: () => ['tasks'],
    list: (filters?: Record<string, unknown>) => ['tasks', 'list', filters],
    detail: (id: string) => ['tasks', 'detail', id],
    activity: (id: string) => ['tasks', 'activity', id],
    comments: (id: string) => ['tasks', 'comments', id],
  },
  users: {
    all: () => ['users'],
    list: (filters?: Record<string, unknown>) => ['users', 'list', filters],
    detail: (id: string) => ['users', 'detail', id],
  },
  departments: {
    all: () => ['departments'],
    list: () => ['departments', 'list'],
    detail: (id: string) => ['departments', 'detail', id],
  },
  dashboard: {
    stats: (period: string) => ['dashboard', 'stats', period],
    activity: () => ['dashboard', 'activity'],
  },
  notifications: {
    list: () => ['notifications', 'list'],
    unreadCount: () => ['notifications', 'unread-count'],
  },
  reports: {
    list: () => ['reports', 'list'],
  },
  audit: {
    list: (filters?: Record<string, unknown>) => ['audit', 'list', filters],
  },
};
