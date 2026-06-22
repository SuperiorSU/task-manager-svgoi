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
};

export type UserProfile = Omit<User, 'permissions'>;
