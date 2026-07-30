'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { Pencil, Trash2, CheckCircle2, RotateCcw, XCircle, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TaskStatusBadge } from '@/components/task/TaskStatusBadge';
import { TaskPriorityBadge } from '@/components/task/TaskPriorityBadge';
import { ActivityTimeline } from '@/components/task/ActivityTimeline';
import { AvatarWithFallback } from '@/components/shared/AvatarWithFallback';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTask, useTaskActivity, useTaskComments, useUpdateTaskStatus, useDeleteTask } from '@/hooks/useTasks';
import { useAuthStore } from '@/stores/auth.store';
import { PERMISSIONS } from '@/constants/permissions';
import { isOverdue, cn } from '@/lib/utils';
import { canTransitionTo, getNextStatus, QUICK_REVISION_REASONS, REVISION_NOTE_MAX_LENGTH } from '@godigitify/utils';
import type { Task, TaskStatus } from '@godigitify/types';

type FullTask = Task & {
  creator?: { id: string; name: string; avatarUrl?: string | null } | null;
  assignee?: { id: string; name: string; avatarUrl?: string | null } | null;
  department?: { name: string } | null;
  _count?: { comments: number };
};

const CANCELLABLE: TaskStatus[] = ['PENDING', 'ACCEPTED', 'IN_PROGRESS'];

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isSuperAdmin = useAuthStore((s) => s.user?.role === 'SUPER_ADMIN');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  // Request-changes composer state (inline panel, mirrors the mobile Revision sheet).
  const [revising, setRevising] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');

  const { data: task, isLoading } = useTask(id);
  const { data: activity } = useTaskActivity(id);
  const { data: comments } = useTaskComments(id);
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

  // Approving / cancelling is the creator's or a SUPER_ADMIN's call (matches the
  // API's guard). This is the web half of the cross-platform review loop: the
  // assignee submits from mobile (→ UNDER_REVIEW), the creator clears it here.
  const canReview = isSuperAdmin || (!!currentUserId && t.creator?.id === currentUserId);
  const isUnderReview = t.status === 'UNDER_REVIEW';
  const canCancel = canReview && CANCELLABLE.includes(t.status);
  // The assignee's most recent comment reads as their submission note.
  const submissionNote = (comments ?? [])
    .filter((c) => c.author.id === t.assignee?.id)
    .slice(-1)[0];

  const approve = () =>
    updateStatus(
      { id, dto: { status: 'COMPLETED' } },
      { onSuccess: () => setApproveOpen(false) }
    );

  const requestChanges = () => {
    const note = revisionNote.trim();
    if (!note) return;
    updateStatus(
      { id, dto: { status: 'IN_PROGRESS', comment: note } },
      {
        onSuccess: () => {
          setRevising(false);
          setRevisionNote('');
        },
      }
    );
  };

  const cancelTask = () =>
    updateStatus(
      { id, dto: { status: 'CANCELLED' } },
      { onSuccess: () => setCancelOpen(false) }
    );

  return (
    <div className="max-w-4xl space-y-6">
      {/* Priority stripe — 4px at top of detail card */}
      <div className="rounded-lg border border-surface-border bg-white shadow-card overflow-hidden">
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

          {/* ── Review panel: the web half of the mobile→web review loop ── */}
          {isUnderReview && canReview && (
            <div className="mt-5 rounded-lg border border-status-under-review/30 bg-status-under-review-bg/40 p-4">
              <div className="flex items-start gap-2.5">
                <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-status-under-review" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">Submitted for review</p>
                  <p className="text-xs text-slate-500">
                    {t.assignee?.name ?? 'The assignee'} marked this done. Approve to complete it, or send it back with a reason.
                  </p>
                </div>
              </div>

              {submissionNote && (
                <div className="mt-3 rounded-md border border-surface-border bg-white px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Submission note</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{submissionNote.content}</p>
                </div>
              )}

              {!revising ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                    disabled={isUpdating}
                    onClick={() => setApproveOpen(true)}
                  >
                    Approve &amp; complete
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<RotateCcw className="h-4 w-4" />}
                    disabled={isUpdating}
                    onClick={() => setRevising(true)}
                  >
                    Request changes
                  </Button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_REVISION_REASONS.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setRevisionNote(reason)}
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-xs transition-colors',
                          revisionNote === reason
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-surface-border text-slate-600 hover:bg-surface-muted'
                        )}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  <textarea
                    autoFocus
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value.slice(0, REVISION_NOTE_MAX_LENGTH))}
                    rows={3}
                    placeholder="What needs to change before this can be approved?"
                    className="w-full resize-none rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{revisionNote.length}/{REVISION_NOTE_MAX_LENGTH}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="muted"
                        disabled={isUpdating}
                        onClick={() => { setRevising(false); setRevisionNote(''); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        loading={isUpdating}
                        disabled={!revisionNote.trim()}
                        onClick={requestChanges}
                      >
                        Send back for changes
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* A reviewer without rights still needs to know the state. */}
          {isUnderReview && !canReview && (
            <div className="mt-5 border-t border-surface-border pt-5">
              <p className="text-sm text-slate-500">
                Awaiting review by {t.creator?.name ?? 'the task creator'}.
              </p>
            </div>
          )}

          {/* Generic status advance (non-review transitions) */}
          {!isUnderReview && nextStatus && canTransitionTo(t.status as Parameters<typeof canTransitionTo>[0], nextStatus as Parameters<typeof canTransitionTo>[1]) && (
            <PermissionGate permission={PERMISSIONS.TASK_UPDATE_STATUS}>
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-surface-border pt-5">
                <Button
                  loading={isUpdating}
                  onClick={() =>
                    updateStatus({ id, dto: { status: nextStatus as TaskStatus } })
                  }
                >
                  Move to {nextStatus.replace(/_/g, ' ')}
                </Button>
                {canCancel && (
                  <Button
                    variant="ghost"
                    leftIcon={<XCircle className="h-4 w-4" />}
                    disabled={isUpdating}
                    onClick={() => setCancelOpen(true)}
                  >
                    Cancel task
                  </Button>
                )}
              </div>
            </PermissionGate>
          )}

          {/* Cancel is still reachable when there's no forward advance to show. */}
          {!isUnderReview && !nextStatus && canCancel && (
            <div className="mt-5 border-t border-surface-border pt-5">
              <Button
                variant="ghost"
                leftIcon={<XCircle className="h-4 w-4" />}
                disabled={isUpdating}
                onClick={() => setCancelOpen(true)}
              >
                Cancel task
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Activity timeline */}
      {activities.length > 0 && (
        <div className="rounded-lg border border-surface-border bg-white p-6 shadow-card">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Activity</h2>
          <ActivityTimeline items={activities} />
        </div>
      )}

      <ConfirmDialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={approve}
        tone="primary"
        title="Approve & complete?"
        message="This marks the task complete and notifies the assignee. Completed tasks can't be reopened."
        confirmLabel="Approve & complete"
        loading={isUpdating}
      />

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancelTask}
        title="Cancel this task?"
        message="The task is removed from active work and the assignee is notified. This can't be undone."
        confirmLabel="Cancel task"
        loading={isUpdating}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() =>
          // Success/error toasts already shown by useDeleteTask (useApiMutation).
          deleteTask(id, { onSuccess: () => router.push('/tasks') })
        }
        title="Delete Task"
        message="This task will be soft-deleted. You can restore it from the audit log."
        confirmLabel="Delete"
        loading={isDeleting}
      />
    </div>
  );
}
