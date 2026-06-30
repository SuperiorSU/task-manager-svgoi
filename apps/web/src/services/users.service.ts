import { MOCK_USERS, type UserWithDepartment } from '@/data/users.mock';
import type { Role } from '@godigitify/types';

const DELAY_MS = 350;
const delay = () => new Promise((res) => setTimeout(res, DELAY_MS));

export type UserListFilters = {
  search?: string;
  role?: Role;
  departmentId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

export const usersService = {
  async list(filters: UserListFilters = {}) {
    await delay();
    const { search, role, departmentId, isActive, page = 1, limit = 20 } = filters;

    let items = [...MOCK_USERS];

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          (u.email ?? '').toLowerCase().includes(q) ||
          (u.employeeId ?? '').toLowerCase().includes(q) ||
          (u.designation ?? '').toLowerCase().includes(q)
      );
    }
    if (role) items = items.filter((u) => u.role === role);
    if (departmentId) items = items.filter((u) => u.departmentId === departmentId);
    if (isActive !== undefined) items = items.filter((u) => u.isActive === isActive);

    const total = items.length;
    const paged = items.slice((page - 1) * limit, page * limit);
    return { items: paged, total, page, limit };
  },

  async get(id: string): Promise<UserWithDepartment> {
    await delay();
    const user = MOCK_USERS.find((u) => u.id === id);
    if (!user) throw new Error(`User ${id} not found`);
    return user;
  },

  async create(dto: {
    name: string;
    email: string;
    employeeId: string;
    role: Role;
    departmentId?: string;
    phone?: string;
    designation?: string;
  }) {
    await delay();
    const id = `user_${Date.now()}`;
    const newUser: UserWithDepartment = {
      id,
      name: dto.name,
      email: dto.email,
      employeeId: dto.employeeId,
      role: dto.role,
      isActive: true,
      departmentId: dto.departmentId,
      phone: dto.phone,
      designation: dto.designation,
      permissions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_USERS.push(newUser);
    return newUser;
  },

  async update(id: string, dto: Partial<UserWithDepartment>) {
    await delay();
    const idx = MOCK_USERS.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');
    MOCK_USERS[idx] = { ...MOCK_USERS[idx]!, ...dto, updatedAt: new Date().toISOString() };
    return MOCK_USERS[idx]!;
  },

  async deactivate(id: string) {
    await delay();
    const user = MOCK_USERS.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    user.isActive = false;
    user.updatedAt = new Date().toISOString();
    return user;
  },

  async reactivate(id: string) {
    await delay();
    const user = MOCK_USERS.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    user.isActive = true;
    user.updatedAt = new Date().toISOString();
    return user;
  },
};
