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
  await prisma.auditLog.create({
    data: {
      action: params.action as never,
      entityType: params.entityType,
      entityId: params.entityId,
      description: params.description,
      actorId: params.actorId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
    },
  });
};
