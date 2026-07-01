import { MOCK_DEPARTMENTS, type DepartmentWithStats } from '@/data/departments.mock';

const DELAY_MS = 300;
const delay = () => new Promise((res) => setTimeout(res, DELAY_MS));

export const departmentsService = {
  async list(): Promise<DepartmentWithStats[]> {
    await delay();
    return MOCK_DEPARTMENTS.filter((d) => d.isActive);
  },

  async get(id: string): Promise<DepartmentWithStats> {
    await delay();
    const dept = MOCK_DEPARTMENTS.find((d) => d.id === id);
    if (!dept) throw new Error(`Department ${id} not found`);
    return dept;
  },

  async create(dto: {
    name: string;
    code: string;
    description?: string;
    headId?: string;
  }): Promise<DepartmentWithStats> {
    await delay();
    const id = `dept_${Date.now()}`;
    const newDept: DepartmentWithStats = {
      id,
      name: dto.name,
      code: dto.code.toUpperCase(),
      description: dto.description,
      isActive: true,
      headId: dto.headId ?? '',
      _count: { users: 0, tasks: 0 },
      completionRate: 0,
      overdueTasks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_DEPARTMENTS.push(newDept);
    return newDept;
  },

  async update(
    id: string,
    dto: { name?: string; code?: string; description?: string; headId?: string }
  ): Promise<DepartmentWithStats> {
    await delay();
    const idx = MOCK_DEPARTMENTS.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Department not found');
    MOCK_DEPARTMENTS[idx] = {
      ...MOCK_DEPARTMENTS[idx]!,
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    return MOCK_DEPARTMENTS[idx]!;
  },
};
