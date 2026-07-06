import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { auditApi } from '@godigitify/api-client';
import type { AuditFilters, AuditLogEntry } from '@godigitify/types';

import { queryKeys } from '../constants/queryKeys';
import { useApiMutation } from './useApiMutation';
import {
  categoryFor,
  fromDateForRange,
  type AuditCategory,
  type AuditDateRange,
} from '../utils/auditPresentation';

// ─── Filter state ─────────────────────────────────────────────────────────────
// UI-facing filter shape — the "category" quick-filter maps to the backend's
// `entityType` for USER/TASK/DEPARTMENT, but SECURITY/SYSTEM have no single
// entityType equivalent (they're derived from `action`, see auditPresentation),
// so those two are applied as a thin client-side pass over the fetched page.

export type AuditUIFilters = {
  category: AuditCategory | 'ALL';
  search: string;
  actorId: string | 'ANY';
  dateRange: AuditDateRange;
};

export const DEFAULT_AUDIT_FILTERS: AuditUIFilters = {
  category: 'ALL',
  search: '',
  actorId: 'ANY',
  dateRange: 'LAST_30_DAYS',
};

const CATEGORY_ENTITY_TYPE: Partial<Record<AuditCategory, string>> = {
  USER: 'User',
  TASK: 'Task',
  DEPARTMENT: 'Department',
};

function toApiFilters(filters: AuditUIFilters): AuditFilters {
  const entityType = CATEGORY_ENTITY_TYPE[filters.category as AuditCategory];
  const actorId = filters.actorId !== 'ANY' ? filters.actorId : undefined;
  const from = fromDateForRange(filters.dateRange);
  const search = filters.search.trim() || undefined;

  const apiFilters: AuditFilters = {};
  if (entityType !== undefined) apiFilters.entityType = entityType;
  if (actorId !== undefined) apiFilters.actorId = actorId;
  if (from !== undefined) apiFilters.from = from;
  if (search !== undefined) apiFilters.search = search;
  return apiFilters;
}

export const useAuditFilterState = () => {
  const [filters, setFilters] = useState<AuditUIFilters>(DEFAULT_AUDIT_FILTERS);

  const setCategory = (category: AuditCategory | 'ALL') => setFilters((f) => ({ ...f, category }));

  const setSearch = (search: string) => setFilters((f) => ({ ...f, search }));

  const applySheet = (partial: Partial<AuditUIFilters>) => setFilters((f) => ({ ...f, ...partial }));

  const resetFilters = () => setFilters(DEFAULT_AUDIT_FILTERS);

  const hasActiveFilters =
    filters.actorId !== DEFAULT_AUDIT_FILTERS.actorId || filters.dateRange !== DEFAULT_AUDIT_FILTERS.dateRange;

  return { filters, setCategory, setSearch, applySheet, resetFilters, hasActiveFilters };
};

// ─── List query ───────────────────────────────────────────────────────────────

export const useAuditList = (filters: AuditUIFilters) => {
  const apiFilters = toApiFilters(filters);

  return useQuery({
    queryKey: queryKeys.audit.list(apiFilters as Record<string, unknown>),
    queryFn: () => auditApi.getList(apiFilters),
    select: (res) => res.data, // { items: AuditLogEntry[], total, page, limit }
  });
};

// ─── Day grouping — pure client-side transform over the fetched page ────────

export type AuditDayGroup = { label: string; events: AuditLogEntry[] };

export function groupAuditEventsByDay(events: AuditLogEntry[]): AuditDayGroup[] {
  const groups = new Map<string, AuditLogEntry[]>();

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

// ─── Fetch + (thin client pass for SECURITY/SYSTEM) + group combined ────────

export const useFilteredAuditEvents = (filters: AuditUIFilters) => {
  const query = useAuditList(filters);
  const items = query.data?.items ?? [];

  const filtered = useMemo(() => {
    if (filters.category !== 'SECURITY' && filters.category !== 'SYSTEM') return items;
    return items.filter((e) => categoryFor(e) === filters.category);
  }, [items, filters.category]);

  const groups = useMemo(() => groupAuditEventsByDay(filtered), [filtered]);

  return {
    groups,
    items: filtered,
    count: filtered.length,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

// ─── Actors — no dedicated org-roster endpoint; derive options from the
// actors visible in the currently fetched page (matches AUDIT_VIEW_ORG scope
// well enough for a filter picker without a new backend call). ──────────────

export const useAuditActorOptions = (items: AuditLogEntry[]) =>
  useMemo(() => {
    const seen = new Map<string, { id: string; name: string; role: string; employeeId?: string | null }>();
    for (const item of items) {
      if (item.actor && !seen.has(item.actor.id)) seen.set(item.actor.id, item.actor);
    }
    return Array.from(seen.values());
  }, [items]);

// ─── Integrity verification ──────────────────────────────────────────────────

// No successMessage — a 200 response here just means the check ran; the
// chain itself may report back "broken", which the screen already renders.
// A generic success toast would misleadingly suggest the chain is intact.
export const useVerifyAuditEntry = () =>
  useApiMutation({
    mutationFn: (id: string) => auditApi.verify(id),
  });
