'use client';

import React from 'react';
import { CheckSquare, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { OverdueAlert } from '@/components/dashboard/OverdueAlert';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import { useDashboardStats, useDashboardActivity } from '@/hooks/useDashboard';
import { ActivityTimeline } from '@/components/task/ActivityTimeline';

type Stats = {
  totalTasks: number;
  inProgress: number;
  overdue: number;
  completedThisWeek: number;
  recentActivity: Array<{
    id: string;
    action: string;
    note?: string | null;
    createdAt: string;
    actor?: { name: string; avatarUrl?: string | null } | null;
  }>;
};

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats('week');
  const s = stats as Stats | undefined;

  return (
    <div className="max-w-screen-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Weekly operational overview</p>
      </div>

      {/* Overdue alert — highest priority element per design directive */}
      {!isLoading && (s?.overdue ?? 0) > 0 && (
        <OverdueAlert count={s!.overdue} />
      )}

      {isLoading ? (
        <StatCardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard value={s?.totalTasks ?? 0} label="Total Tasks" icon={CheckSquare} />
          <StatCard value={s?.overdue ?? 0} label="Overdue" icon={AlertCircle} isAlert />
          <StatCard value={s?.inProgress ?? 0} label="In Progress" icon={Clock} />
          <StatCard value={s?.completedThisWeek ?? 0} label="Completed This Week" icon={TrendingUp} />
        </div>
      )}

      {/* Recent activity */}
      <div className="rounded-xl border border-surface-border bg-white p-6 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
        </div>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-7 w-7 animate-pulse rounded-full bg-slate-200" />
                <div className="flex-1 space-y-1.5 pt-1">
                  <div className="h-3.5 w-56 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (s?.recentActivity?.length ?? 0) > 0 ? (
          <ActivityTimeline items={(s?.recentActivity ?? []).slice(0, 10)} />
        ) : (
          <p className="text-sm text-slate-400">No recent activity</p>
        )}
      </div>
    </div>
  );
}
