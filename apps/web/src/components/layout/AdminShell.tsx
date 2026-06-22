'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import type { User } from '@godigitify/types';

type Props = {
  user: User;
  children: React.ReactNode;
};

export const AdminShell = ({ user, children }: Props) => {
  const { sidebarOpen } = useUIStore();
  const { setUser } = useAuthStore();

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  return (
    <div className="min-h-screen bg-surface-page">
      <Sidebar />
      <div
        className={cn(
          'flex flex-col transition-all duration-200',
          sidebarOpen ? 'ml-sidebar' : 'ml-sidebar-rail'
        )}
      >
        <TopBar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};
