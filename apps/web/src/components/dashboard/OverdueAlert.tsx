import React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export const OverdueAlert = ({ count }: { count: number }) => {
  if (count === 0) return null;
  return (
    <div className="relative flex items-center gap-4 overflow-hidden rounded-lg border border-status-overdue/30 bg-status-overdue-bg py-4 pl-6 pr-5 shadow-card">
      <span className="absolute inset-y-0 left-0 w-1 bg-status-overdue" />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-status-overdue/10">
        <AlertTriangle className="h-5 w-5 text-status-overdue" />
      </div>
      <p className="text-sm text-slate-700">
        <span className="font-bold text-status-overdue">{count} task{count > 1 ? 's' : ''}</span>{' '}
        {count > 1 ? 'are' : 'is'} overdue and need attention.
      </p>
      <Link
        href="/tasks?status=PENDING"
        className="ml-auto shrink-0 text-sm font-semibold text-status-overdue hover:underline"
      >
        Review now →
      </Link>
    </div>
  );
};
