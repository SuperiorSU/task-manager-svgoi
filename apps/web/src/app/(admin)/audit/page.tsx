'use client';

import React, { useState } from 'react';
import dayjs from 'dayjs';
import { ShieldCheck, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { AvatarWithFallback } from '@/components/shared/AvatarWithFallback';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useAuditLogs } from '@/hooks/useAudit';

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'All entity types' },
  { value: 'TASK', label: 'Task' },
  { value: 'USER', label: 'User' },
  { value: 'DEPARTMENT', label: 'Department' },
  { value: 'AUTH', label: 'Auth' },
];

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'STATUS_CHANGE', label: 'Status Change' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
];

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-50 text-green-700',
  UPDATE: 'bg-brand-50 text-brand-700',
  DELETE: 'bg-red-50 text-red-700',
  STATUS_CHANGE: 'bg-amber-50 text-amber-700',
  LOGIN: 'bg-purple-50 text-purple-700',
  LOGOUT: 'bg-slate-100 text-slate-600',
};

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  const auditFilters = {
    page,
    limit: 15,
    ...(entityType ? { entityType } : {}),
    ...(action ? { action } : {}),
  };
  const { data, isLoading } = useAuditLogs(auditFilters);

  const logs = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 15);

  const actionColor = (a: string) =>
    ACTION_COLORS[a] ?? 'bg-slate-100 text-slate-600';

  return (
    <div className="max-w-screen-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
        <p className="text-sm text-slate-500">System-wide action history — Super Admin only</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-40">
          <Select
            options={ENTITY_TYPE_OPTIONS}
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-44">
          <Select
            options={ACTION_OPTIONS}
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
          />
        </div>
        {(entityType || action) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setEntityType(''); setAction(''); setPage(1); }}
          >
            Clear
          </Button>
        )}
        <span className="ml-auto text-xs text-slate-500">{total} records</span>
      </div>

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : logs.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No audit logs" description="System actions will appear here." />
      ) : (
        <>
          <div className="rounded-xl border border-surface-border bg-white shadow-card overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-muted">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-surface-border hover:bg-surface-muted">
                    <td className="px-4 py-3">
                      {log.actor ? (
                        <div className="flex items-center gap-2">
                          <AvatarWithFallback name={log.actor.name} src={log.actor.avatarUrl ?? null} size={24} />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{log.actor.name}</p>
                            <p className="text-xs text-slate-400">{log.actor.role}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${actionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-xs font-mono text-slate-700">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs max-w-xs truncate">{log.description}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {dayjs(log.createdAt).format('MMM D, HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
