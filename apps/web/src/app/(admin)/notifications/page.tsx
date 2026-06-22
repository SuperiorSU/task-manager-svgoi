'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/constants/queryKeys';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

dayjs.extend(relativeTime);

type Notification = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => api.get('/notifications').then((r) => r.data.data),
  });

  const { mutate: markAllRead, isPending } = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.notifications.list() }),
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.notifications.list() }),
  });

  const notifications = (data ?? []) as Notification[];
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
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
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="All caught up" description="No notifications to show." />
      ) : (
        <div className="rounded-xl border border-surface-border bg-white shadow-card overflow-hidden divide-y divide-surface-border">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={cn(
                'flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-muted',
                !n.isRead && 'bg-brand-50'
              )}
            >
              <div className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                !n.isRead ? 'bg-brand-100' : 'bg-surface-subtle'
              )}>
                <Bell className={cn('h-4 w-4', !n.isRead ? 'text-brand-500' : 'text-slate-400')} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm', !n.isRead ? 'font-medium text-slate-900' : 'text-slate-600')}>
                  {n.message}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{dayjs(n.createdAt).fromNow()}</p>
              </div>
              {!n.isRead && (
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
