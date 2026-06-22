import type { FastifyReply, FastifyRequest } from 'fastify';

import { prisma } from '../../config/database.js';
import { sendError, ErrorCodes } from '../../utils/response.utils.js';
import { ROLE_PERMISSIONS } from './permissions.js';

export const requireAuth = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    await request.jwtVerify();

    const payload = request.user as unknown as {
      sub: string;
      role: string;
      sid: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: payload.sub, isActive: true },
      select: {
        id: true,
        role: true,
        departmentId: true,
        permissions: { select: { permission: true } },
      },
    });

    if (!user) {
      return sendError(reply, 401, ErrorCodes.UNAUTHORIZED, 'User not found or inactive');
    }

    const rolePerms = ROLE_PERMISSIONS[user.role] ?? [];
    const extraPerms = user.permissions.map((p) => p.permission);
    const allPerms = [...new Set([...rolePerms, ...extraPerms])];

    request.user = {
      id: user.id,
      role: user.role as never,
      sid: payload.sid,
      departmentId: user.departmentId ?? undefined,
      permissions: allPerms,
    };
  } catch {
    return sendError(reply, 401, ErrorCodes.UNAUTHORIZED, 'Invalid or expired token');
  }
};
