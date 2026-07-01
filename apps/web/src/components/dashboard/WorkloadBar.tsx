'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { WorkloadEntry } from '@/data/dashboard.mock';

type Props = {
  data: WorkloadEntry[];
};

export const WorkloadBar = ({ data }: Props) => {
  const max = Math.max(...data.map((d) => d.assigned), 1);

  return (
    <div className="space-y-3">
      {data.map((entry) => {
        const completedPct = Math.round((entry.completed / entry.assigned) * 100);
        return (
          <div key={entry.userId} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 truncate max-w-[160px]" title={entry.name}>
                {entry.name.split(' ').slice(-1)[0]}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {entry.overdue > 0 && (
                  <span className="text-xs font-medium text-red-600">{entry.overdue} overdue</span>
                )}
                <span className="text-xs text-slate-500">
                  {entry.completed}/{entry.assigned}
                </span>
              </div>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
              {/* Completed segment */}
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${(entry.completed / max) * 100}%` }}
              />
              {/* Overdue segment (overlaps open/in-progress remainder) */}
              {entry.overdue > 0 && (
                <div
                  className="h-full bg-red-400 transition-all"
                  style={{ width: `${(entry.overdue / max) * 100}%` }}
                />
              )}
            </div>
            <p className="text-xs text-slate-400">{completedPct}% completion rate</p>
          </div>
        );
      })}
    </div>
  );
};

export const WorkloadBarSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="space-y-1.5">
        <div className="flex justify-between">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-12 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-2 w-full animate-pulse rounded-full bg-slate-200" />
        <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
      </div>
    ))}
  </div>
);
