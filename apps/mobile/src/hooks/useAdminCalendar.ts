import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';

import { adminCalendarService } from '../services/adminCalendar.service';

// ─── Data hooks ───────────────────────────────────────────────────────────────

export const useAdminCalendarTasks = (memberId?: string) =>
  useQuery({
    queryKey: ['adminCalendarTasks', memberId ?? 'all'],
    queryFn: () => adminCalendarService.getTaskMap(memberId),
    staleTime: 5 * 60 * 1000,
  });

export const useAdminCalendarMembers = () =>
  useQuery({
    queryKey: ['adminCalendarMembers'],
    queryFn: adminCalendarService.getMembers,
    staleTime: 30 * 60 * 1000,
  });

// ─── Calendar state (month-only for Admin) ────────────────────────────────────

export const useAdminCalendarState = () => {
  const todayDayjs = dayjs().startOf('day');
  const [selectedDate, setSelectedDate] = useState<Dayjs>(todayDayjs);
  const [monthOffset, setMonthOffset] = useState(0);

  const periodAnchor = useMemo(
    () => todayDayjs.startOf('month').add(monthOffset, 'month'),
    [todayDayjs, monthOffset],
  );

  return {
    selectedDate,
    selectDate: (d: Dayjs) => setSelectedDate(d.startOf('day')),
    periodAnchor,
    goNext: () => setMonthOffset((o) => o + 1),
    goPrev: () => setMonthOffset((o) => o - 1),
    today: todayDayjs,
  };
};
