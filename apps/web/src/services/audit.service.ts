import { api } from '@/lib/api';
import type { AuditLogRecord } from '@/data/audit.mock';

type Envelope<T> = { data: T };

export const auditService = {
  async list(filters: { page?: number; limit?: number; entityType?: string; action?: string } = {}) {
    const res = await api.get<Envelope<{ items: AuditLogRecord[]; total: number; page: number; limit: number }>>(
      '/audit',
      { params: filters as Record<string, string | number | undefined> }
    );
    return { items: res.data.data.items, total: res.data.data.total };
  },
};

export type { AuditLogRecord };
