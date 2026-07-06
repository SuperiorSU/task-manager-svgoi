import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { dashboardApi, departmentsApi } from '@godigitify/api-client';
import type { GovernanceTask } from '@godigitify/types';

import { useGovernanceTasks } from './useGovernance';
import { queryKeys } from '../constants/queryKeys';

// ─── Department accents (client-side only — no backend color field) ─────────
// Departments carry no presentation color from the API; hash the id into a
// small fixed palette so dots/chips stay stable across reloads.

const DEPT_COLOR_PALETTE = ['#1D4ED8', '#0D9488', '#B45309', '#7C3AED', '#EF4444', '#0EA5E9', '#DB2777', '#65A30D'];

const hashColorForDept = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return DEPT_COLOR_PALETTE[Math.abs(hash) % DEPT_COLOR_PALETTE.length] ?? '#64748B';
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type SuperAdminCalendarDept = {
  id: string;
  name: string;
  /** Accent color for dots/chips/rollups — org-unit identity, not urgency. */
  color: string;
};

export type CalendarDayEntry =
  | { kind: 'dept'; departmentId: string; departmentName: string; color: string; count: number }
  | { kind: 'governance'; task: GovernanceTask };

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useSuperAdminCalendarDepartments = () =>
  useQuery({
    queryKey: queryKeys.departments.list(),
    queryFn: () => departmentsApi.getList().then((r) => r.data),
    select: (departments) =>
      departments.map((dept): SuperAdminCalendarDept => ({
        id: dept.id,
        name: dept.name,
        color: hashColorForDept(dept.id),
      })),
    staleTime: 5 * 60 * 1_000,
  });

/**
 * Day-keyed entry map backing the month grid, agenda list, and day
 * breakdown. Pass departmentId to filter to a single department; omit for
 * org-wide. Merges real department deadline counts (GET
 * /dashboard/calendar-deadlines) with the SA's own real governance tasks
 * (GET /governance/tasks, via useGovernanceTasks — same source of truth as
 * the Assigned-by-me list/detail flow).
 */
export const useSuperAdminCalendarEntries = (departmentId?: string, from?: string, to?: string) => {
  const range = useMemo(() => {
    const start = from ?? dayjs().startOf('month').subtract(1, 'month').format('YYYY-MM-DD');
    const end = to ?? dayjs().endOf('month').add(1, 'month').format('YYYY-MM-DD');
    return { start, end };
  }, [from, to]);

  const { data: departments = [] } = useSuperAdminCalendarDepartments();
  const { data: governanceTasks = [] } = useGovernanceTasks();

  return useQuery({
    queryKey: queryKeys.dashboard.calendarDeadlines(range.start, range.end),
    queryFn: () => dashboardApi.getCalendarDeadlines(range.start, range.end).then((r) => r.data),
    select: (deadlines): Map<string, CalendarDayEntry[]> => {
      const deptById = new Map(departments.map((dept) => [dept.id, dept]));
      const map = new Map<string, CalendarDayEntry[]>();

      for (const entry of deadlines) {
        if (departmentId && entry.departmentId !== departmentId) continue;
        const dept = deptById.get(entry.departmentId);
        if (!dept) continue;
        const list = map.get(entry.date) ?? [];
        list.push({
          kind: 'dept',
          departmentId: dept.id,
          departmentName: dept.name,
          color: dept.color,
          count: entry.count,
        });
        map.set(entry.date, list);
      }

      for (const task of governanceTasks) {
        if (departmentId && task.departmentId !== departmentId) continue;
        const dueDate = dayjs(task.dueDate);
        if (dueDate.isBefore(range.start, 'day') || dueDate.isAfter(range.end, 'day')) continue;
        const key = dueDate.format('YYYY-MM-DD');
        const list = map.get(key) ?? [];
        list.push({ kind: 'governance', task });
        map.set(key, list);
      }

      return map;
    },
    enabled: departments.length > 0,
    staleTime: 5 * 60 * 1_000,
  });
};

export const useSuperAdminDeptHealth = () =>
  useQuery({
    queryKey: queryKeys.dashboard.deptHealth(),
    queryFn: () => dashboardApi.getDeptHealth().then((r) => r.data),
    staleTime: 5 * 60 * 1_000,
  });

// ─── Calendar state (month nav + selected date + Month/Agenda toggle) ────────

export type SuperAdminCalendarView = 'Month' | 'Agenda';

export const useSuperAdminCalendarState = () => {
  const todayDayjs = dayjs().startOf('day');
  const [view, setView] = useState<SuperAdminCalendarView>('Month');
  const [selectedDate, setSelectedDate] = useState<Dayjs>(todayDayjs);
  const [monthOffset, setMonthOffset] = useState(0);

  const periodAnchor = useMemo(
    () => todayDayjs.startOf('month').add(monthOffset, 'month'),
    [todayDayjs, monthOffset],
  );

  return {
    view,
    setView,
    selectedDate,
    selectDate: (dt: Dayjs) => setSelectedDate(dt.startOf('day')),
    periodAnchor,
    goNext: () => setMonthOffset((o) => o + 1),
    goPrev: () => setMonthOffset((o) => o - 1),
    today: todayDayjs,
  };
};

// ─── Day metadata (department-colored dots, not priority-colored) ────────────

export type SaDayDot = { key: string } & ({ kind: 'dept'; color: string } | { kind: 'governance' });

export type SaDayMeta = {
  date: Dayjs;
  dateStr: string;
  isToday: boolean;
  isSelected: boolean;
  isWeekend: boolean;
  isCurrentMonth: boolean;
  entryCount: number;
  dots: SaDayDot[];
};

export const buildSaDayMeta = (
  date: Dayjs,
  today: Dayjs,
  selectedDate: Dayjs,
  entryMap: Map<string, CalendarDayEntry[]>,
  currentMonthDate?: Dayjs,
): SaDayMeta => {
  const dateStr = date.format('YYYY-MM-DD');
  const entries = entryMap.get(dateStr) ?? [];

  const dots: SaDayDot[] = entries.slice(0, 3).map((entry) =>
    entry.kind === 'dept'
      ? { kind: 'dept', color: entry.color, key: entry.departmentId }
      : { kind: 'governance', key: entry.task.id },
  );

  return {
    date,
    dateStr,
    isToday: date.isSame(today, 'day'),
    isSelected: date.isSame(selectedDate, 'day'),
    isWeekend: date.day() === 0 || date.day() === 6,
    isCurrentMonth: currentMonthDate ? date.month() === currentMonthDate.month() : true,
    entryCount: entries.reduce((sum, e) => sum + (e.kind === 'dept' ? e.count : 1), 0),
    dots,
  };
};
