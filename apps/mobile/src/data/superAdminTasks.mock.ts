/**
 * Super Admin Tasks (Oversight) — remaining static UI config.
 *
 * Department health, staff load, escalations, org-wide overview, and the
 * governance list/detail/create/approve/revise/summary flow are all wired to
 * the real backend now (see apps/mobile/src/hooks/useSuperAdminTasks.ts and
 * useGovernance.ts). All that's left here is GOVERNANCE_PRIORITY_OPTIONS —
 * static pill labels for AssignGovernanceTaskScreen's compose UI, not data.
 */

import type { TaskPriority } from '@godigitify/types';

// ─── Priority pill options for the compose screen (Low / Med / High only —
// matches HTML screen 61 exactly; Critical is intentionally not offered for
// governance/administrative tasks) ─────────────────────────────────────────

export const GOVERNANCE_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Med' },
  { value: 'HIGH', label: 'High' },
];
