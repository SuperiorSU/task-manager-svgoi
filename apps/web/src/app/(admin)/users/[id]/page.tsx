'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dayjs from 'dayjs';
import {
  Pencil,
  Mail,
  Phone,
  Building2,
  Shield,
  CheckSquare,
  AlertCircle,
  TrendingUp,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AvatarWithFallback } from '@/components/shared/AvatarWithFallback';
import { RoleChip } from '@/components/shared/RoleChip';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { useUser, useDeactivateUser, useReactivateUser } from '@/hooks/useUsers';
import { useTasks } from '@/hooks/useTasks';
import { PERMISSIONS } from '@/constants/permissions';
import { TaskStatusBadge } from '@/components/task/TaskStatusBadge';
import { TaskPriorityBadge } from '@/components/task/TaskPriorityBadge';
import { isOverdue } from '@/lib/utils';
import type { Role } from '@godigitify/types';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'reactivate' | null>(null);

  const { data: user, isLoading } = useUser(id);
  const { data: tasksData } = useTasks({ assigneeId: id, limit: 5 });
  const { mutate: deactivate, isPending: isDeactivating } = useDeactivateUser();
  const { mutate: reactivate, isPending: isReactivating } = useReactivateUser();

  const recentTasks = (tasksData?.items ?? []).slice(0, 5);
  const stats = (user as typeof user & { _taskStats?: { assigned: number; completed: number; overdue: number; onTimeRate: number } })?._taskStats;

  if (isLoading || !user) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="col-span-1 h-64" />
          <div className="col-span-2 space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  const u = user as typeof user & {
    department?: { name: string; code: string } | null;
    manager?: { name: string } | null;
  };

  return (
    <div className="max-w-3xl space-y-5">
      {/* Back + header actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <PermissionGate permission={PERMISSIONS.USER_UPDATE}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Pencil className="h-3.5 w-3.5" />}
              onClick={() => router.push(`/users/${id}/edit`)}
            >
              Edit
            </Button>
          </PermissionGate>
          {u.isActive ? (
            <PermissionGate permission={PERMISSIONS.USER_DEACTIVATE}>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmAction('deactivate')}
              >
                Suspend
              </Button>
            </PermissionGate>
          ) : (
            <PermissionGate permission={PERMISSIONS.USER_DEACTIVATE}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmAction('reactivate')}
              >
                Reactivate
              </Button>
            </PermissionGate>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Profile card */}
        <div className="rounded-xl border border-surface-border bg-white p-6 shadow-card">
          <div className="flex flex-col items-center text-center">
            <AvatarWithFallback name={u.name} src={u.avatarUrl} size={72} />
            <h1 className="mt-3 text-base font-bold text-slate-900">{u.name}</h1>
            <p className="mt-0.5 text-sm text-slate-500">{u.designation ?? '—'}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <RoleChip role={u.role as Role} />
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  u.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {u.isActive ? 'Active' : 'Suspended'}
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-3 border-t border-surface-border pt-5">
            {u.employeeId && (
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="font-mono text-slate-600">{u.employeeId}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate text-slate-600">{u.email}</span>
            </div>
            {u.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="text-slate-600">{u.phone}</span>
              </div>
            )}
            {u.department && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="text-slate-600">{u.department.name}</span>
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-surface-border pt-4 text-xs text-slate-400 space-y-1">
            <p>Joined {dayjs(u.createdAt).format('MMM D, YYYY')}</p>
            {u.lastLoginAt && (
              <p>Last seen {dayjs(u.lastLoginAt).fromNow?.() ?? dayjs(u.lastLoginAt).format('MMM D')}</p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5 lg:col-span-2">
          {/* Task stats */}
          {stats && (
            <div className="rounded-xl border border-surface-border bg-white p-5 shadow-card">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Task Summary (Last 30 days)</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex h-9 w-9 mx-auto items-center justify-center rounded-lg bg-brand-50">
                    <CheckSquare className="h-4 w-4 text-brand-500" />
                  </div>
                  <p className="mt-2 text-xl font-bold text-slate-900">{stats.assigned}</p>
                  <p className="text-xs text-slate-500">Assigned</p>
                </div>
                <div className="text-center">
                  <div className="flex h-9 w-9 mx-auto items-center justify-center rounded-lg bg-green-50">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="mt-2 text-xl font-bold text-slate-900">{stats.completed}</p>
                  <p className="text-xs text-slate-500">Completed</p>
                </div>
                <div className="text-center">
                  <div className={`flex h-9 w-9 mx-auto items-center justify-center rounded-lg ${stats.overdue > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                    <AlertCircle className={`h-4 w-4 ${stats.overdue > 0 ? 'text-red-600' : 'text-slate-400'}`} />
                  </div>
                  <p className={`mt-2 text-xl font-bold ${stats.overdue > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                    {stats.overdue}
                  </p>
                  <p className="text-xs text-slate-500">Overdue</p>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-surface-muted px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">On-time completion rate</span>
                  <span className={`font-semibold ${stats.onTimeRate >= 80 ? 'text-green-600' : stats.onTimeRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {stats.onTimeRate}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${stats.onTimeRate >= 80 ? 'bg-green-500' : stats.onTimeRate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${stats.onTimeRate}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Recent tasks */}
          <div className="rounded-xl border border-surface-border bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Recent Tasks</h2>
              <Link
                href={`/tasks?assigneeId=${id}`}
                className="text-xs font-medium text-brand-500 hover:text-brand-600"
              >
                View all →
              </Link>
            </div>
            {recentTasks.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">No tasks assigned</p>
            ) : (
              <div className="divide-y divide-surface-border">
                {recentTasks.map((task) => {
                  const overdue = isOverdue(task.dueDate, task.status);
                  return (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="flex items-center gap-3 py-3 hover:bg-surface-muted -mx-5 px-5 transition-colors"
                    >
                      <div
                        className={`h-7 w-1 shrink-0 rounded-full ${
                          task.priority === 'CRITICAL' ? 'bg-priority-critical' :
                          task.priority === 'HIGH' ? 'bg-priority-high' :
                          task.priority === 'MEDIUM' ? 'bg-priority-medium' : 'bg-priority-low'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-medium ${overdue ? 'text-red-700' : 'text-slate-900'}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-400">
                          Due {dayjs(task.dueDate).format('MMM D, YYYY')}
                        </p>
                      </div>
                      <TaskStatusBadge status={task.status} isOverdue={overdue} />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction === 'deactivate'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() =>
          // Success/error toasts already shown by useDeactivateUser (useApiMutation).
          deactivate(id, { onSuccess: () => setConfirmAction(null) })
        }
        title={`Suspend ${u.name}?`}
        message="They will be immediately logged out of all devices and unable to sign in until reactivated."
        confirmLabel="Suspend"
        loading={isDeactivating}
      />
      <ConfirmDialog
        open={confirmAction === 'reactivate'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() =>
          // Success/error toasts already shown by useReactivateUser (useApiMutation).
          reactivate(id, { onSuccess: () => setConfirmAction(null) })
        }
        title={`Reactivate ${u.name}?`}
        message="This will allow them to sign in again with their existing credentials."
        confirmLabel="Reactivate"
        loading={isReactivating}
      />
    </div>
  );
}
