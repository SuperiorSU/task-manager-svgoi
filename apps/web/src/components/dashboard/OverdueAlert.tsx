import React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export const OverdueAlert = ({ count }: { count: number }) => {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
      <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
      <p className="text-sm font-medium text-red-900">
        {count} task{count > 1 ? 's are' : ' is'} overdue and require attention.{' '}
        <Link href="/tasks?status=PENDING" className="underline hover:no-underline">
          View now →
        </Link>
      </p>
    </div>
  );
};
