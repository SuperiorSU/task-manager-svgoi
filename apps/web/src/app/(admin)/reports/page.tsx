'use client';

import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import {
  FileText,
  Users,
  Building2,
  AlertCircle,
  ArrowLeftRight,
  Download,
} from 'lucide-react';
import type {
  ReportType,
  ReportScope,
  ReportFormat,
  GenerateReportDto,
} from '@godigitify/types';

import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useUsers } from '@/hooks/useUsers';
import { useDepartments } from '@/hooks/useDepartments';
import { useGenerateReport } from '@/hooks/useReports';

const REPORT_TYPES: { id: ReportType; label: string; desc: string; icon: React.ElementType }[] = [
  { id: 'TASK_SUMMARY', label: 'Task Summary', desc: 'Every task with status, priority, assignee & dates', icon: FileText },
  { id: 'USER_PERFORMANCE', label: 'User Performance', desc: 'Per-employee assigned, completed, overdue & on-time rate', icon: Users },
  { id: 'DEPARTMENT_COMPARISON', label: 'Department Comparison', desc: 'Department-vs-department totals & completion', icon: Building2 },
  { id: 'OVERDUE_ANALYSIS', label: 'Overdue Analysis', desc: 'Overdue tasks with aging (days overdue)', icon: AlertCircle },
  { id: 'CROSS_DEPT_ASSIGNMENT', label: 'Cross-Dept Assignments', desc: 'Tasks assigned across departments', icon: ArrowLeftRight },
];

const PRESETS: { id: string; label: string }[] = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: 'month', label: 'This month' },
  { id: 'year', label: 'This year' },
  { id: 'custom', label: 'Custom' },
];

const FORMATS: { id: ReportFormat; label: string }[] = [
  { id: 'csv', label: 'CSV' },
  { id: 'xlsx', label: 'Excel' },
  { id: 'pdf', label: 'PDF' },
];

const STATUS_OPTS = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED'];
const PRIORITY_OPTS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

