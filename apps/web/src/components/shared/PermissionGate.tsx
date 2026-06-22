'use client';

import { usePermissions } from '@/hooks/usePermissions';

type Props = {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export const PermissionGate = ({ permission, children, fallback = null }: Props) => {
  const { hasPermission } = usePermissions();
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
};
