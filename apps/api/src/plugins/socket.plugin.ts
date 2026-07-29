import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { Server } from 'socket.io';

import { env } from '../config/env.js';
import { prisma } from '../config/database.js';
import { tasksService } from '../modules/tasks/tasks.service.js';

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}

// Background jobs (BullMQ workers, cron) run outside the Fastify request
// lifecycle and have no access to `app.io` — they read the live instance here.
export const socketRegistry: { io: Server | null } = { io: null };

type SocketUser = { id: string; role: string; departmentId: string | null };

export const registerSocket = fp(async (app: FastifyInstance) => {
  const io = new Server(app.server, {
    cors: {
      origin:
        env.NODE_ENV === 'production'
          ? ['https://admin.svgoi.godigitify.com']
          : [env.FRONTEND_URL],
      credentials: true,
    },
    transports: ['websocket'],
  });

  // ─── Handshake auth ───────────────────────────────────────────────────────
  // Without this, ANY client could connect and emit `join:user` with someone
  // else's id to receive their private notification stream. Identity now comes
  // only from a verified JWT, never from client-supplied input.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.['token'] as string | undefined;
      if (!token) return next(new Error('unauthorized'));

      const payload = app.jwt.verify<{ sub: string; role: string; sid: string }>(token);

      // Re-validate against the DB: the token may belong to a user suspended
      // since it was issued (access tokens live ~15m and aren't revocable).
      const user = await prisma.user.findUnique({
        where: { id: payload.sub, isActive: true },
        select: { id: true, role: true, departmentId: true },
      });
      if (!user) return next(new Error('unauthorized'));

      socket.data.user = user satisfies SocketUser;
      return next();
    } catch {
      return next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as SocketUser;

    // The personal room is derived from the VERIFIED id — there is deliberately
    // no `join:user` handler, because a client must never choose its own room.
    void socket.join(`user:${user.id}`);

    socket.on('join:task', async (taskId: unknown) => {
      if (typeof taskId !== 'string' || !taskId) return;
      // Authorized with the same rule as GET /tasks/:id — a user can only
      // stream live events for tasks they're allowed to read.
      const allowed = await tasksService
        .canViewTask(taskId, user.id, user.role, user.departmentId ?? undefined)
        .catch(() => false);
      if (allowed) void socket.join(`task:${taskId}`);
    });

    socket.on('leave:task', (taskId: unknown) => {
      if (typeof taskId === 'string' && taskId) void socket.leave(`task:${taskId}`);
    });
  });

  app.decorate('io', io);
  socketRegistry.io = io;
  app.addHook('onClose', async () => {
    socketRegistry.io = null;
    await io.close();
  });
});
