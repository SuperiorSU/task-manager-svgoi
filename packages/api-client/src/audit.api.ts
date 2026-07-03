import type { AuditLogEntry, AuditFilters, AuditVerifyResult } from '@godigitify/types';

import { getApiClient } from './client';

export type AuditListMeta = { page: number; limit: number; total: number };
export type AuditListResponse = { items: AuditLogEntry[]; total: number; page: number; limit: number };

export const auditApi = {
  getList: (filters?: AuditFilters) =>
    getApiClient().get<AuditListResponse>(
      '/audit',
      filters as Record<string, string | number | boolean | undefined>
    ),

  /** No single-entry GET exists on the backend (only GET /audit list, /:id/verify,
   * and /actor/:actorId) — use getList with filters or getByActor instead. */
  verify: (id: string) => getApiClient().get<AuditVerifyResult>(`/audit/${id}/verify`),

  getByActor: (actorId: string, page?: number, limit?: number) =>
    getApiClient().get<AuditListResponse>(`/audit/actor/${actorId}`, { page, limit }),
};
