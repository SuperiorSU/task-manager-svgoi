import type { TaskStatus } from '@godigitify/types';

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['COMPLETED', 'IN_PROGRESS'],
  COMPLETED: [],
  CANCELLED: [],
};

export const canTransitionTo = (from: TaskStatus, to: TaskStatus): boolean =>
  VALID_TRANSITIONS[from].includes(to);

export const getNextStatus = (current: TaskStatus): TaskStatus | null => {
  const flow: Partial<Record<TaskStatus, TaskStatus>> = {
    PENDING: 'ACCEPTED',
    ACCEPTED: 'IN_PROGRESS',
    IN_PROGRESS: 'UNDER_REVIEW',
  };
  return flow[current] ?? null;
};

export const getStatusColor = (status: TaskStatus): string => {
  const map: Record<TaskStatus, string> = {
    PENDING: '#94A3B8',
    ACCEPTED: '#60A5FA',
    IN_PROGRESS: '#F59E0B',
    UNDER_REVIEW: '#A78BFA',
    COMPLETED: '#22C55E',
    CANCELLED: '#94A3B8',
  };
  return map[status];
};

export const getStatusLabel = (status: TaskStatus): string => {
  const map: Record<TaskStatus, string> = {
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    IN_PROGRESS: 'In Progress',
    UNDER_REVIEW: 'Under Review',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  return map[status];
};
