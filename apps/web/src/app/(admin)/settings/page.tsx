import React from 'react';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">System configuration — Super Admin only</p>
      </div>
      <div className="rounded-xl border border-surface-border bg-white p-8 shadow-card text-center">
        <p className="text-slate-400">System settings will be available in Phase 2.</p>
      </div>
    </div>
  );
}
