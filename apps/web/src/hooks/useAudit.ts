'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { auditService } from '@/services/audit.service';

export type AuditListFilters = {
  page?: number;
  limit?: number;
  entityType?: string;
  action?: string;
};

export const useAuditLogs = (filters?: AuditListFilters) =>
  useQuery({
    queryKey: queryKeys.audit.list(filters as Record<string, unknown>),
    queryFn: () => auditService.list(filters),
  });
