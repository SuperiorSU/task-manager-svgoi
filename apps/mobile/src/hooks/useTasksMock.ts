import { useState } from 'react';

import type { TaskStatus, TaskPriority } from '@godigitify/types';

// ─── Filter / sort types ──────────────────────────────────────────────────────
// Local UI filter state for the Tasks screen — not mock data, just the shape
// of the in-memory filter draft before it's translated into API query params.

export type StatusFilter = TaskStatus | 'ALL' | 'OVERDUE';
export type SortBy = 'dueDate' | 'createdAt' | 'priority' | 'title';

export type TaskFilters = {
  status: StatusFilter;
  priorities: TaskPriority[];
  departmentId: string | null;
  sortBy: SortBy;
  sortOrder: 'asc' | 'desc';
  search: string;
};

export const DEFAULT_FILTERS: TaskFilters = {
  status: 'ALL',
  priorities: [],
  departmentId: null,
  sortBy: 'dueDate',
  sortOrder: 'asc',
  search: '',
};

// ─── Local filter state hook ──────────────────────────────────────────────────

export const useTaskFilterState = () => {
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);

  const setStatus = (status: StatusFilter) =>
    setFilters((f) => ({ ...f, status }));

  const setSearch = (search: string) =>
    setFilters((f) => ({ ...f, search }));

  const applySheet = (partial: Partial<TaskFilters>) =>
    setFilters((f) => ({ ...f, ...partial }));

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const hasActiveFilters =
    filters.priorities.length > 0 ||
    filters.departmentId !== null ||
    filters.sortBy !== DEFAULT_FILTERS.sortBy;

  return {
    filters,
    setStatus,
    setSearch,
    applySheet,
    resetFilters,
    hasActiveFilters,
  };
};
