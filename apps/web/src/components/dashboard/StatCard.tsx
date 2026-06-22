import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  value: number;
  label: string;
  icon: LucideIcon;
  isAlert?: boolean;
  trend?: { value: number; label: string };
};

export const StatCard = ({ value, label, icon: Icon, isAlert, trend }: Props) => (
  <div
    className={cn(
      'rounded-xl border p-5 shadow-card',
      isAlert && value > 0
        ? 'border-red-200 bg-red-50'
        : 'border-surface-border bg-white'
    )}
  >
    <div className="flex items-start justify-between">
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          isAlert && value > 0 ? 'bg-red-100' : 'bg-brand-50'
        )}
      >
        <Icon
          className={cn('h-5 w-5', isAlert && value > 0 ? 'text-red-600' : 'text-brand-500')}
        />
      </div>
    </div>
    <div className="mt-3">
      <p
        className={cn(
          'text-3xl font-bold tracking-tight',
          isAlert && value > 0 ? 'text-red-600' : 'text-slate-900'
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
    </div>
    {trend && (
      <p className="mt-2 text-xs text-slate-400">
        <span className={cn(trend.value >= 0 ? 'text-green-600' : 'text-red-600')}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
        </span>{' '}
        {trend.label}
      </p>
    )}
  </div>
);
