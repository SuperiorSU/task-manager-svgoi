'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { queryKeys } from '@/constants/queryKeys';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { AvatarWithFallback } from '@/components/shared/AvatarWithFallback';

type AuditLog = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  actor?: { name: string; avatarUrl?: string | null } | null;
};

export default function AuditPage() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page') ?? 1);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.audit.list({ page }),
    queryFn: () => api.get('/audit', { params: { page, limit: 20 } }).then((r) => r.data.data),
  });

  const logs = ((data as { items?: AuditLog[] })?.items ?? []) as AuditLog[];

  return (
    <div className="max-w-screen-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
        <p className="text-sm text-slate-500">System-wide action history — Super Admin only</p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : logs.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No audit logs" description="System actions will appear here." />
      ) : (
        <div className="rounded-xl border border-surface-border bg-white shadow-card overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-muted">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Target</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-surface-border hover:bg-surface-muted">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {log.actor && (
                        <>
                          <AvatarWithFallback name={log.actor.name} src={log.actor.avatarUrl} size={24} />
                          <span className="text-slate-900">{log.actor.name}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-surface-subtle px-1.5 py-0.5 text-xs font-mono text-slate-700">
                      {log.action}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{log.targetType} / {log.targetId.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-slate-500">{dayjs(log.createdAt).format('MMM D, YYYY HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
