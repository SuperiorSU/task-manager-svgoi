import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid,
  CheckSquare,
  Users,
  Building2,
  BarChart3,
  Bell,
  ShieldCheck,
  Settings,
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  children?: Omit<NavItem, 'icon' | 'children'>[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
  {
    label: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
    permission: 'task:read:all',
    children: [
      { label: 'All Tasks', href: '/tasks' },
      { label: 'Create Task', href: '/tasks/create', permission: 'task:create' },
    ],
  },
  { label: 'Users', href: '/users', icon: Users, permission: 'user:read' },
  { label: 'Departments', href: '/departments', icon: Building2, permission: 'dept:manage' },
  { label: 'Reports', href: '/reports', icon: BarChart3, permission: 'report:view' },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Audit Log', href: '/audit', icon: ShieldCheck, permission: 'audit:view' },
  { label: 'Settings', href: '/settings', icon: Settings, permission: 'system:config' },
];
