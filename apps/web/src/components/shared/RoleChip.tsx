import React from 'react';
import { cn } from '@/lib/utils';
import type { Role } from '@godigitify/types';

const ROLE_STYLES: Record<Role, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-brand-50 text-brand-700',
  EMPLOYEE: 'bg-slate-100 text-slate-600',
};

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
};

export const RoleChip = ({ role }: { role: Role }) => (
  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', ROLE_STYLES[role])}>
    {ROLE_LABELS[role]}
  </span>
);
