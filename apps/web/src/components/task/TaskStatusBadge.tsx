import React from 'react';
import { cn } from '@/lib/utils';
import type { TaskStatus } from '@godigitify/types';

const STATUS_MAP: Record<TaskStatus, { label: string; className: string }> = {
  PENDING:      { label: 'Pending',      className: 'bg-status-pending-bg text-status-pending' },
  ACCEPTED:     { label: 'Accepted',     className: 'bg-status-accepted-bg text-status-accepted' },
  IN_PROGRESS:  { label: 'In Progress',  className: 'bg-status-in-progress-bg text-status-in-progress' },
  UNDER_REVIEW: { label: 'Under Review', className: 'bg-status-under-review-bg text-status-under-review' },
  COMPLETED:    { label: 'Completed',    className: 'bg-status-completed-bg text-status-completed' },
  CANCELLED:    { label: 'Cancelled',    className: 'bg-status-cancelled-bg text-status-cancelled' },
};

type Props = { status: TaskStatus; isOverdue?: boolean };

export const TaskStatusBadge = ({ status, isOverdue }: Props) => {
  const config = isOverdue
    ? { label: 'Overdue', className: 'bg-status-overdue-bg text-status-overdue' }
    : STATUS_MAP[status];

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide', config.className)}>
      {config.label}
    </span>
  );
};
