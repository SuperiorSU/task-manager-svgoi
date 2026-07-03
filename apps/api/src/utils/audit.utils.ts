import { createHmac } from 'crypto';

import type { Prisma } from '@prisma/client';

import { prisma } from '../config/database.js';
import { env } from '../config/env.js';

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

type AuditHashInput = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  createdAt: Date;
  previousHash?: string | null;
};

/**
 * Computes the HMAC-SHA256 integrity hash for an audit log row, chaining it
 * to the previous row's hash so any tampering (edit/delete/reorder) of a row
 * breaks the chain for every row after it.
 */
export const computeAuditHash = (input: AuditHashInput): string => {
  const message = [
    input.id,
    input.action,
    input.entityType,
    input.entityId,
    input.actorId ?? '',
    input.createdAt.toISOString(),
    input.previousHash ?? '',
  ].join('|');

  return createHmac('sha256', env.AUDIT_HASH_SECRET).update(message).digest('hex');
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

  await prisma.$transaction(async (tx) => {
    const previous = await tx.auditLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { integrityHash: true },
    });
    const previousHash = previous?.integrityHash ?? null;

    const created = await tx.auditLog.create({
      data: { ...data, previousHash },
    });

    const integrityHash = computeAuditHash({
      id: created.id,
      action: created.action,
      entityType: created.entityType,
      entityId: created.entityId,
      actorId: created.actorId,
      createdAt: created.createdAt,
      previousHash,
    });

    await tx.auditLog.update({
      where: { id: created.id },
      data: { integrityHash },
    });
  });
};
