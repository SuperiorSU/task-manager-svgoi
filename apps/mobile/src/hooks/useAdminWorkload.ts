import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { isTaskOverdue, type MockTask } from '../data/tasks.mock';
import {
  DEFAULT_DATE_RANGE,
  type HistoryDateRange,
  type HistorySortOrder,
  type HistoryStatusChip,
} from '../data/adminWorkload.mock';
import { adminWorkloadService } from '../services/adminWorkload.service';

const QK = {
  team: ['admin', 'workload', 'team'] as const,
  member: (userId: string) => ['admin', 'workload', 'member', userId] as const,
  memberTasks: (userId: string) => ['admin', 'workload', 'member', userId, 'tasks'] as const,
  profileLink: (name: string) => ['admin', 'workload', 'profile-link', name] as const,
};

// ─── Query hooks ──────────────────────────────────────────────────────────────

export const useTeamWorkload = () =>
  useQuery({
    queryKey: QK.team,
    queryFn: adminWorkloadService.getTeamWorkload,
    staleTime: 2 * 60 * 1000,
  });

export const useMemberWorkload = (userId: string) =>
  useQuery({
    queryKey: QK.member(userId),
    queryFn: () => adminWorkloadService.getMemberWorkload(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

export const useMemberTasksRaw = (userId: string) =>
  useQuery({
    queryKey: QK.memberTasks(userId),
    queryFn: () => adminWorkloadService.getMemberTasks(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

export const useMemberProfileLink = (memberName: string | undefined) =>
  useQuery({
    queryKey: QK.profileLink(memberName ?? ''),
    queryFn: () => adminWorkloadService.resolveProfileId(memberName ?? ''),
    enabled: !!memberName,
    staleTime: 5 * 60 * 1000,
  });

// ─── Task history filter state (screens 74/75) ────────────────────────────────

export type MemberHistoryFilters = {
  statusChip: HistoryStatusChip;
  dateRange: HistoryDateRange;
  sortOrder: HistorySortOrder;
  search: string;
};

export const DEFAULT_HISTORY_FILTERS: MemberHistoryFilters = {
  statusChip: 'ALL',
  dateRange: DEFAULT_DATE_RANGE,
  sortOrder: 'newest',
  search: '',
};

function inDateRange(task: MockTask, range: HistoryDateRange): boolean {
  if (range === 'ALL') return true;
  return dayjs(task.createdAt).isAfter(dayjs().subtract(range, 'day'));
}

function matchesStatusChip(task: MockTask, chip: HistoryStatusChip): boolean {
  switch (chip) {
    case 'ALL':
      return true;
    case 'COMPLETED':
      return task.status === 'COMPLETED';
    case 'OVERDUE':
      return isTaskOverdue(task);
    case 'ACTIVE':
      return !isTaskOverdue(task) && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
  }
}

/** Applies date range + status chip + search, in that order — used for both
 * the rendered list and the filter sheet's live "Show N tasks" preview. */
export function filterMemberTasks(
  tasks: MockTask[],
  filters: Pick<MemberHistoryFilters, 'dateRange' | 'statusChip' | 'search'>,
): MockTask[] {
  let result = tasks.filter((t) => inDateRange(t, filters.dateRange));
  result = result.filter((t) => matchesStatusChip(t, filters.statusChip));

  const q = filters.search.trim().toLowerCase();
  if (q) {
    result = result.filter((t) => t.title.toLowerCase().includes(q));
  }

  return result;
}

function sortByRecency(tasks: MockTask[], order: HistorySortOrder): MockTask[] {
  const dir = order === 'newest' ? -1 : 1;
  return [...tasks].sort((a, b) => (dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf()) * dir);
}

export const useMemberHistoryFilterState = () => {
  const [filters, setFilters] = useState<MemberHistoryFilters>(DEFAULT_HISTORY_FILTERS);

  const setStatusChip = (statusChip: HistoryStatusChip) =>
    setFilters((f) => ({ ...f, statusChip }));

  const setSearch = (search: string) => setFilters((f) => ({ ...f, search }));

  const applySheet = (partial: Pick<MemberHistoryFilters, 'dateRange' | 'sortOrder'>) =>
    setFilters((f) => ({ ...f, ...partial }));

  const resetFilters = () => setFilters(DEFAULT_HISTORY_FILTERS);

  const hasActiveFilters =
    filters.dateRange !== DEFAULT_HISTORY_FILTERS.dateRange ||
    filters.sortOrder !== DEFAULT_HISTORY_FILTERS.sortOrder;

  return { filters, setStatusChip, setSearch, applySheet, resetFilters, hasActiveFilters };
};

// ─── Composed hook: raw fetch + client-side filter/sort/group ────────────────

export const useMemberTaskHistory = (userId: string, filters: MemberHistoryFilters) => {
  const query = useMemberTasksRaw(userId);
  const all = query.data ?? [];

  const dateScoped = useMemo(
    () => all.filter((t) => inDateRange(t, filters.dateRange)),
    [all, filters.dateRange],
  );

  const counts = useMemo(
    () => ({
      ALL: dateScoped.length,
      COMPLETED: dateScoped.filter((t) => matchesStatusChip(t, 'COMPLETED')).length,
      OVERDUE: dateScoped.filter((t) => matchesStatusChip(t, 'OVERDUE')).length,
      ACTIVE: dateScoped.filter((t) => matchesStatusChip(t, 'ACTIVE')).length,
    }),
    [dateScoped],
  );

  const filtered = useMemo(
    () => filterMemberTasks(all, filters),
    [all, filters],
  );

  const sorted = useMemo(() => sortByRecency(filtered, filters.sortOrder), [filtered, filters.sortOrder]);

  const grouped = useMemo(() => {
    const groups: { title: string; data: MockTask[] }[] = [];
    for (const task of sorted) {
      const label = dayjs(task.createdAt).format('MMMM YYYY');
      const last = groups[groups.length - 1];
      if (last && last.title === label) last.data.push(task);
      else groups.push({ title: label, data: [task] });
    }
    return groups;
  }, [sorted]);

  return { ...query, all, tasks: sorted, groups: grouped, counts, total: dateScoped.length };
};
