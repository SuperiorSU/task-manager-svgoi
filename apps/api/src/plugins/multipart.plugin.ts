import multipart from '@fastify/multipart';
import type { FastifyInstance } from 'fastify';

export const registerMultipart = async (app: FastifyInstance): Promise<void> => {
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
      files: 5,
    },
  });
};
