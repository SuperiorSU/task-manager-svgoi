'use client';

import React from 'react';
import {
  Bell,
  CheckSquare,
  Clock,
  AlertCircle,
  MessageSquare,
  UserCheck,
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/useNotifications';
import type { NotificationType } from '@godigitify/types';

dayjs.extend(relativeTime);

const TYPE_META: Record<
  NotificationType,
  { icon: React.ElementType; color: string; bg: string }
> = {
  TASK_ASSIGNED: { icon: UserCheck, color: 'text-brand-500', bg: 'bg-brand-50' },
  TASK_STATUS_CHANGED: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  TASK_COMPLETED: { icon: CheckSquare, color: 'text-green-600', bg: 'bg-green-50' },
  TASK_OVERDUE: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  TASK_DUE_SOON: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  TASK_REASSIGNED: { icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
  COMMENT_ADDED: { icon: MessageSquare, color: 'text-slate-600', bg: 'bg-slate-100' },
};

const DEFAULT_META = { icon: Bell, color: 'text-slate-500', bg: 'bg-surface-muted' };

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending } = useMarkAllNotificationsRead();

  const items = notifications ?? [];
  const hasUnread = items.some((n) => !n.isRead);

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          {hasUnread && (
            <p className="text-sm text-slate-500">
              {items.filter((n) => !n.isRead).length} unread
            </p>
          )}
        </div>
        {hasUnread && (
          <Button variant="ghost" size="sm" onClick={() => markAllRead()} loading={isPending}>
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="All caught up" description="No notifications to show." />
      ) : (
        <div className="rounded-xl border border-surface-border bg-white shadow-card overflow-hidden divide-y divide-surface-border">
          {items.map((n) => {
            const meta = TYPE_META[n.type as NotificationType] ?? DEFAULT_META;
            const Icon = meta.icon;
            return (
              <button
                key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={cn(
                  'flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-muted',
                  !n.isRead && 'bg-brand-50/60'
                )}
              >
                <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', meta.bg)}>
                  <Icon className={cn('h-4 w-4', meta.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm', !n.isRead ? 'font-semibold text-slate-900' : 'text-slate-600')}>
                    {n.title}
                  </p>
                  <p className={cn('text-xs mt-0.5', !n.isRead ? 'text-slate-700' : 'text-slate-500')}>
                    {n.body}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{dayjs(n.createdAt).fromNow()}</p>
                </div>
                {!n.isRead && (
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
