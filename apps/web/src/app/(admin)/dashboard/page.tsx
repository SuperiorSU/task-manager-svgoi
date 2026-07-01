'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Building2,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { OverdueAlert } from '@/components/dashboard/OverdueAlert';
import { CompletionRingChart } from '@/components/dashboard/CompletionRingChart';
import { TaskTrendChart } from '@/components/dashboard/TaskTrendChart';
import { DeptComparisonChart } from '@/components/dashboard/DeptComparisonChart';
import { WorkloadBar, WorkloadBarSkeleton } from '@/components/dashboard/WorkloadBar';
import { ActivityTimeline } from '@/components/task/ActivityTimeline';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { PermissionGate } from '@/components/shared/PermissionGate';
import {
  useDashboardStats,
  useDashboardTrend,
  useDashboardDeptStats,
  useDashboardWorkload,
  useDashboardActivity,
} from '@/hooks/useDashboard';
import { PERMISSIONS } from '@/constants/permissions';
import { useAuthStore } from '@/stores/auth.store';

const ChartCard = ({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="rounded-xl border border-surface-border bg-white p-5 shadow-card">
    <div className="mb-4 flex items-start justify-between">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: trend, isLoading: trendLoading } = useDashboardTrend();
  const { data: deptStats, isLoading: deptLoading } = useDashboardDeptStats();
  const { data: workload, isLoading: workloadLoading } = useDashboardWorkload();
  const { data: activity, isLoading: activityLoading } = useDashboardActivity();

  const isSA = user?.role === 'SUPER_ADMIN';

  return (
    <div className="max-w-screen-xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            {isSA ? 'Organisation-wide operational overview' : 'Department operational overview'}
          </p>
        </div>
        <PermissionGate permission={PERMISSIONS.TASK_CREATE}>
          <Button leftIcon={<Plus className="h-4 w-4" />} asChild size="sm">
            <Link href="/tasks/create">New Task</Link>
          </Button>
        </PermissionGate>
      </div>

      {/* Overdue alert — highest priority per design directive */}
      {!statsLoading && (stats?.overdue ?? 0) > 0 && (
        <OverdueAlert count={stats!.overdue} />
      )}

      {/* Stat cards row */}
      {statsLoading ? (
        <StatCardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            value={stats?.totalTasks ?? 0}
            label="Total Tasks"
            icon={CheckSquare}
            sublabel={`${stats?.pending ?? 0} pending`}
          />
          <StatCard
            value={stats?.overdue ?? 0}
            label="Overdue"
            icon={AlertCircle}
            isAlert={(stats?.overdue ?? 0) > 0}
            sublabel="needs attention"
          />
          <StatCard
            value={stats?.inProgress ?? 0}
            label="In Progress"
            icon={Clock}
            sublabel={`${stats?.underReview ?? 0} under review`}
          />
          <StatCard
            value={stats?.completedThisWeek ?? 0}
            label="Done This Week"
            icon={TrendingUp}
            sublabel={`${stats?.completionRate ?? 0}% overall rate`}
          />
        </div>
      )}

      {/* SA-only people stats */}
      {isSA && !statsLoading && (
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/users"
            className="flex items-center justify-between rounded-xl border border-surface-border bg-white px-5 py-4 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                <Users className="h-5 w-5 text-brand-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{stats?.activeUsers ?? 0}</p>
                <p className="text-xs text-slate-500">Active Users</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            href="/departments"
            className="flex items-center justify-between rounded-xl border border-surface-border bg-white px-5 py-4 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                <Building2 className="h-5 w-5 text-brand-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{stats?.departments ?? 0}</p>
                <p className="text-xs text-slate-500">Departments</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Completion ring */}
        <ChartCard title="Completion Rate" subtitle="All tasks, all time">
          {statsLoading ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="h-36 w-36 animate-pulse rounded-full bg-slate-200" />
              <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
            </div>
          ) : (
            <CompletionRingChart
              completed={stats?.completed ?? 0}
              total={stats?.totalTasks ?? 0}
            />
          )}
        </ChartCard>

        {/* Task trend line */}
        <div className="lg:col-span-2">
          <ChartCard title="Task Activity" subtitle="Last 14 days — created vs. completed">
            {trendLoading ? (
              <div className="h-[200px] animate-pulse rounded-lg bg-slate-100" />
            ) : (
              <TaskTrendChart data={trend ?? []} />
            )}
          </ChartCard>
        </div>
      </div>

      {/* Department comparison + Workload */}
      {isSA && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard title="Department Completion" subtitle="Completion % by department">
            {deptLoading ? (
              <div className="h-[200px] animate-pulse rounded-lg bg-slate-100" />
            ) : (
              <DeptComparisonChart data={deptStats ?? []} />
            )}
          </ChartCard>

          <ChartCard title="Team Workload" subtitle="Task completion per employee">
            {workloadLoading ? (
              <WorkloadBarSkeleton />
            ) : (
              <WorkloadBar data={workload ?? []} />
            )}
          </ChartCard>
        </div>
      )}

      {/* Non-SA workload */}
      {!isSA && (
        <ChartCard title="Team Workload" subtitle="Task completion per employee">
          {workloadLoading ? <WorkloadBarSkeleton /> : <WorkloadBar data={workload ?? []} />}
        </ChartCard>
      )}

      {/* Recent activity */}
      <ChartCard
        title="Recent Activity"
        subtitle="Latest task updates across the organisation"
        action={
          <Link href="/tasks" className="text-xs font-medium text-brand-500 hover:text-brand-600">
            View all tasks →
          </Link>
        }
      >
        {activityLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-7 w-7 animate-pulse rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-1.5 pt-1">
                  <div className="h-3.5 w-56 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (activity?.length ?? 0) > 0 ? (
          <ActivityTimeline
            items={(activity ?? []).map((a) => ({
              id: a.id,
              action: a.action,
              note: a.note ?? null,
              createdAt: a.createdAt,
              actor: a.actor ?? null,
            }))}
          />
        ) : (
          <p className="py-4 text-center text-sm text-slate-400">No recent activity</p>
        )}
      </ChartCard>
    </div>
  );
}
