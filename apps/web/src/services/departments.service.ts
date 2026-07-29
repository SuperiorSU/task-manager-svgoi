import { api } from '@/lib/api';
import type { DepartmentWithStats } from '@/data/departments.mock';

type Envelope<T> = { data: T };

// `/departments` returns the record + head + _count, but NOT the health stats
// (completionRate / overdue) — those live on `/dashboard/dept-stats`. We merge
// them by id so the department cards show real health.
type RawDept = Omit<DepartmentWithStats, 'completionRate' | 'overdueTasks'>;
type DeptStat = { id: string; completionRate: number; overdue: number };

const withStats = (dept: RawDept, stats: DeptStat[]): DepartmentWithStats => {
  const s = stats.find((x) => x.id === dept.id);
  return { ...dept, completionRate: s?.completionRate ?? 0, overdueTasks: s?.overdue ?? 0 };
};

export const departmentsService = {
  async list(): Promise<DepartmentWithStats[]> {
    const [deptsRes, statsRes] = await Promise.all([
      api.get<Envelope<RawDept[]>>('/departments'),
      api.get<Envelope<DeptStat[]>>('/dashboard/dept-stats').catch(() => ({ data: { data: [] as DeptStat[] } })),
    ]);
    return deptsRes.data.data.map((d) => withStats(d, statsRes.data.data));
  },

  async get(id: string): Promise<DepartmentWithStats> {
    const [deptRes, statsRes] = await Promise.all([
      api.get<Envelope<RawDept>>(`/departments/${id}`),
      api.get<Envelope<DeptStat[]>>('/dashboard/dept-stats').catch(() => ({ data: { data: [] as DeptStat[] } })),
    ]);
    return withStats(deptRes.data.data, statsRes.data.data);
  },

  async create(dto: {
    name: string;
    code: string;
    description?: string;
    headId?: string;
  }): Promise<DepartmentWithStats> {
    const res = await api.post<Envelope<RawDept>>('/departments', { ...dto, code: dto.code.toUpperCase() });
    return { ...res.data.data, completionRate: 0, overdueTasks: 0 };
  },

  async update(
    id: string,
    dto: { name?: string; code?: string; description?: string; headId?: string }
  ): Promise<DepartmentWithStats> {
    const res = await api.patch<Envelope<RawDept>>(`/departments/${id}`, dto);
    return { ...res.data.data, completionRate: 0, overdueTasks: 0 };
  },
};
