'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Building2, Bell, Shield, Clock, Save } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { PERMISSIONS } from '@/constants/permissions';

const ORG_DEFAULTS = {
  orgName: 'Shri Vaishnav Government Institute',
  orgShort: 'SVGOI',
  adminEmail: 'admin@svgoi.edu.in',
  supportEmail: 'support@svgoi.edu.in',
};

const orgSchema = z.object({
  orgName: z.string().min(3, 'Name is required'),
  orgShort: z.string().min(2).max(8),
  adminEmail: z.string().email(),
  supportEmail: z.string().email(),
});

const taskSchema = z.object({
  maxTasksPerUser: z.coerce.number().min(1).max(100),
  defaultTaskDueDays: z.coerce.number().min(1).max(365),
  taskReminderDays: z.coerce.number().min(1).max(30),
});

const securitySchema = z.object({
  sessionTimeoutMinutes: z.coerce.number().min(5).max(1440),
  maxLoginAttempts: z.coerce.number().min(3).max(20),
});

type Section = 'org' | 'tasks' | 'notifications' | 'security';

const SectionCard = ({
  title,
  icon: Icon,
  description,
  active,
  onClick,
}: {
  title: string;
  icon: React.ElementType;
  description: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
      active
        ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
        : 'border-surface-border bg-white hover:bg-surface-muted shadow-card'
    }`}
  >
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-brand-100' : 'bg-surface-muted'}`}>
      <Icon className={`h-4 w-4 ${active ? 'text-brand-600' : 'text-slate-500'}`} />
    </div>
    <div>
      <p className={`text-sm font-semibold ${active ? 'text-brand-900' : 'text-slate-900'}`}>{title}</p>
      <p className="mt-0.5 text-xs text-slate-500">{description}</p>
    </div>
  </button>
);

