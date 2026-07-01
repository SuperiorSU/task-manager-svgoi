/**
 * Super Admin Audit Service — org-wide immutable activity log.
 *
 * Mock implementation over a static in-memory dataset (audit records are
 * append-only in production — there is no write path here, matching
 * 07_security_compliance_directive.md §4.2 "no UPDATE or DELETE endpoints").
 * Replace method bodies with real API calls (GET /audit, GET /audit/:id,
 * GET /audit/actors) when the backend is ready. Filtering/sorting/grouping
 * are pure functions decoupled from fetching, so they keep working unchanged
 * against real API responses.
 */

import dayjs from 'dayjs';

import {
  MOCK_AUDIT_ACTORS,
  MOCK_AUDIT_EVENTS,
  type AuditActor,
  type AuditCategory,
  type AuditDateRange,
  type AuditEvent,
} from '../data/audit.mock';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export type AuditFilters = {
  category: AuditCategory | 'ALL';
  search: string;
  actorId: string | 'ANY';
  departmentId: string | 'ALL';
  dateRange: AuditDateRange;
};

export const DEFAULT_AUDIT_FILTERS: AuditFilters = {
  category: 'ALL',
  search: '',
  actorId: 'ANY',
  departmentId: 'ALL',
  dateRange: 'LAST_30_DAYS',
};

const DATE_RANGE_DAYS: Record<AuditDateRange, number | null> = {
  TODAY: 1,
  LAST_7_DAYS: 7,
  LAST_30_DAYS: 30,
  CUSTOM: 90, // no dedicated custom range picker in the mobile app yet — generous fallback window
};

// ─── Generic filter/search engine — pure function, no fetching ───────────────

export function applyAuditFilters(events: AuditEvent[], filters: AuditFilters): AuditEvent[] {
  let result = events;

  if (filters.category !== 'ALL') {
    result = result.filter((e) => e.category === filters.category);
  }

  if (filters.actorId !== 'ANY') {
    result = result.filter((e) => e.actor.id === filters.actorId);
  }

  if (filters.departmentId !== 'ALL') {
    result = result.filter((e) => e.departmentId === filters.departmentId);
  }

  const rangeDays = DATE_RANGE_DAYS[filters.dateRange];
  if (rangeDays !== null) {
    const cutoff = dayjs().subtract(rangeDays, 'day');
    result = result.filter((e) => dayjs(e.createdAt).isAfter(cutoff));
  }

  const q = filters.search.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        e.headline.toLowerCase().includes(q) ||
        e.actor.name.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        (e.departmentName ?? '').toLowerCase().includes(q)
    );
  }

  return [...result].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
}

export type AuditDayGroup = { label: string; events: AuditEvent[] };

export function groupAuditEventsByDay(events: AuditEvent[]): AuditDayGroup[] {
  const groups = new Map<string, AuditEvent[]>();

  for (const event of events) {
    const created = dayjs(event.createdAt);
    let label: string;
    if (created.isSame(dayjs(), 'day')) {
      label = `Today · ${created.format('D MMM')}`;
    } else if (created.isSame(dayjs().subtract(1, 'day'), 'day')) {
      label = `Yesterday · ${created.format('D MMM')}`;
    } else {
      label = created.format('D MMMM YYYY');
    }

    const bucket = groups.get(label);
    if (bucket) bucket.push(event);
    else groups.set(label, [event]);
  }

  return Array.from(groups.entries()).map(([label, groupEvents]) => ({ label, events: groupEvents }));
}

export const auditService = {
  async getEvents(): Promise<AuditEvent[]> {
    await delay(400);
    return MOCK_AUDIT_EVENTS;
  },

  async getEventById(id: string): Promise<AuditEvent | undefined> {
    await delay(300);
    return MOCK_AUDIT_EVENTS.find((e) => e.id === id);
  },

  async getActors(): Promise<AuditActor[]> {
    await delay(200);
    return MOCK_AUDIT_ACTORS;
  },
};
