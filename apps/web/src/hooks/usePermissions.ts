'use client';

import { useAuthStore } from '@/stores/auth.store';

export const usePermissions = () => {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const user = useAuthStore((s) => s.user);

  return {
    hasPermission,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
    role: user?.role,
  };
};
