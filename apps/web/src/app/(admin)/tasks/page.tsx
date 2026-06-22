'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, CheckSquare } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { TaskTable } from '@/components/task/TaskTable';
import { TaskFilters } from '@/components/task/TaskFilters';
import { EmptyState } from '@/components/ui/EmptyState';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { useTasks } from '@/hooks/useTasks';
import { PERMISSIONS } from '@/constants/permissions';
import type { TaskStatus, TaskPriority } from '@godigitify/types';

export default function TasksPage() {
  const searchParams = useSearchParams();

  const filters = {
    status: (searchParams.get('status') as TaskStatus) || undefined,
    priority: (searchParams.get('priority') as TaskPriority) || undefined,
    search: searchParams.get('q') || undefined,
    page: Number(searchParams.get('page') ?? 1),
  };

  const { data, isLoading } = useTasks(filters);
  const result = data as { items?: unknown[]; total?: number } | undefined;
  const tasks = (result?.items ?? []) as Parameters<typeof TaskTable>[0]['data'];
  const total = result?.total ?? 0;

  return (
    <div className="max-w-screen-xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500">{total} tasks total</p>
        </div>
        <PermissionGate permission={PERMISSIONS.TASK_CREATE}>
          <Button leftIcon={<Plus className="h-4 w-4" />} asChild>
            <Link href="/tasks/create">Create Task</Link>
          </Button>
        </PermissionGate>
      </div>

      <TaskFilters />

      {!isLoading && tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description="Try adjusting your filters or create a new task."
        />
      ) : (
        <TaskTable data={tasks} isLoading={isLoading} total={total} page={filters.page} />
      )}
    </div>
  );
}
