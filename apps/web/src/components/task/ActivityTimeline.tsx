import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { AvatarWithFallback } from '@/components/shared/AvatarWithFallback';

dayjs.extend(relativeTime);

type Activity = {
  id: string;
  action: string;
  note?: string | null;
  createdAt: string;
  actor?: { name: string; avatarUrl?: string | null } | null;
};

export const ActivityTimeline = ({ items }: { items: Activity[] }) => (
  <ol className="space-y-4">
    {items.map((item, i) => (
      <li key={item.id} className="flex gap-3">
        <div className="flex flex-col items-center">
          {item.actor ? (
            <AvatarWithFallback name={item.actor.name} src={item.actor.avatarUrl} size={28} />
          ) : (
            <div className="h-7 w-7 rounded-full bg-surface-subtle" />
          )}
          {i < items.length - 1 && (
            <div className="mt-1 h-full w-px bg-surface-border" />
          )}
        </div>
        <div className="min-w-0 flex-1 pb-4">
          <p className="text-sm text-slate-700">
            <span className="font-medium">{item.actor?.name ?? 'System'}</span>{' '}
            {item.action.toLowerCase().replace(/_/g, ' ')}
          </p>
          {item.note && <p className="mt-0.5 text-sm text-slate-500">{item.note}</p>}
          <p className="mt-0.5 text-xs text-slate-400">{dayjs(item.createdAt).fromNow()}</p>
        </div>
      </li>
    ))}
  </ol>
);
