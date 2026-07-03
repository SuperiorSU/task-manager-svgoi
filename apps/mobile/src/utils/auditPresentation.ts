// ─── Audit Log — presentation mapping ──────────────────────────────────────
// The real `AuditLogEntry` (from @godigitify/types) is a lean, backend-shaped
// record: { action, entityType, entityId, description, metadata, ... }. The
// richer visual vocabulary the UI wants (category, headline, icon, colors,
// context label) was always meant to be derived client-side, never stored —
// this module is that derivation, kept pure and decoupled from fetching so
// it works the same whether the data came from React Query or a future cache.

import dayjs from 'dayjs';
import type { Feather } from '@expo/vector-icons';
import type { AuditLogEntry } from '@godigitify/types';

export type AuditCategory = 'USER' | 'TASK' | 'DEPARTMENT' | 'SECURITY' | 'SYSTEM';

export type AuditDetailField = {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
};

// ─── Category metadata — single source of truth for chips + badges ───────────

export const AUDIT_CATEGORY_META: Record<AuditCategory, { label: string; badgeBg: string; badgeColor: string }> = {
  USER: { label: 'USER', badgeBg: '#EEF2FF', badgeColor: '#4F46E5' },
  TASK: { label: 'TASK', badgeBg: '#EFF6FF', badgeColor: '#1D4ED8' },
  DEPARTMENT: { label: 'DEPARTMENT', badgeBg: '#EEF2FF', badgeColor: '#4F46E5' },
  SECURITY: { label: 'SECURITY', badgeBg: '#FEF2F2', badgeColor: '#B91C1C' },
  SYSTEM: { label: 'SYSTEM', badgeBg: '#F0FDF4', badgeColor: '#15803D' },
};

const CATEGORY_ICON: Record<AuditCategory, keyof typeof Feather.glyphMap> = {
  USER: 'user-plus',
  TASK: 'list',
  DEPARTMENT: 'briefcase',
  SECURITY: 'lock',
  SYSTEM: 'settings',
};

// Quick-filter chip set on the main log screen.
export const AUDIT_QUICK_CATEGORIES: { value: AuditCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'USER', label: 'Users' },
  { value: 'TASK', label: 'Tasks' },
  { value: 'SECURITY', label: 'Security' },
];

// Full category set in the filter sheet.
export const AUDIT_FILTER_CATEGORIES: { value: AuditCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'USER', label: 'Users' },
  { value: 'TASK', label: 'Tasks' },
  { value: 'DEPARTMENT', label: 'Departments' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'SYSTEM', label: 'System' },
];

export type AuditDateRange = 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'CUSTOM';

export const AUDIT_DATE_RANGE_OPTIONS: { value: AuditDateRange; label: string }[] = [
  { value: 'TODAY', label: 'Today' },
  { value: 'LAST_7_DAYS', label: '7 days' },
  { value: 'LAST_30_DAYS', label: '30 days' },
  { value: 'CUSTOM', label: 'Custom' },
];

const DATE_RANGE_DAYS: Record<AuditDateRange, number | null> = {
  TODAY: 1,
  LAST_7_DAYS: 7,
  LAST_30_DAYS: 30,
  CUSTOM: null, // no dedicated custom range picker in the mobile app yet — no `from` sent
};

/** Turns a quick date-range pill into a `from` ISO string for the API, or undefined for "no lower bound". */
export function fromDateForRange(range: AuditDateRange): string | undefined {
  const days = DATE_RANGE_DAYS[range];
  return days === null ? undefined : dayjs().subtract(days, 'day').toISOString();
}

// ─── Category derivation ───────────────────────────────────────────────────

const SECURITY_ACTIONS = new Set(['LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGED']);

const ENTITY_CATEGORY: Record<string, AuditCategory> = {
  User: 'USER',
  Task: 'TASK',
  GovernanceTask: 'TASK',
  Department: 'DEPARTMENT',
};

export function categoryFor(entry: Pick<AuditLogEntry, 'action' | 'entityType'>): AuditCategory {
  if (SECURITY_ACTIONS.has(entry.action)) return 'SECURITY';
  return ENTITY_CATEGORY[entry.entityType] ?? 'SYSTEM';
}

// ─── Headline derivation ───────────────────────────────────────────────────

const ACTION_VERB: Record<string, string> = {
  CREATE: 'Created',
  READ: 'Viewed',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  LOGIN: 'Logged in',
  LOGOUT: 'Logged out',
  LOGIN_FAILED: 'Failed login attempt',
  PASSWORD_CHANGED: 'Changed password',
  ROLE_CHANGED: 'Changed role',
  STATUS_CHANGED: 'Changed status',
  ASSIGNED: 'Assigned',
  REASSIGNED: 'Reassigned',
};

const ENTITY_NOUN: Record<string, string> = {
  User: 'user',
  Task: 'task',
  GovernanceTask: 'task',
  Department: 'department',
};

const NO_NOUN_ACTIONS = new Set(['LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGED']);

/** Short, human title for the detail screen header — e.g. "Created task", "Changed status". */
export function headlineFor(entry: Pick<AuditLogEntry, 'action' | 'entityType'>): string {
  const verb = ACTION_VERB[entry.action] ?? entry.action;
  if (NO_NOUN_ACTIONS.has(entry.action)) return verb;
  const noun = ENTITY_NOUN[entry.entityType];
  return noun ? `${verb} ${noun}` : verb;
}

// ─── Context label ─────────────────────────────────────────────────────────

/** List-row meta text — department name from metadata when present, else the entity type. */
export function contextLabelFor(entry: Pick<AuditLogEntry, 'entityType' | 'metadata'>): string {
  const meta = entry.metadata;
  const deptName = meta && typeof meta['departmentName'] === 'string' ? (meta['departmentName'] as string) : undefined;
  return deptName ?? entry.entityType;
}

// ─── Combined presentation ──────────────────────────────────────────────────

export type AuditPresentation = {
  category: AuditCategory;
  headline: string;
  icon: keyof typeof Feather.glyphMap;
  iconBg: string;
  iconColor: string;
  contextLabel: string;
};

export function presentAuditEntry(entry: AuditLogEntry): AuditPresentation {
  const category = categoryFor(entry);
  const meta = AUDIT_CATEGORY_META[category];
  return {
    category,
    headline: headlineFor(entry),
    icon: CATEGORY_ICON[category],
    iconBg: meta.badgeBg,
    iconColor: meta.badgeColor,
    contextLabel: contextLabelFor(entry),
  };
}

// ─── Detail screen fields ──────────────────────────────────────────────────

export function detailFieldsFor(entry: AuditLogEntry): AuditDetailField[] {
  const fields: AuditDetailField[] = [
    { label: 'Timestamp', value: dayjs(entry.createdAt).format('D MMM YYYY, HH:mm:ss') },
    { label: 'Entity', value: `${entry.entityType} · ${entry.entityId}` },
  ];

  if (entry.metadata) {
    for (const [key, value] of Object.entries(entry.metadata)) {
      if (value === null || value === undefined) continue;
      fields.push({ label: key, value: String(value), accent: true });
    }
  }

  if (entry.ipAddress) fields.push({ label: 'IP address', value: entry.ipAddress, mono: true });
  if (entry.userAgent) fields.push({ label: 'Device', value: entry.userAgent });

  return fields;
}

// ─── Actor initials — real actor payload has no `initials` field ──────────

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}
