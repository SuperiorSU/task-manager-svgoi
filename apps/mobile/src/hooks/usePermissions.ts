import { useAuthStore } from '../stores/auth.store';

export const usePermissions = () => {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const user = useAuthStore((s) => s.user);

  return {
    hasPermission,
    isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isEmployee: user?.role === 'EMPLOYEE',
    role: user?.role,
  };
};
