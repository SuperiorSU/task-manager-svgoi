import { MOCK_AUDIT_LOGS, type AuditLogRecord } from '@/data/audit.mock';

const DELAY_MS = 400;
const delay = () => new Promise((res) => setTimeout(res, DELAY_MS));

export const auditService = {
  async list(filters: { page?: number; limit?: number; entityType?: string; action?: string } = {}) {
    await delay();
    const { page = 1, limit = 20, entityType, action } = filters;

    let items = [...MOCK_AUDIT_LOGS];

    if (entityType) items = items.filter((l) => l.entityType === entityType);
    if (action) items = items.filter((l) => l.action === action);

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = items.length;
    const paged = items.slice((page - 1) * limit, page * limit);
    return { items: paged, total };
  },
};

export type { AuditLogRecord };
