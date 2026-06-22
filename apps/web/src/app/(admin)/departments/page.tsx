'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/constants/queryKeys';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { PERMISSIONS } from '@/constants/permissions';

type Department = { id: string; name: string; code: string; _count?: { users?: number; tasks?: number } };

export default function DepartmentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.departments.list(),
    queryFn: () => api.get('/departments').then((r) => r.data.data),
  });
  const departments = (data ?? []) as Department[];

  return (
    <div className="max-w-screen-xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
        <PermissionGate permission={PERMISSIONS.DEPT_MANAGE}>
          <Button leftIcon={<Plus className="h-4 w-4" />} asChild>
            <Link href="/departments/create">Add Department</Link>
          </Button>
        </PermissionGate>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : departments.length === 0 ? (
        <EmptyState icon={Building2} title="No departments" description="Add departments to organize your team." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <Link
              key={dept.id}
              href={`/departments/${dept.id}`}
              className="rounded-xl border border-surface-border bg-white p-5 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                <Building2 className="h-5 w-5 text-brand-500" />
              </div>
              <h2 className="font-semibold text-slate-900">{dept.name}</h2>
              <p className="mt-0.5 text-sm text-slate-500">{dept.code}</p>
              <div className="mt-3 flex gap-4 text-xs text-slate-400">
                <span>{dept._count?.users ?? 0} members</span>
                <span>{dept._count?.tasks ?? 0} tasks</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
