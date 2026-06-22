import React from 'react';
import { cn } from '@/lib/utils';
import type { TaskPriority } from '@godigitify/types';

const PRIORITY_MAP: Record<TaskPriority, { label: string; className: string; stripe: string }> = {
  CRITICAL: { label: 'Critical', className: 'bg-priority-critical-bg text-priority-critical', stripe: 'bg-priority-critical' },
  HIGH:     { label: 'High',     className: 'bg-priority-high-bg text-priority-high',         stripe: 'bg-priority-high' },
  MEDIUM:   { label: 'Medium',   className: 'bg-priority-medium-bg text-priority-medium',     stripe: 'bg-priority-medium' },
  LOW:      { label: 'Low',      className: 'bg-priority-low-bg text-priority-low',           stripe: 'bg-priority-low' },
};

type Props = { priority: TaskPriority };

export const TaskPriorityBadge = ({ priority }: Props) => {
  const config = PRIORITY_MAP[priority];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide', config.className)}>
      {config.label}
    </span>
  );
};

export const priorityStripeClass = (priority: TaskPriority) => PRIORITY_MAP[priority].stripe;
