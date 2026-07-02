import type { User } from '@godigitify/types';
import type { UserTaskStats } from '@godigitify/api-client';

import { getInitials } from './initial';
import { getAvatarColor } from './avatarColor';

export type TeamFilter = 'ALL' | 'EMPLOYEES' | 'ADMINS' | 'SUSPENDED';

/** View model the team/people UI components render — derived from the real User shape. */
export type TeamMemberView = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  employeeId: string;
  email: string;
  phone?: string;
  designation: string;
  role: 'EMPLOYEE' | 'ADMIN';
  department: { id: string; name: string } | null;
  isActive: boolean;
  taskStats: UserTaskStats;
};

const EMPTY_STATS: UserTaskStats = { assigned: 0, completed: 0, overdue: 0, onTimeRate: 0 };

export function toTeamMemberView(user: User, taskStats: UserTaskStats = EMPTY_STATS): TeamMemberView {
  const initials = getInitials(user.name);
  return {
    id: user.id,
    name: user.name,
    initials,
    avatarColor: getAvatarColor(initials),
    employeeId: user.employeeId ?? '—',
    email: user.email,
    ...(user.phone ? { phone: user.phone } : {}),
    designation: user.designation ?? '',
    role: user.role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
    department: user.department ? { id: user.department.id, name: user.department.name } : null,
    isActive: user.isActive,
    taskStats,
  };
}
