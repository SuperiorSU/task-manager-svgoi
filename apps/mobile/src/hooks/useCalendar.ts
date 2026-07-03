import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { tasksApi } from '@godigitify/api-client';
import type { TaskPriority } from '@godigitify/types';
import { type CalendarTask } from '../data/calendar.mock';

// ─── Types ────────────────────────────────────────────────────────────────────

export type { CalendarTask };

export type CalendarView = 'Day' | 'Week' | 'Month';

export type DayMeta = {
  date: Dayjs;
  dateStr: string; // YYYY-MM-DD
  isToday: boolean;
  isSelected: boolean;
  isWeekend: boolean;
  isCurrentMonth: boolean;
  isOverdue: boolean;
  taskCount: number;
  /** Up to 3 priority dots for display */
  dots: Array<{ priority: CalendarTask['priority']; key: string }>;
};

const PRIORITY_ORDER: TaskPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

// ─── Data hook ────────────────────────────────────────────────────────────────

export const useCalendarTasks = (periodAnchor: Dayjs, view: CalendarView) => {
  const from = useMemo(() => {
    if (view === 'Month') return periodAnchor.startOf('month').subtract(1, 'week').toISOString();
    if (view === 'Week') return periodAnchor.toISOString();
    return periodAnchor.startOf('day').toISOString();
  }, [periodAnchor, view]);

  const to = useMemo(() => {
    if (view === 'Month') return periodAnchor.endOf('month').add(1, 'week').toISOString();
    if (view === 'Week') return periodAnchor.add(6, 'day').endOf('day').toISOString();
    return periodAnchor.endOf('day').toISOString();
  }, [periodAnchor, view]);

  return useQuery({
    queryKey: ['tasks', 'calendar', from, to],
    queryFn: async () => {
      const res = await tasksApi.getCalendar(from, to);
      const tasks: CalendarTask[] = (res.data ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        department: t.department?.name ?? null,
      }));
      const map = new Map<string, CalendarTask[]>();
      for (const task of tasks) {
        const key = dayjs(task.dueDate).format('YYYY-MM-DD');
        const existing = map.get(key) ?? [];
        existing.push(task);
        map.set(key, existing);
      }
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ─── Calendar state hook ──────────────────────────────────────────────────────

/** Get the Monday of the week that contains the given date */
const getMondayOf = (d: Dayjs): Dayjs => {
  const dow = d.day(); // 0=Sun, 1=Mon, …, 6=Sat
  const diff = dow === 0 ? -6 : 1 - dow;
  return d.add(diff, 'day').startOf('day');
};

export const useCalendarState = () => {
  const todayDayjs = dayjs().startOf('day');

  const [view, setView] = useState<CalendarView>('Week');
  const [selectedDate, setSelectedDate] = useState<Dayjs>(todayDayjs);
  const [periodOffset, setPeriodOffset] = useState(0);

  // Anchor of the current period (Mon for weeks, 1st for months, day for day view)
  const periodAnchor = useMemo(() => {
    if (view === 'Month') {
      return todayDayjs.startOf('month').add(periodOffset, 'month');
    }
    if (view === 'Week') {
      return getMondayOf(todayDayjs).add(periodOffset, 'week');
    }
    // Day view
    return todayDayjs.add(periodOffset, 'day');
  }, [view, periodOffset, todayDayjs]);

  const goNext = () => setPeriodOffset((o) => o + 1);
  const goPrev = () => setPeriodOffset((o) => o - 1);

  const goToday = () => {
    setPeriodOffset(0);
    setSelectedDate(todayDayjs);
  };

  const selectDate = (d: Dayjs) => {
    setSelectedDate(d.startOf('day'));
  };

  // Auto-sync selected date to visible period when view changes
  const switchView = (v: CalendarView) => {
    setView(v);
    setPeriodOffset(0);
    setSelectedDate(todayDayjs);
  };

  return {
    view,
    switchView,
    selectedDate,
    selectDate,
    periodAnchor,
    goNext,
    goPrev,
    goToday,
    today: todayDayjs,
    getMondayOf,
  };
};

// ─── Day metadata builder ─────────────────────────────────────────────────────

export const buildDayMeta = (
  date: Dayjs,
  today: Dayjs,
  selectedDate: Dayjs,
  taskMap: Map<string, CalendarTask[]>,
  currentMonthDate?: Dayjs, // when set, marks off-month days
): DayMeta => {
  const dateStr = date.format('YYYY-MM-DD');
  const tasks = taskMap.get(dateStr) ?? [];
  const isOverdue = date.isBefore(today) && tasks.some(
    (t) => !['COMPLETED', 'CANCELLED'].includes(t.status),
  );

  // Build up to 3 priority dots, sorted by priority importance
  const dotTasks = [...tasks]
    .filter((t) => !['COMPLETED', 'CANCELLED'].includes(t.status))
    .sort(
      (a, b) =>
        PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
    )
    .slice(0, 3);

  return {
    date,
    dateStr,
    isToday: date.isSame(today, 'day'),
    isSelected: date.isSame(selectedDate, 'day'),
    isWeekend: date.day() === 0 || date.day() === 6,
    isCurrentMonth: currentMonthDate ? date.month() === currentMonthDate.month() : true,
    isOverdue,
    taskCount: tasks.length,
    dots: dotTasks.map((t) => ({ priority: t.priority, key: t.id })),
  };
};
