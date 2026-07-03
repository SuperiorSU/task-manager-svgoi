/**
 * Admin — Workload & Task History module (HTML reference screens 73–75:
 * "Team workload — full", "User task history — filterable", "Task history
 * filters — sheet"), reached from Admin Dashboard → Workload distribution →
 * See all (screen 23).
 *
 * Unlike the Super Admin oversight module (see superAdminTasks.mock.ts),
 * every member of the Admin's own department already has real MockTask
 * records in tasks.mock.ts — so there is no authored aggregate mock here.
 * Workload numbers are computed live from MOCK_TASKS + MOCK_USERS in
 * adminWorkload.service.ts. This file only holds the tier taxonomy, the
 * capacity target, and small presentation constants shared by the service
 * and the screens.
 *
 * Swap the service's methods for GET /users?departmentId=&includeTaskLoad=1
 * and GET /users/:id/tasks?departmentId= when the backend is ready.
 */

import { ADMIN_DEPT } from './team.mock';

export { ADMIN_DEPT };

// ─── Capacity tiers ───────────────────────────────────────────────────────────
// 4-tier scheme matching HTML screen 73's bar-fill colours exactly: an "OVER"
// badge above 100% target, an unbadged amber "high" band, an unbadged blue
// "balanced" band, and a "FREE" badge below 40%.

export type WorkloadTier = 'OVER' | 'HIGH' | 'BALANCED' | 'FREE';

export const WORKLOAD_TIER_META: Record<
  WorkloadTier,
  { badgeLabel?: string; badgeBg?: string; badgeColor?: string; barColor: string }
> = {
  OVER: { badgeLabel: 'OVER', badgeBg: '#FEF2F2', badgeColor: '#B91C1C', barColor: '#EF4444' },
  HIGH: { barColor: '#F59E0B' },
  BALANCED: { barColor: '#1A5CF8' },
  FREE: { badgeLabel: 'FREE', badgeBg: '#F0FDF4', badgeColor: '#15803D', barColor: '#16A34A' },
};

export function tierForCapacityPercent(percent: number): WorkloadTier {
  if (percent >= 100) return 'OVER';
  if (percent >= 70) return 'HIGH';
  if (percent >= 40) return 'BALANCED';
  return 'FREE';
}

/** Active tasks considered a "full load" per member — matches the HTML's top
 * (100%-width) row showing "8 active". */
export const WORKLOAD_CAPACITY_TARGET = 8;

// ─── Avatar palette (deterministic by initials) ───────────────────────────────
// Same palette AdminDashboardScreen uses locally, centralised here so the
// dashboard's workload widget and this module never disagree on a member's
// colour.

export const WORKLOAD_AVATAR_PALETTES = [
  { bg: '#EEF2FF', fg: '#4338CA' },
  { bg: '#FDF2F8', fg: '#9D174D' },
  { bg: '#F0FDF4', fg: '#15803D' },
  { bg: '#FFFBEB', fg: '#B45309' },
  { bg: '#F1F5F9', fg: '#475569' },
  { bg: '#FEF2F2', fg: '#B91C1C' },
] as const;

export function paletteForInitials(initials: string): { bg: string; fg: string } {
  const idx = initials.charCodeAt(0) % WORKLOAD_AVATAR_PALETTES.length;
  return WORKLOAD_AVATAR_PALETTES[idx]!;
}

// ─── Task history filters (screen 75) ─────────────────────────────────────────

export type HistoryDateRange = 30 | 90 | 365 | 'ALL';
export type HistorySortOrder = 'newest' | 'oldest';
export type HistoryStatusChip = 'ALL' | 'COMPLETED' | 'OVERDUE' | 'ACTIVE';

export const DATE_RANGE_OPTIONS: { value: HistoryDateRange; label: string }[] = [
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: 'This year' },
  { value: 'ALL', label: 'All time' },
];

export const DEFAULT_DATE_RANGE: HistoryDateRange = 90;
