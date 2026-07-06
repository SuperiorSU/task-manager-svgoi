import type { Role } from './auth.types';

export type User = {
  id: string;
  email: string;
  name: string;
  employeeId?: string;
  phone?: string;
  avatarUrl?: string;
  designation?: string;
  role: Role;
  isActive: boolean;
  departmentId?: string;
  managerId?: string;
  permissions?: string[];
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  department?: { id: string; name: string; code: string } | null;
  manager?: { id: string; name: string } | null;
};

export type UserProfile = Omit<User, 'permissions'>;

export type ChangeUserRoleDto = { role: Extract<Role, 'ADMIN' | 'EMPLOYEE'> };
