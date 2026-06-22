import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const truncate = (str: string, length = 50) =>
  str.length > length ? `${str.slice(0, length)}…` : str;

export const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const isOverdue = (dueDate: string, status: string) =>
  !['COMPLETED', 'CANCELLED'].includes(status) && new Date(dueDate) < new Date();