// ── small building blocks ─────────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{children}</p>
);

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-0.5 rounded-lg border border-surface-border bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === o.id ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-surface-muted'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const isSA = user?.role === 'SUPER_ADMIN';

  const [type, setType] = useState<ReportType>('TASK_SUMMARY');
  const [scope, setScope] = useState<ReportScope>(isSA ? 'org' : 'department');
  const [targetId, setTargetId] = useState('');
  const [preset, setPreset] = useState('30d');
  const [customFrom, setCustomFrom] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [customTo, setCustomTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [format, setFormat] = useState<ReportFormat>('csv');

  const generate = useGenerateReport();

  const { data: depts } = useDepartments();
  const { data: usersData } = useUsers({ limit: 100 });
  const users = usersData?.items ?? [];

  const scopeOptions = useMemo<{ id: ReportScope; label: string }[]>(
    () =>
      isSA
        ? [
            { id: 'org', label: 'Organisation' },
            { id: 'department', label: 'By Department' },
            { id: 'admin', label: 'By Admin' },
            { id: 'employee', label: 'By Employee' },
          ]
        : [
            { id: 'department', label: 'My Department' },
            { id: 'employee', label: 'By Employee' },
          ],
    [isSA]
  );

  // Target picker options depend on the chosen scope.
  const needsTarget = (isSA && scope === 'department') || scope === 'admin' || scope === 'employee';
  const targetOptions = useMemo(() => {
    if (scope === 'department') return (depts ?? []).map((d) => ({ value: d.id, label: d.name }));
    const role = scope === 'admin' ? 'ADMIN' : 'EMPLOYEE';
    return users.filter((u) => u.role === role).map((u) => ({ value: u.id, label: u.name }));
  }, [scope, depts, users]);

  const dateRange = useMemo(() => {
    const to = dayjs();
    const map: Record<string, { from: dayjs.Dayjs; to: dayjs.Dayjs }> = {
      '7d': { from: to.subtract(7, 'day'), to },
      '30d': { from: to.subtract(30, 'day'), to },
      '90d': { from: to.subtract(90, 'day'), to },
      month: { from: to.startOf('month'), to },
      year: { from: to.startOf('year'), to },
      custom: { from: dayjs(customFrom), to: dayjs(customTo).endOf('day') },
    };
    const r = map[preset] ?? map['30d']!;
    return { from: r.from.toISOString(), to: r.to.toISOString() };
  }, [preset, customFrom, customTo]);

  const handleGenerate = () => {
    if (needsTarget && !targetId) {
      toast.error('Choose who this report is for.');
      return;
    }
    const dto: GenerateReportDto = {
      type,
      scope,
      ...(needsTarget && targetId ? { targetId } : {}),
      dateRange,
      ...(status || priority
        ? { filters: { ...(status ? { status } : {}), ...(priority ? { priority } : {}) } }
        : {}),
      format,
    };
    generate.mutate(dto, {
      onSuccess: () => toast.success('Report downloaded.'),
      onError: () => toast.error('Could not generate the report. Try again.'),
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500">Build and download a report — pick what, who, and when.</p>
      </div>

      {/* 1 · What */}
      <section className="rounded-lg border border-surface-border bg-white p-5 shadow-card">
        <SectionLabel>1 · Report</SectionLabel>
        <div className="grid gap-2 sm:grid-cols-2">
          {REPORT_TYPES.map((r) => {
            const Icon = r.icon;
            const active = type === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setType(r.id)}
                className={cn(
                  'relative flex items-start gap-3 overflow-hidden rounded-lg border p-4 text-left transition-colors',
                  active ? 'border-brand-500 bg-brand-50' : 'border-surface-border hover:bg-surface-muted'
                )}
              >
                {active && <span className="absolute inset-y-0 left-0 w-[3px] bg-brand-500" />}
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', active ? 'text-brand-600' : 'text-slate-400')} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{r.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{r.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2 · Who */}
      <section className="rounded-lg border border-surface-border bg-white p-5 shadow-card">
        <SectionLabel>2 · Coverage</SectionLabel>
        <Segmented
          options={scopeOptions}
          value={scope}
          onChange={(v) => {
            setScope(v);
            setTargetId('');
          }}
        />
        {needsTarget && (
          <div className="mt-4 max-w-sm">
            <Select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              options={[
                { value: '', label: scope === 'department' ? 'Select a department…' : 'Select a person…' },
                ...targetOptions,
              ]}
            />
          </div>
        )}
        {!isSA && <p className="mt-3 text-xs text-slate-400">Admins can only report on their own department.</p>}
      </section>

      {/* 3 · When */}
      <section className="rounded-lg border border-surface-border bg-white p-5 shadow-card">
        <SectionLabel>3 · Date range</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                preset === p.id
                  ? 'border-brand-500 bg-brand-50 text-brand-600'
                  : 'border-surface-border text-slate-600 hover:bg-surface-muted'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-slate-500">From</span>
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-md border border-surface-border px-3 py-1.5 text-sm outline-none focus:border-brand-500"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-slate-500">To</span>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={dayjs().format('YYYY-MM-DD')}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-md border border-surface-border px-3 py-1.5 text-sm outline-none focus:border-brand-500"
              />
            </label>
          </div>
        )}
      </section>

      {/* 4 · Filters (optional) */}
      <section className="rounded-lg border border-surface-border bg-white p-5 shadow-card">
        <SectionLabel>4 · Filters (optional)</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[{ value: '', label: 'Any status' }, ...STATUS_OPTS.map((s) => ({ value: s, label: s.replace('_', ' ') }))]}
          />
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={[{ value: '', label: 'Any priority' }, ...PRIORITY_OPTS.map((p) => ({ value: p, label: p }))]}
          />
        </div>
      </section>

      {/* 5 · Format + generate */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-surface-border bg-white p-5 shadow-card">
        <div>
          <SectionLabel>5 · Format</SectionLabel>
          <Segmented options={FORMATS} value={format} onChange={setFormat} />
        </div>
        <Button leftIcon={<Download className="h-4 w-4" />} onClick={handleGenerate} loading={generate.isPending} size="lg">
          Generate &amp; download
        </Button>
      </section>
    </div>
  );
}
