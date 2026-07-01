import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  auditService,
  applyAuditFilters,
  groupAuditEventsByDay,
  DEFAULT_AUDIT_FILTERS,
  type AuditFilters,
} from '../services/audit.service';
import type { AuditCategory } from '../data/audit.mock';

// ─── Keys ─────────────────────────────────────────────────────────────────────

const QK = {
  events: ['sa', 'audit', 'events'] as const,
  event: (id: string) => ['sa', 'audit', 'event', id] as const,
  actors: ['sa', 'audit', 'actors'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useAuditEventsRaw = () =>
  useQuery({
    queryKey: QK.events,
    queryFn: auditService.getEvents,
    staleTime: 2 * 60 * 1000,
  });

export const useAuditEvent = (id: string) =>
  useQuery({
    queryKey: QK.event(id),
    queryFn: () => auditService.getEventById(id),
    enabled: Boolean(id),
    staleTime: 2 * 60 * 1000,
  });

export const useAuditActors = () =>
  useQuery({
    queryKey: QK.actors,
    queryFn: auditService.getActors,
    staleTime: 10 * 60 * 1000,
  });

// ─── Filter state ─────────────────────────────────────────────────────────────
// Mirrors useTaskFilterState (useTasksMock.ts) — draft state + setters +
// hasActiveFilters, kept generic so the same shape works once the backend
// swaps GET /audit to accept these as real query params.

export const useAuditFilterState = () => {
  const [filters, setFilters] = useState<AuditFilters>(DEFAULT_AUDIT_FILTERS);

  const setCategory = (category: AuditCategory | 'ALL') =>
    setFilters((f) => ({ ...f, category }));

  const setSearch = (search: string) => setFilters((f) => ({ ...f, search }));

  const applySheet = (partial: Partial<AuditFilters>) =>
    setFilters((f) => ({ ...f, ...partial }));

  const resetFilters = () => setFilters(DEFAULT_AUDIT_FILTERS);

  const hasActiveFilters =
    filters.actorId !== DEFAULT_AUDIT_FILTERS.actorId ||
    filters.departmentId !== DEFAULT_AUDIT_FILTERS.departmentId ||
    filters.dateRange !== DEFAULT_AUDIT_FILTERS.dateRange;

  return { filters, setCategory, setSearch, applySheet, resetFilters, hasActiveFilters };
};

// ─── Fetch + filter + group combined (mirrors useMockTaskList) ───────────────

export const useFilteredAuditEvents = (filters: AuditFilters) => {
  const query = useAuditEventsRaw();

  const filtered = useMemo(
    () => (query.data ? applyAuditFilters(query.data, filters) : []),
    [query.data, filters]
  );

  const groups = useMemo(() => groupAuditEventsByDay(filtered), [filtered]);

  return {
    groups,
    count: filtered.length,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};
