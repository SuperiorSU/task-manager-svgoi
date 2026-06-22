'use client';

import React from 'react';
import { BarChart3, Download, FileText } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/constants/queryKeys';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import dayjs from 'dayjs';

type Report = {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  downloadUrl?: string | null;
};

const REPORT_TYPES = [
  { type: 'TASK_SUMMARY', label: 'Task Summary', description: 'Overview of all tasks by status and department' },
  { type: 'USER_PERFORMANCE', label: 'User Performance', description: 'Completion rates per employee' },
  { type: 'DEPARTMENT_COMPARISON', label: 'Department Comparison', description: 'Cross-department workload analysis' },
  { type: 'OVERDUE_ANALYSIS', label: 'Overdue Analysis', description: 'Breakdown of overdue tasks and patterns' },
];

export default function ReportsPage() {
  const { data, refetch } = useQuery({
    queryKey: queryKeys.reports.list(),
    queryFn: () => api.get('/reports').then((r) => r.data.data),
  });

  const { mutate: requestReport, isPending } = useMutation({
    mutationFn: (type: string) => api.post('/reports/request', { type }),
    onSuccess: () => {
      toast.success('Report queued — you\'ll be notified when it\'s ready');
      void refetch();
    },
    onError: () => toast.error('Failed to request report'),
  });

  const reports = (data ?? []) as Report[];

  return (
    <div className="max-w-screen-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500">Reports are generated asynchronously — you&apos;ll receive a notification when ready.</p>
      </div>

      {/* Generate report cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REPORT_TYPES.map((r) => (
          <div key={r.type} className="rounded-xl border border-surface-border bg-white p-5 shadow-card">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
              <BarChart3 className="h-5 w-5 text-brand-500" />
            </div>
            <h3 className="font-semibold text-slate-900">{r.label}</h3>
            <p className="mt-1 text-xs text-slate-500">{r.description}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4 w-full"
              loading={isPending}
              onClick={() => requestReport(r.type)}
            >
              Generate
            </Button>
          </div>
        ))}
      </div>

      {/* Past reports */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Generated Reports</h2>
        {reports.length === 0 ? (
          <EmptyState icon={FileText} title="No reports yet" description="Generate your first report above." />
        ) : (
          <div className="rounded-xl border border-surface-border bg-white shadow-card overflow-hidden divide-y divide-surface-border">
            {reports.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{r.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400">{dayjs(r.createdAt).format('MMM D, YYYY HH:mm')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${r.status === 'COMPLETED' ? 'text-green-600' : r.status === 'FAILED' ? 'text-red-600' : 'text-slate-400'}`}>
                    {r.status}
                  </span>
                  {r.downloadUrl && (
                    <a
                      href={r.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-surface-subtle"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
