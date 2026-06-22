import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const formatDate = (date: string | Date, format = 'DD MMM YYYY'): string =>
  dayjs(date).format(format);

export const formatDateTime = (date: string | Date): string =>
  dayjs(date).format('DD MMM YYYY, h:mm A');

export const isOverdue = (dueDate: string | Date): boolean =>
  dayjs(dueDate).isBefore(dayjs());

export const getDaysRemaining = (dueDate: string | Date): number =>
  dayjs(dueDate).diff(dayjs(), 'day');

export const timeAgo = (date: string | Date): string => dayjs(date).fromNow();

export const isSameDay = (a: string | Date, b: string | Date): boolean =>
  dayjs(a).isSame(dayjs(b), 'day');

export const isToday = (date: string | Date): boolean =>
  dayjs(date).isSame(dayjs(), 'day');
