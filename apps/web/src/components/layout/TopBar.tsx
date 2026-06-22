'use client';

import React from 'react';
import { Bell, Menu } from 'lucide-react';
import Link from 'next/link';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { AvatarWithFallback } from '@/components/shared/AvatarWithFallback';
import { BreadcrumbNav } from './BreadcrumbNav';

export const TopBar = () => {
  const { toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-border bg-white px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden rounded-lg p-2 text-slate-400 hover:bg-surface-subtle"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <BreadcrumbNav />
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/notifications"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-surface-subtle"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </Link>
        {user && (
          <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-subtle">
            <AvatarWithFallback name={user.name} src={user.avatarUrl} size={28} />
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
