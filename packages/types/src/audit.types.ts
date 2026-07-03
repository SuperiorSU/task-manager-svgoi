import type { TaskActivityAction } from './task.types';

export type AuditLogEntry = {
  id: string;
  action: TaskActivityAction;
  entityType: string;
  entityId: string;
  description: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  integrityHash?: string | null;
  previousHash?: string | null;
  actor?: { id: string; name: string; role: string; employeeId?: string | null } | null;
};

export type AuditFilters = {
  entityType?: string;
  action?: TaskActivityAction;
  actorId?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type AuditVerifyResult = {
  valid: boolean;
  brokenAtId?: string;
};
