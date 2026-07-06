'use client';

import React from 'react';
import { BarChart3, Download, FileText, Users, Building2, AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useReports, useRequestReport } from '@/hooks/useReports';
import { REPORT_TYPES } from '@/data/reports.mock';

const TYPE_ICON: Record<string, React.ElementType> = {
  'bar-chart': BarChart3,
  'user': Users,
  'building': Building2,
  'alert': AlertCircle,
  'trending': TrendingUp,
};

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: 'text-green-700 bg-green-50',
  PROCESSING: 'text-amber-700 bg-amber-50',
  QUEUED: 'text-slate-600 bg-surface-muted',
  FAILED: 'text-red-700 bg-red-50',
};

export default function ReportsPage() {
  const { data: reports, isLoading } = useReports();
  const { mutate: requestReport, isPending } = useRequestReport();

  const handleRequest = (type: string) => {
    // Error toast already shown by useRequestReport (useApiMutation).
    requestReport({ type }, {
      onSuccess: () => toast.success("Report queued — you'll be notified when it's ready"),
    });
  };

  return (
    <div className="max-w-screen-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500">
          Reports are generated asynchronously — you&apos;ll receive a notification when ready.
        </p>
      </div>

      {/* Report type cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {REPORT_TYPES.map((r) => {
          const Icon = TYPE_ICON[r.icon] ?? BarChart3;
          return (
            <div
              key={r.type}
              className="flex flex-col rounded-xl border border-surface-border bg-white p-5 shadow-card"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                <Icon className="h-5 w-5 text-brand-500" />
              </div>
              <h3 className="font-semibold text-slate-900">{r.label}</h3>
              <p className="mt-1 flex-1 text-xs text-slate-500">{r.description}</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4 w-full"
                loading={isPending}
                onClick={() => handleRequest(r.type)}
              >
                Generate
              </Button>
            </div>
          );
        })}
      </div>

      {/* Past reports list */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Generated Reports</h2>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
        ) : (reports ?? []).length === 0 ? (
          <EmptyState icon={FileText} title="No reports yet" description="Generate your first report above." />
        ) : (
          <div className="rounded-xl border border-surface-border bg-white shadow-card overflow-hidden divide-y divide-surface-border">
            {(reports ?? []).map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted">
                    <FileText className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {r.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-slate-400">
                      {r.requesterName} · {dayjs(r.createdAt).format('MMM D, YYYY HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      STATUS_STYLE[r.status] ?? 'text-slate-500 bg-surface-muted'
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.status === 'COMPLETED' && r.downloadUrl && (
                    <a
                      href={r.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-surface-subtle transition-colors"
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
