'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import type { OrganizationConfig, UpdateOrganizationConfigDto } from '@godigitify/types';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { PERMISSIONS } from '@/constants/permissions';
import { useOrgConfig, useUpdateOrgConfig } from '@/hooks/useOrgConfig';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

// ── building blocks (flat, bordered — no heavy shadow / pastel chrome) ─────────

const Section = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <section className="rounded-lg border border-surface-border bg-white p-6 shadow-card">
    <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
    {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
    <div className="mt-4 space-y-4">{children}</div>
  </section>
);

const Toggle = ({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-medium text-slate-900">{label}</p>
      {description && <p className="text-xs text-slate-500">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${value ? 'bg-brand-500' : 'bg-slate-200'}`}
      role="switch"
      aria-checked={value}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full border-2 border-transparent bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
    {children}
  </label>
);

const selectCls = 'w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none';

// ── page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: config, isLoading } = useOrgConfig();
  const update = useUpdateOrgConfig();
  const [draft, setDraft] = useState<OrganizationConfig | null>(null);

  useEffect(() => {
    if (config && !draft) setDraft(config);
  }, [config, draft]);

  const patch = (p: Partial<OrganizationConfig>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const toggleDay = (day: number) =>
    patch({
      workingDays: draft?.workingDays.includes(day)
        ? draft.workingDays.filter((d) => d !== day)
        : [...(draft?.workingDays ?? []), day].sort((a, b) => a - b),
    });

  const handleSave = () => {
    if (!draft) return;
    const dto: UpdateOrganizationConfigDto = {
      orgName: draft.orgName,
      allowCrossDeptEmployeeAssignment: draft.allowCrossDeptEmployeeAssignment,
      defaultPriority: draft.defaultPriority,
      defaultDueWindowDays: draft.defaultDueWindowDays,
      taskCategories: draft.taskCategories,
      requireProofOfWork: draft.requireProofOfWork,
      autoApproveLowPriority: draft.autoApproveLowPriority,
      reviewWithinHours: draft.reviewWithinHours,
      escalateOverdueReviews: draft.escalateOverdueReviews,
      workingDays: draft.workingDays,
      workingHoursStart: draft.workingHoursStart,
      workingHoursEnd: draft.workingHoursEnd,
      weeklyHoliday: draft.weeklyHoliday,
    };
    update.mutate(dto, {
      onSuccess: () => toast.success('Settings saved'),
      onError: () => toast.error('Could not save settings'),
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Organisation-wide configuration. Applies to every department.</p>
      </div>

      {isLoading || !draft ? (
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg border border-surface-border bg-white" />
          ))}
        </div>
      ) : (
        <>
          <Section title="Organisation">
            <Input label="Organisation name" value={draft.orgName} onChange={(e) => patch({ orgName: e.target.value })} />
            <Toggle
              label="Cross-department employee assignment"
              description="Allow admins to assign tasks to employees outside their own department."
              value={draft.allowCrossDeptEmployeeAssignment}
              onChange={(v) => patch({ allowCrossDeptEmployeeAssignment: v })}
            />
          </Section>

          <Section title="Task defaults" description="Applied when new tasks are created. Existing tasks are unaffected.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Default priority">
                <select className={selectCls} value={draft.defaultPriority} onChange={(e) => patch({ defaultPriority: e.target.value as OrganizationConfig['defaultPriority'] })}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Field>
              <Input
                label="Default due window (days)"
                type="number"
                min={1}
                value={draft.defaultDueWindowDays}
                onChange={(e) => patch({ defaultDueWindowDays: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
            <Field label="Task categories (comma-separated)">
              <input
                className={selectCls}
                value={draft.taskCategories.join(', ')}
                onChange={(e) => patch({ taskCategories: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                placeholder="Lab, Safety, Admin, Events"
              />
            </Field>
          </Section>

          <Section title="Approvals & review">
            <Toggle label="Require proof of work" description="Members must attach a file before a task can be submitted for review." value={draft.requireProofOfWork} onChange={(v) => patch({ requireProofOfWork: v })} />
            <Toggle label="Auto-approve low priority" description="Low-priority tasks skip review and complete on submission." value={draft.autoApproveLowPriority} onChange={(v) => patch({ autoApproveLowPriority: v })} />
            <Toggle label="Escalate overdue reviews" description="Notify the Super Admin when a review sits past its SLA." value={draft.escalateOverdueReviews} onChange={(v) => patch({ escalateOverdueReviews: v })} />
            <div className="max-w-xs">
              <Input label="Review SLA (hours)" type="number" min={1} value={draft.reviewWithinHours} onChange={(e) => patch({ reviewWithinHours: Math.max(1, Number(e.target.value) || 1) })} />
            </div>
          </Section>

          <Section title="Working schedule" description="Defaults for newly created departments.">
            <Field label="Working days">
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((d, i) => {
                  const on = draft.workingDays.includes(i);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`h-9 w-11 rounded-md border text-sm font-medium transition-colors ${on ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-surface-border text-slate-500 hover:bg-surface-muted'}`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Start time">
                <input type="time" className={selectCls} value={draft.workingHoursStart} onChange={(e) => patch({ workingHoursStart: e.target.value })} />
              </Field>
              <Field label="End time">
                <input type="time" className={selectCls} value={draft.workingHoursEnd} onChange={(e) => patch({ workingHoursEnd: e.target.value })} />
              </Field>
              <Field label="Weekly holiday">
                <select className={selectCls} value={draft.weeklyHoliday} onChange={(e) => patch({ weeklyHoliday: Number(e.target.value) })}>
                  {DAYS.map((d, i) => (
                    <option key={d} value={i}>{d}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          <PermissionGate permission={PERMISSIONS.SETTINGS_UPDATE}>
            <div className="flex justify-end">
              <Button onClick={handleSave} loading={update.isPending} leftIcon={<Save className="h-4 w-4" />}>
                Save settings
              </Button>
            </div>
          </PermissionGate>
        </>
      )}
    </div>
  );
}
