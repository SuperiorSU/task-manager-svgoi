'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dayjs from 'dayjs';
import {
  Pencil,
  Users,
  CheckSquare,
  AlertCircle,
  ChevronLeft,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { AvatarWithFallback } from '@/components/shared/AvatarWithFallback';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { TaskStatusBadge } from '@/components/task/TaskStatusBadge';
import { useDepartment } from '@/hooks/useDepartments';
import { useUsers } from '@/hooks/useUsers';
import { useTasks } from '@/hooks/useTasks';
import { PERMISSIONS } from '@/constants/permissions';
import { isOverdue } from '@/lib/utils';

export default function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: dept, isLoading } = useDepartment(id);
  const { data: members } = useUsers({ departmentId: id, limit: 50 });
  const { data: tasksData } = useTasks({ departmentId: id, limit: 8 });

  const d = dept as typeof dept & {
    head?: { id: string; name: string; avatarUrl?: string | null };
    _count?: { users: number; tasks: number };
    completionRate?: number;
    overdueTasks?: number;
  };

  if (isLoading || !dept) {
    return (
      <div className="max-w-4xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const recentTasks = (tasksData?.items ?? []).slice(0, 6);

  return (
    <div className="max-w-4xl space-y-5">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Departments
        </button>
        <PermissionGate permission={PERMISSIONS.DEPT_UPDATE}>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Pencil className="h-3.5 w-3.5" />}
            onClick={() => router.push(`/departments/${id}/edit`)}
          >
            Edit
          </Button>
        </PermissionGate>
      </div>

      {/* Dept header */}
      <div className="rounded-xl border border-surface-border bg-white p-6 shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-600">
                {d.code}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{d.name}</h1>
                {d.description && (
                  <p className="mt-0.5 text-sm text-slate-500 max-w-lg">{d.description}</p>
                )}
              </div>
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              d.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {d.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {d.head && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-slate-500">Head of Department:</span>
            <Link
              href={`/users/${d.head.id}`}
              className="flex items-center gap-1.5 font-medium text-brand-600 hover:text-brand-700"
            >
              <AvatarWithFallback name={d.head.name} src={d.head.avatarUrl ?? null} size={20} />
              {d.head.name}
            </Link>
          </div>
        )}
        <p className="mt-2 text-xs text-slate-400">
          Created {dayjs(d.createdAt).format('MMMM D, YYYY')}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-surface-border bg-white p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-slate-900">{d._count?.users ?? members?.total ?? 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">Members</p>
        </div>
        <div className="rounded-xl border border-surface-border bg-white p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-slate-900">{d._count?.tasks ?? 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Tasks</p>
        </div>
        <div className="rounded-xl border border-surface-border bg-white p-4 shadow-card text-center">
          <p className={`text-2xl font-bold ${(d.completionRate ?? 0) >= 70 ? 'text-green-600' : (d.completionRate ?? 0) >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
            {d.completionRate ?? 0}%
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Completion Rate</p>
        </div>
        <div className={`rounded-xl border p-4 shadow-card text-center ${(d.overdueTasks ?? 0) > 0 ? 'border-red-200 bg-red-50' : 'border-surface-border bg-white'}`}>
          <p className={`text-2xl font-bold ${(d.overdueTasks ?? 0) > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {d.overdueTasks ?? 0}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Overdue Tasks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Members list */}
        <div className="rounded-xl border border-surface-border bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Members</h2>
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-slate-600">
                {members?.total ?? 0}
              </span>
            </div>
            <PermissionGate permission={PERMISSIONS.USER_CREATE}>
              <Link
                href={`/users/create?departmentId=${id}`}
                className="text-xs font-medium text-brand-500 hover:text-brand-600 flex items-center gap-0.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Link>
            </PermissionGate>
          </div>
          {(members?.items ?? []).length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">No members yet</p>
          ) : (
            <div className="space-y-2">
              {(members?.items ?? []).map((member) => (
                <Link
                  key={member.id}
                  href={`/users/${member.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-muted transition-colors -mx-2"
                >
                  <AvatarWithFallback name={member.name} src={member.avatarUrl ?? null} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-400">{member.designation ?? member.role}</p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${
                      member.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {member.isActive ? 'Active' : 'Off'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent tasks */}
        <div className="rounded-xl border border-surface-border bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Recent Tasks</h2>
            </div>
            <Link
              href={`/tasks?departmentId=${id}`}
              className="text-xs font-medium text-brand-500 hover:text-brand-600"
            >
              View all →
            </Link>
          </div>
          {recentTasks.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">No tasks for this department</p>
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
                    {overdue && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />}
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${overdue ? 'text-red-700' : 'text-slate-900'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {task.assignee?.name} · Due {dayjs(task.dueDate).format('MMM D')}
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
  );
}
