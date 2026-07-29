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

/** A one-time setup-invite handed back to the creating admin. */
export type UserInvite = {
  /** Raw setup token — goes in the invite link. Stored only hashed server-side. */
  token: string;
  /** ISO expiry (7 days from creation). */
  expiresAt: string;
};

/** Response of POST /users — the new user plus the invite to deliver to them. */
export type CreateUserResult = {
  user: User;
  invite: UserInvite;
};

/** Public details shown on the setup screen before a password is chosen. */
export type InviteInfo = {
  name: string;
  email: string;
  employeeId: string;
};

/**
 * A candidate a task may be assigned to, from GET /users/assignable.
 *
 * Deliberately narrower than `User`: an Admin picking a cross-department
 * assignee is allowed to see who exists, but NOT their email/phone — user
 * *management* stays department-scoped per 8_overview.md §13. Only ADMIN and
 * EMPLOYEE are ever returned (a task can't be assigned to a Super Admin).
 */
export type AssignableUser = {
  id: string;
  name: string;
  employeeId?: string | null;
  role: Extract<Role, 'ADMIN' | 'EMPLOYEE'>;
  avatarUrl?: string | null;
  designation?: string | null;
  department?: { id: string; name: string; code: string } | null;
};

export type ChangeUserRoleDto = { role: Extract<Role, 'ADMIN' | 'EMPLOYEE'> };

/** Body for POST /users (admin creates an employee/admin; invite is emailed). */
export type CreateUserDto = {
  name: string;
  email: string;
  employeeId: string;
  role: Extract<Role, 'ADMIN' | 'EMPLOYEE'>;
  departmentId?: string;
  phone?: string;
  designation?: string;
};
