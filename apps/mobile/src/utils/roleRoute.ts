import type { Role } from '@godigitify/types';

export function getHomeRoute(role: Role): '/(app)/(tabs)' | '/(app)/(admin)' | '/(app)/(sa)' {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/(app)/(sa)';
    case 'ADMIN':
      return '/(app)/(admin)';
    case 'EMPLOYEE':
    default:
      return '/(app)/(tabs)';
  }
}
