import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';

import { env } from '../config/env.js';

export const registerCors = async (app: FastifyInstance): Promise<void> => {
  await app.register(cors, {
    origin:
      env.NODE_ENV === 'production'
        ? ['https://admin.svgoi.godigitify.com']
        : [env.FRONTEND_URL, /^http:\/\/localhost:\d+$/],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });
};
