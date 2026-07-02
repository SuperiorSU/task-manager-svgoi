import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';

import { superAdminCalendarService, type CalendarDayEntry } from '../services/superAdminCalendar.service';

// ─── Keys ─────────────────────────────────────────────────────────────────────

const QK = {
  departments: ['sa', 'calendar', 'departments'] as const,
  entries: (departmentId?: string) => ['sa', 'calendar', 'entries', departmentId ?? 'all'] as const,
  deptHealth: ['sa', 'calendar', 'dept-health'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useSuperAdminCalendarDepartments = () =>
  useQuery({
    queryKey: QK.departments,
    queryFn: superAdminCalendarService.getDepartments,
    staleTime: 30 * 60 * 1000,
  });

export const useSuperAdminCalendarEntries = (departmentId?: string) =>
  useQuery({
    queryKey: QK.entries(departmentId),
    queryFn: () => superAdminCalendarService.getEntryMap(departmentId),
    staleTime: 5 * 60 * 1000,
  });

export const useSuperAdminDeptHealth = () =>
  useQuery({
    queryKey: QK.deptHealth,
    queryFn: superAdminCalendarService.getDeptHealth,
    staleTime: 5 * 60 * 1000,
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
