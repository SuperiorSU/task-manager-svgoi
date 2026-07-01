import type { Prisma } from '@prisma/client';

import { prisma } from '../config/database.js';

type AuditParams = {
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

export const writeAuditLog = async (params: AuditParams): Promise<void> => {
  const data: Prisma.AuditLogUncheckedCreateInput = {
    action: params.action as never,
    entityType: params.entityType,
    entityId: params.entityId,
    description: params.description,
    ...(params.actorId !== undefined ? { actorId: params.actorId } : {}),
    ...(params.ipAddress !== undefined ? { ipAddress: params.ipAddress } : {}),
    ...(params.userAgent !== undefined ? { userAgent: params.userAgent } : {}),
    ...(params.metadata !== undefined
      ? { metadata: params.metadata as Prisma.InputJsonValue }
      : {}),
  };
  await prisma.auditLog.create({ data });
};