const Toggle = ({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="text-sm font-medium text-slate-900">{label}</p>
      {description && <p className="text-xs text-slate-500">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
        value ? 'bg-brand-500' : 'bg-slate-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
          value ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('org');
  const [requireMfa, setRequireMfa] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [overdueAlerts, setOverdueAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [saving, setSaving] = useState(false);

  const orgForm = useForm({
    resolver: zodResolver(orgSchema),
    defaultValues: ORG_DEFAULTS,
  });
  const taskForm = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: { maxTasksPerUser: 20, defaultTaskDueDays: 7, taskReminderDays: 2 },
  });
  const securityForm = useForm({
    resolver: zodResolver(securitySchema),
    defaultValues: { sessionTimeoutMinutes: 60, maxLoginAttempts: 5 },
  });

  const simulateSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Settings saved');
    }, 800);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage organisation-wide configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* Nav */}
        <div className="space-y-2 lg:col-span-1">
          <SectionCard title="Organisation" icon={Building2} description="Name, contact, locale" active={activeSection === 'org'} onClick={() => setActiveSection('org')} />
          <SectionCard title="Task Defaults" icon={Clock} description="Limits, durations, reminders" active={activeSection === 'tasks'} onClick={() => setActiveSection('tasks')} />
          <SectionCard title="Notifications" icon={Bell} description="Alerts and digests" active={activeSection === 'notifications'} onClick={() => setActiveSection('notifications')} />
          <SectionCard title="Security" icon={Shield} description="Sessions, login, MFA" active={activeSection === 'security'} onClick={() => setActiveSection('security')} />
        </div>

        {/* Panel */}
        <div className="lg:col-span-3">
          {activeSection === 'org' && (
            <form
              onSubmit={orgForm.handleSubmit(simulateSave)}
              className="rounded-xl border border-surface-border bg-white p-6 shadow-card space-y-5"
            >
              <h2 className="text-sm font-semibold text-slate-900">Organisation Information</h2>
              <Input label="Organisation Name" error={orgForm.formState.errors.orgName?.message} {...orgForm.register('orgName')} />
              <Input label="Short Code / Abbreviation" error={orgForm.formState.errors.orgShort?.message} {...orgForm.register('orgShort')} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Admin Email" type="email" error={orgForm.formState.errors.adminEmail?.message} {...orgForm.register('adminEmail')} />
                <Input label="Support Email" type="email" error={orgForm.formState.errors.supportEmail?.message} {...orgForm.register('supportEmail')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Timezone</label>
                  <select className="w-full rounded-lg border border-surface-border bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Date Format</label>
                  <select className="w-full rounded-lg border border-surface-border bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
              <PermissionGate permission={PERMISSIONS.SETTINGS_UPDATE}>
                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={saving} leftIcon={<Save className="h-3.5 w-3.5" />} size="sm">Save</Button>
                </div>
              </PermissionGate>
            </form>
          )}

          {activeSection === 'tasks' && (
            <form
              onSubmit={taskForm.handleSubmit(simulateSave)}
              className="rounded-xl border border-surface-border bg-white p-6 shadow-card space-y-5"
            >
              <h2 className="text-sm font-semibold text-slate-900">Task Configuration</h2>
              <p className="text-xs text-slate-500">Defaults applied when creating new tasks. Existing tasks are not affected.</p>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Max Tasks per User" type="number" min={1} max={100} error={taskForm.formState.errors.maxTasksPerUser?.message} {...taskForm.register('maxTasksPerUser')} />
                <Input label="Default Due Days" type="number" min={1} max={365} error={taskForm.formState.errors.defaultTaskDueDays?.message} {...taskForm.register('defaultTaskDueDays')} />
              </div>
              <Input label="Reminder Days Before Due" type="number" min={1} max={30} error={taskForm.formState.errors.taskReminderDays?.message} {...taskForm.register('taskReminderDays')} />
              <PermissionGate permission={PERMISSIONS.SETTINGS_UPDATE}>
                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={saving} leftIcon={<Save className="h-3.5 w-3.5" />} size="sm">Save</Button>
                </div>
              </PermissionGate>
            </form>
          )}

          {activeSection === 'notifications' && (
            <div className="rounded-xl border border-surface-border bg-white p-6 shadow-card">
              <h2 className="mb-1 text-sm font-semibold text-slate-900">Notification Preferences</h2>
              <p className="mb-4 text-xs text-slate-500">Controls which automated notifications the system sends to users.</p>
              <div className="divide-y divide-surface-border">
                <Toggle label="Email Notifications" description="Send task assignment and status update emails" value={emailNotifications} onChange={setEmailNotifications} />
                <Toggle label="Overdue Task Alerts" description="Notify assignees and admins when tasks become overdue" value={overdueAlerts} onChange={setOverdueAlerts} />
                <Toggle label="Weekly Digest" description="Send a weekly summary of task activity to admins" value={weeklyDigest} onChange={setWeeklyDigest} />
              </div>
              <PermissionGate permission={PERMISSIONS.SETTINGS_UPDATE}>
                <div className="flex justify-end pt-4">
                  <Button onClick={simulateSave} loading={saving} leftIcon={<Save className="h-3.5 w-3.5" />} size="sm">Save</Button>
                </div>
              </PermissionGate>
            </div>
          )}

          {activeSection === 'security' && (
            <form
              onSubmit={securityForm.handleSubmit(simulateSave)}
              className="rounded-xl border border-surface-border bg-white p-6 shadow-card space-y-5"
            >
              <h2 className="text-sm font-semibold text-slate-900">Security Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Session Timeout (min)" type="number" min={5} max={1440} error={securityForm.formState.errors.sessionTimeoutMinutes?.message} {...securityForm.register('sessionTimeoutMinutes')} />
                <Input label="Max Login Attempts" type="number" min={3} max={20} error={securityForm.formState.errors.maxLoginAttempts?.message} {...securityForm.register('maxLoginAttempts')} />
              </div>
              <div className="divide-y divide-surface-border">
                <Toggle label="Require MFA for Admin / SA" description="Enforce two-factor authentication for elevated roles" value={requireMfa} onChange={setRequireMfa} />
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-medium text-amber-800">Note</p>
                <p className="mt-0.5 text-xs text-amber-700">
                  Security changes take effect on next login. Active sessions remain valid until they expire naturally.
                </p>
              </div>
              <PermissionGate permission={PERMISSIONS.SETTINGS_UPDATE}>
                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={saving} leftIcon={<Save className="h-3.5 w-3.5" />} size="sm">Save</Button>
                </div>
              </PermissionGate>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
