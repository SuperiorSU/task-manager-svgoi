import type { TaskPriority, Task } from '@godigitify/types';

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export const getPriorityColor = (priority: TaskPriority): string => {
  const map: Record<TaskPriority, string> = {
    CRITICAL: '#7C3AED',
    HIGH: '#EF4444',
    MEDIUM: '#F59E0B',
    LOW: '#22C55E',
  };
  return map[priority];
};

export const getPriorityLabel = (priority: TaskPriority): string => {
  const map: Record<TaskPriority, string> = {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
  };
  return map[priority];
};

export const sortByPriority = (tasks: Task[]): Task[] =>
  [...tasks].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
