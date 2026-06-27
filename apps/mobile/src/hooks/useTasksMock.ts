import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import type { TaskStatus, TaskPriority } from '@godigitify/types';
import {
  MOCK_TASKS,
  isTaskOverdue,
  PRIORITY_ORDER,
  type MockTask,
} from '../data/tasks.mock';

// ─── Filter / sort types ──────────────────────────────────────────────────────

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

// ─── Simulated network delay ──────────────────────────────────────────────────

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Filter + sort engine ─────────────────────────────────────────────────────

function applyFilters(tasks: MockTask[], filters: TaskFilters): MockTask[] {
  let result = tasks;

  // Status filter (includes OVERDUE pseudo-status)
  if (filters.status !== 'ALL') {
    if (filters.status === 'OVERDUE') {
      result = result.filter(isTaskOverdue);
    } else {
      result = result.filter((t) => t.status === filters.status);
    }
  }

  // Priority multi-filter
  if (filters.priorities.length > 0) {
    result = result.filter((t) => filters.priorities.includes(t.priority));
  }

  // Department filter
  if (filters.departmentId) {
    result = result.filter((t) => t.department.id === filters.departmentId);
  }

  // Search: title, department, project, assignee, creator
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.department.name.toLowerCase().includes(q) ||
        t.project.name.toLowerCase().includes(q) ||
        t.assignee.name.toLowerCase().includes(q) ||
        t.creator.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.labels.some((l) => l.toLowerCase().includes(q))
    );
  }

  // Sort
  result = [...result].sort((a, b) => {
    const dir = filters.sortOrder === 'asc' ? 1 : -1;
    switch (filters.sortBy) {
      case 'dueDate':
        return (dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf()) * dir;
      case 'createdAt':
        return (dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf()) * dir;
      case 'priority':
        return (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * dir;
      case 'title':
        return a.title.localeCompare(b.title) * dir;
      default:
        return 0;
    }
  });

  return result;
}

// ─── Hook: task list ──────────────────────────────────────────────────────────

export const useMockTaskList = (filters: TaskFilters) => {
  const query = useQuery({
    queryKey: ['mock-tasks', 'list'],
    queryFn: async () => {
      await delay(600);
      return MOCK_TASKS;
    },
    staleTime: 5 * 60 * 1_000,
  });

  const filtered = useMemo(
    () => (query.data ? applyFilters(query.data, filters) : []),
    [query.data, filters]
  );

  const todayTasks = useMemo(
    () =>
      filtered.filter((t) => {
        const due = dayjs(t.dueDate);
        return due.isSame(dayjs(), 'day');
      }),
    [filtered]
  );

  const upcomingTasks = useMemo(
    () =>
      filtered.filter((t) => {
        const due = dayjs(t.dueDate);
        return due.isAfter(dayjs(), 'day');
      }),
    [filtered]
  );

  const overdueTasks = useMemo(
    () => filtered.filter(isTaskOverdue),
    [filtered]
  );

  return {
    ...query,
    tasks: filtered,
    todayTasks,
    upcomingTasks,
    overdueTasks,
  };
};

// ─── Hook: task stats ─────────────────────────────────────────────────────────

export const useMockTaskStats = () =>
  useQuery({
    queryKey: ['mock-tasks', 'stats'],
    queryFn: async () => {
      await delay(400);
      return {
        total: MOCK_TASKS.length,
        pending: MOCK_TASKS.filter((t) => t.status === 'PENDING').length,
        inProgress: MOCK_TASKS.filter((t) => t.status === 'IN_PROGRESS').length,
        completed: MOCK_TASKS.filter((t) => t.status === 'COMPLETED').length,
        underReview: MOCK_TASKS.filter((t) => t.status === 'UNDER_REVIEW').length,
        overdue: MOCK_TASKS.filter(isTaskOverdue).length,
      };
    },
    staleTime: 5 * 60 * 1_000,
  });

// ─── Hook: single task detail ─────────────────────────────────────────────────

export const useMockTaskDetail = (id: string) =>
  useQuery({
    queryKey: ['mock-tasks', 'detail', id],
    queryFn: async () => {
      await delay(500);
      return MOCK_TASKS.find((t) => t.id === id) ?? null;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1_000,
  });

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
