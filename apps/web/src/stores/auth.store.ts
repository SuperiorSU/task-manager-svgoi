'use client';

import { create } from 'zustand';
import type { User } from '@godigitify/types';

type AuthStore = {
  user: User | null;
  setUser: (user: User | null) => void;
  hasPermission: (permission: string) => boolean;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  hasPermission: (permission) => {
    const { user } = get();
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return (user.permissions ?? []).includes(permission);
  },
}));
