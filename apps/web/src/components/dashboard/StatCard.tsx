import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatAccent = 'brand' | 'overdue' | 'progress' | 'done';

const ACCENT_BAR: Record<StatAccent, string> = {
  brand: 'bg-brand-500',
  overdue: 'bg-status-overdue',
  progress: 'bg-status-in-progress',
  done: 'bg-status-completed',
};

type Props = {
  value: number;
  label: string;
  icon: LucideIcon;
  isAlert?: boolean;
  sublabel?: string;
  accent?: StatAccent;
};

/**
 * Data-first stat tile. The number is the hero (tabular, tight); the label is a
 * quiet uppercase caption above it; the icon is demoted to a monochrome accent
 * (no decorative pastel square). Each tile carries a 3px semantic left stripe —
 * the product's priority-stripe signature — so the row scans by colour.
 */
export const StatCard = React.memo(function StatCard({ value, label, icon: Icon, isAlert, sublabel, accent = 'brand' }: Props) {
  const alert = !!isAlert && value > 0;
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border bg-white pl-6 pr-5 py-5 shadow-card',
        alert ? 'border-status-overdue/30 bg-status-overdue-bg' : 'border-surface-border'
      )}
    >
      <span className={cn('absolute inset-y-0 left-0 w-[3px]', alert ? 'bg-status-overdue' : ACCENT_BAR[accent])} />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <Icon className={cn('h-4 w-4 shrink-0', alert ? 'text-status-overdue' : 'text-slate-300')} />
      </div>
      <p
        className={cn(
          'mt-2 text-4xl font-bold tabular-nums tracking-tight leading-none',
          alert ? 'text-status-overdue' : 'text-slate-900'
        )}
      >
        {value}
      </p>
      {sublabel && <p className="mt-2 text-xs text-slate-400">{sublabel}</p>}
    </div>
  );
});
