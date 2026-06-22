'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  tasks: 'Tasks',
  create: 'Create',
  edit: 'Edit',
  users: 'Users',
  departments: 'Departments',
  reports: 'Reports',
  notifications: 'Notifications',
  audit: 'Audit Log',
  settings: 'Settings',
};

export const BreadcrumbNav = () => {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const crumbs = segments.map((seg, i) => ({
    label: SEGMENT_LABELS[seg] ?? (seg.length === 36 ? 'Detail' : seg),
    href: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb) =>
          crumb.isLast ? (
            <li key={crumb.href} className="font-medium text-slate-900" aria-current="page">
              {crumb.label}
            </li>
          ) : (
            <li key={crumb.href} className="flex items-center gap-1.5">
              <Link href={crumb.href} className="text-slate-500 hover:text-slate-700">
                {crumb.label}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </li>
          )
        )}
      </ol>
    </nav>
  );
};
