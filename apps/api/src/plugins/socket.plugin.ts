import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { Server } from 'socket.io';

import { env } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}

// Background jobs (BullMQ workers, cron) run outside the Fastify request
// lifecycle and have no access to `app.io` — they read the live instance here.
export const socketRegistry: { io: Server | null } = { io: null };

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

  io.on('connection', (socket) => {
    socket.on('join:task', (taskId: string) => {
      void socket.join(`task:${taskId}`);
    });
    socket.on('leave:task', (taskId: string) => {
      void socket.leave(`task:${taskId}`);
    });
    socket.on('join:user', (userId: string) => {
      void socket.join(`user:${userId}`);
    });
  });

  app.decorate('io', io);
  socketRegistry.io = io;
  app.addHook('onClose', async () => {
    socketRegistry.io = null;
    await io.close();
  });
});
