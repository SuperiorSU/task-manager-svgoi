import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';

import { tasksApi, usersApi } from '@godigitify/api-client';
import { getInitials } from '../utils/initial';
import { getAvatarColor } from '../utils/avatarColor';

export type AdminCalendarAssignee = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
};

export type AdminCalendarTask = {
  id: string;
  title: string;
  status: import('@godigitify/types').TaskStatus;
  priority: import('@godigitify/types').TaskPriority;
  dueDate: string;
  assignee: AdminCalendarAssignee;
};

const toAssignee = (a: { id: string; name: string }): AdminCalendarAssignee => {
  const initials = getInitials(a.name);
  return { id: a.id, name: a.name, initials, avatarColor: getAvatarColor(initials) };
};

function buildTaskMap(tasks: AdminCalendarTask[], memberId?: string): Map<string, AdminCalendarTask[]> {
  const filtered = memberId ? tasks.filter((t) => t.assignee.id === memberId) : tasks;
  const map = new Map<string, AdminCalendarTask[]>();
  for (const task of filtered) {
    const key = dayjs(task.dueDate).format('YYYY-MM-DD');
    map.set(key, [...(map.get(key) ?? []), task]);
  }
  return map;
}

// ─── Data hooks ───────────────────────────────────────────────────────────────

export const useAdminCalendarTasks = (periodAnchor: Dayjs, memberId?: string) => {
  const from = periodAnchor.startOf('month').toISOString();
  const to = periodAnchor.endOf('month').toISOString();

  return useQuery({
    queryKey: ['tasks', 'adminCalendar', from, to],
    queryFn: () => tasksApi.getCalendar(from, to),
    staleTime: 5 * 60 * 1000,
    select: (res) => {
      const tasks: AdminCalendarTask[] = res.data.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        assignee: toAssignee(t.assignee),
      }));
      return buildTaskMap(tasks, memberId);
    },
  });
};

export const useAdminCalendarMembers = (departmentId?: string) =>
  useQuery({
    queryKey: ['adminCalendarMembers', departmentId ?? 'all'],
    queryFn: () =>
      usersApi.getList({
        ...(departmentId ? { departmentId } : {}),
        role: 'EMPLOYEE',
        isActive: true,
        limit: 100,
      }),
    staleTime: 30 * 60 * 1000,
    select: (res) => res.data.items.map(toAssignee),
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
