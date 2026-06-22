import React from 'react';
import { cn } from '@/lib/utils';

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-md bg-slate-200', className)} />
);

export const StatCardSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-xl border border-surface-border bg-white p-5 shadow-card">
        <Skeleton className="mb-3 h-10 w-10 rounded-lg" />
        <Skeleton className="mb-1.5 h-7 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 8 }: { rows?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-14 w-full rounded-lg" />
    ))}
  </div>
);
