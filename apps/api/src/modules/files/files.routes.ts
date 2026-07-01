import crypto from 'crypto';

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { FastifyInstance } from 'fastify';

import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { requireAuth } from '../../shared/guards/requireAuth.guard.js';
import { sendSuccess, sendError, ErrorCodes } from '../../utils/response.utils.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);

const s3 = new S3Client({
  region: 'auto',
  ...(env.SUPABASE_URL ? { endpoint: `${env.SUPABASE_URL}/storage/v1/s3` } : {}),
  ...(env.SUPABASE_SERVICE_KEY
    ? { credentials: { accessKeyId: 'supabase', secretAccessKey: env.SUPABASE_SERVICE_KEY } }
    : {}),
});

const BUCKET = 'svgoi-task-attachments';

export const filesRoutes = async (app: FastifyInstance): Promise<void> => {
  app.post('/presign', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      const { taskId, fileName, mimeType, isProof = false } = req.body as {
        taskId: string;
        fileName: string;
        mimeType: string;
        isProof?: boolean;
      };

      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        return sendError(reply, 400, ErrorCodes.VALIDATION_ERROR, 'File type not allowed');
      }

      const ext = fileName.split('.').pop() ?? 'bin';
      const uuid = crypto.randomUUID();
      const folder = isProof ? 'proof' : 'references';
      const storageKey = `tasks/${taskId}/${folder}/${uuid}.${ext}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: storageKey,
        ContentType: mimeType,
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

      return sendSuccess(reply, { uploadUrl, storageKey, fileKey: uuid });
    },
  });

  app.post('/confirm', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      const { taskId, storageKey, fileName, fileSize, mimeType, isProof } = req.body as {
        taskId: string;
        storageKey: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
        isProof: boolean;
      };

      const safeName = fileName
        .replace(/[^a-zA-Z0-9.\-_]/g, '_')
        .replace(/\.{2,}/g, '.')
        .slice(0, 255);

      const attachment = await prisma.fileAttachment.create({
        data: {
          taskId,
          fileName: safeName,
          fileSize,
          mimeType,
          storageKey,
          isProof,
          uploadedBy: req.user.id,
        },
      });

      await prisma.taskActivity.create({
        data: {
          taskId,
          actorId: req.user.id,
          action: 'UPDATE',
          description: `Attached file: ${safeName}`,
        },
      });

      return sendSuccess(reply, attachment, 201);
    },
  });

  app.get('/:id/download', {
    preHandler: [requireAuth],
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const file = await prisma.fileAttachment.findUnique({ where: { id } });
      if (!file) return sendError(reply, 404, ErrorCodes.NOT_FOUND, 'File not found');

      const command = new GetObjectCommand({ Bucket: BUCKET, Key: file.storageKey });
      const url = await getSignedUrl(s3, command, { expiresIn: 900 });

      await prisma.fileAttachment.update({
        where: { id },
        data: { downloadCount: { increment: 1 } },
      });

      return sendSuccess(reply, { url, fileName: file.fileName });
    },
  });
};
