'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TaskStatusBadge } from '@/components/task/TaskStatusBadge';
import { TaskPriorityBadge } from '@/components/task/TaskPriorityBadge';
import { ActivityTimeline } from '@/components/task/ActivityTimeline';
import { AvatarWithFallback } from '@/components/shared/AvatarWithFallback';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTask, useTaskActivity, useUpdateTaskStatus, useDeleteTask } from '@/hooks/useTasks';
import { PERMISSIONS } from '@/constants/permissions';
import { isOverdue } from '@/lib/utils';
import { canTransitionTo, getNextStatus } from '@godigitify/utils';
import type { Task, TaskStatus } from '@godigitify/types';

type FullTask = Task & {
  assignee?: { id: string; name: string; avatarUrl?: string | null } | null;
  department?: { name: string } | null;
  _count?: { comments: number };
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: task, isLoading } = useTask(id);
  const { data: activity } = useTaskActivity(id);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateTaskStatus();
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask();

  const t = task as FullTask | undefined;
  const activities = (activity ?? []) as Array<{
    id: string;
    action: string;
    note?: string | null;
    createdAt: string;
    actor?: { name: string; avatarUrl?: string | null } | null;
  }>;

  if (isLoading || !t) {
    return (
      <div className="max-w-4xl space-y-4">
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const overdue = isOverdue(t.dueDate, t.status);
  const nextStatus = getNextStatus(t.status as Parameters<typeof getNextStatus>[0]);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Priority stripe — 4px at top of detail card */}
      <div className="rounded-xl border border-surface-border bg-white shadow-card overflow-hidden">
        <div
          className={`h-1 w-full ${
            t.priority === 'CRITICAL' ? 'bg-priority-critical' :
            t.priority === 'HIGH' ? 'bg-priority-high' :
            t.priority === 'MEDIUM' ? 'bg-priority-medium' : 'bg-priority-low'
          }`}
        />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <TaskStatusBadge status={t.status} isOverdue={overdue} />
                <TaskPriorityBadge priority={t.priority} />
              </div>
              <h1 className="text-xl font-bold text-slate-900">{t.title}</h1>
            </div>

            <div className="flex shrink-0 gap-2">
              <PermissionGate permission={PERMISSIONS.TASK_UPDATE}>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Pencil className="h-3.5 w-3.5" />}
                  onClick={() => router.push(`/tasks/${id}/edit`)}
                >
                  Edit
                </Button>
              </PermissionGate>
              <PermissionGate permission={PERMISSIONS.TASK_DELETE}>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete
                </Button>
              </PermissionGate>
            </div>
          </div>

          {/* Metadata grid */}
          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-surface-border pt-5 sm:grid-cols-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Due Date</dt>
              <dd className={`mt-1 text-sm font-medium ${overdue ? 'text-red-600' : 'text-slate-900'}`}>
                {dayjs(t.dueDate).format('MMM D, YYYY')}
                {overdue && ' ⚠'}
              </dd>
            </div>
            {t.department && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Department</dt>
                <dd className="mt-1 text-sm text-slate-900">{t.department.name}</dd>
              </div>
            )}
            {t.assignee && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Assignee</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <AvatarWithFallback name={t.assignee.name} src={t.assignee.avatarUrl ?? null} size={20} />
                  <span className="text-sm text-slate-900">{t.assignee.name}</span>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Comments</dt>
              <dd className="mt-1 text-sm text-slate-900">{t._count?.comments ?? 0}</dd>
            </div>
          </dl>

          {t.description && (
            <div className="mt-5 border-t border-surface-border pt-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-700">Description</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {t.description}
              </p>
            </div>
          )}

          {/* Status advance */}
          {nextStatus && canTransitionTo(t.status as Parameters<typeof canTransitionTo>[0], nextStatus as Parameters<typeof canTransitionTo>[1]) && (
            <PermissionGate permission={PERMISSIONS.TASK_UPDATE_STATUS}>
              <div className="mt-5 border-t border-surface-border pt-5">
                <Button
                  loading={isUpdating}
                  onClick={() =>
                    updateStatus(
                      { id, dto: { status: nextStatus as TaskStatus, note: '' } },
                      { onSuccess: () => toast.success('Status updated') }
                    )
                  }
                >
                  Move to {nextStatus.replace(/_/g, ' ')}
                </Button>
              </div>
            </PermissionGate>
          )}
        </div>
      </div>

      {/* Activity timeline */}
      {activities.length > 0 && (
        <div className="rounded-xl border border-surface-border bg-white p-6 shadow-card">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Activity</h2>
          <ActivityTimeline items={activities} />
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() =>
          deleteTask(id, {
            onSuccess: () => {
              toast.success('Task deleted');
              router.push('/tasks');
            },
            onError: () => toast.error('Failed to delete task'),
          })
        }
        title="Delete Task"
        message="This task will be soft-deleted. You can restore it from the audit log."
        confirmLabel="Delete"
        loading={isDeleting}
      />
    </div>
  );
}
