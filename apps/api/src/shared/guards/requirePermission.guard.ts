import type { FastifyReply, FastifyRequest } from 'fastify';

import { sendError, ErrorCodes } from '../../utils/response.utils.js';

export const requirePermission =
  (permission: string) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { user } = request;

    if (!user) {
      return sendError(reply, 401, ErrorCodes.UNAUTHORIZED, 'Not authenticated');
    }

    if (user.role === 'SUPER_ADMIN') return;

    if (!user.permissions.includes(permission)) {
      return sendError(reply, 403, ErrorCodes.FORBIDDEN, 'Insufficient permissions');
    }
  };
