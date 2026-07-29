import { api } from '@/lib/api';
import type { Role, CreateUserResult } from '@godigitify/types';
import type { UserWithDepartment } from '@/data/users.mock';

export type UserListFilters = {
  search?: string;
  role?: Role;
  departmentId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

type Envelope<T> = { data: T };

export const usersService = {
  async list(filters: UserListFilters = {}) {
    const res = await api.get<Envelope<{ items: UserWithDepartment[]; total: number; page: number; limit: number }>>(
      '/users',
      { params: filters as Record<string, string | number | boolean | undefined> }
    );
    return res.data.data;
  },

  async get(id: string): Promise<UserWithDepartment> {
    const res = await api.get<Envelope<UserWithDepartment>>(`/users/${id}`);
    return res.data.data;
  },

  async create(dto: {
    name: string;
    email: string;
    employeeId: string;
    role: Role;
    departmentId?: string;
    phone?: string;
    designation?: string;
  }): Promise<UserWithDepartment> {
    // POST /users returns { user, invite } — the invite is also emailed to the
    // new member, so the admin flow just needs the created user back.
    const res = await api.post<Envelope<CreateUserResult>>('/users', dto);
    return res.data.data.user as unknown as UserWithDepartment;
  },

  async update(id: string, dto: Partial<UserWithDepartment>): Promise<UserWithDepartment> {
    // Role changes go through the dedicated /role endpoint; PATCH /:id only
    // touches profile fields (name/phone/designation/departmentId).
    const res = await api.patch<Envelope<UserWithDepartment>>(`/users/${id}`, dto);
    return res.data.data;
  },

  async deactivate(id: string): Promise<void> {
    await api.patch(`/users/${id}/deactivate`);
  },

  async reactivate(id: string): Promise<void> {
    await api.patch(`/users/${id}/reactivate`);
  },
};
