import type { FastifyReply, FastifyRequest } from 'fastify';

import { prisma } from '../../config/database.js';
import { sendError, ErrorCodes } from '../../utils/response.utils.js';
import { ROLE_PERMISSIONS } from './permissions.js';

export const requireAuth = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  // Step 1: Verify JWT signature and expiry — 401 on failure
  try {
    await request.jwtVerify();
  } catch {
    return sendError(reply, 401, ErrorCodes.UNAUTHORIZED, 'Invalid or expired token');
  }

  const payload = request.user as unknown as {
    sub: string;
    role: string;
    sid: string;
  };

  // Step 2: Load user from DB — 503 on DB errors, 401 if user not found/inactive
  // Keeping these separate means a transient Prisma error returns 503 (not 401),
  // so the mobile client does NOT trigger logout for a temporary server issue.
  try {
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
      ...(user.departmentId ? { departmentId: user.departmentId } : {}),
      permissions: allPerms,
    };
  } catch {
    return sendError(reply, 503, ErrorCodes.INTERNAL_ERROR, 'Service temporarily unavailable');
  }
};
