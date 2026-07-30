import crypto from 'crypto';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { FastifyInstance } from 'fastify';

import { prisma } from '../../config/database.js';
import {
  s3,
  STORAGE_BUCKET as BUCKET,
  ALLOWED_UPLOAD_MIME as ALLOWED_MIME_TYPES,
  ALLOWED_IMAGE_MIME,
  signPutUrl,
  signGetUrl,
  buildAvatarKey,
  isOwnedAvatarKey,
} from '../../config/storage.js';
import { authService } from '../auth/auth.service.js';
import { requireAuth } from '../../shared/guards/requireAuth.guard.js';
import { sendSuccess, sendError, ErrorCodes } from '../../utils/response.utils.js';

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

      // NOTE: ContentType is deliberately NOT set on the signed command. If it
      // were, `content-type` becomes a *signed* header and the client PUT must
      // send a byte-identical value — but React Native's XHR/blob upload can't
      // reliably reproduce it (the Blob's own type overrides the header),
      // producing SignatureDoesNotMatch 403s and silent upload failures. The
      // real mime type is still validated above and persisted via /confirm, so
      // dropping it from the signature is safe. Downloads serve our stored
      // mimeType, not the object's S3 content-type.
      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: storageKey,
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

      const url = await signGetUrl(file.storageKey, 900);

      await prisma.fileAttachment.update({
        where: { id },
        data: { downloadCount: { increment: 1 } },
      });

      return sendSuccess(reply, { url, fileName: file.fileName });
    },
  });

  // ─── Avatar upload (user-scoped, images only) ──────────────────────
  // Same two-phase presign→PUT→confirm design as task attachments, but keyed to
  // the caller's own user folder and images only. `confirm` sets the private
  // avatarKey and returns the caller's profile with a freshly signed avatarUrl.
  app.post('/avatar/presign', {
    preHandler: [requireAuth],
    schema: {
      body: {
        type: 'object',
        required: ['fileName', 'mimeType'],
        additionalProperties: false,
        properties: {
          fileName: { type: 'string', minLength: 1, maxLength: 255 },
          mimeType: { type: 'string' },
        },
      },
    },
    handler: async (req, reply) => {
      const { fileName, mimeType } = req.body as { fileName: string; mimeType: string };
      if (!ALLOWED_IMAGE_MIME.has(mimeType)) {
        return sendError(reply, 400, ErrorCodes.VALIDATION_ERROR, 'Avatar must be a JPG or PNG image');
      }
      const storageKey = buildAvatarKey(req.user.id, fileName);
      const uploadUrl = await signPutUrl(storageKey, 300);
      return sendSuccess(reply, { uploadUrl, storageKey });
    },
  });

  app.post('/avatar/confirm', {
    preHandler: [requireAuth],
    schema: {
      body: {
        type: 'object',
        required: ['storageKey'],
        additionalProperties: false,
        properties: { storageKey: { type: 'string', minLength: 1, maxLength: 512 } },
      },
    },
    handler: async (req, reply) => {
      const { storageKey } = req.body as { storageKey: string };
      // Ownership guard: a client can only attach a key under its own folder,
      // so it can't point its avatar at someone else's (or an arbitrary) object.
      if (!isOwnedAvatarKey(storageKey, req.user.id)) {
        return sendError(reply, 403, ErrorCodes.FORBIDDEN, 'Invalid avatar key');
      }
      await prisma.user.update({
        where: { id: req.user.id },
        data: { avatarKey: storageKey },
      });
      // Return the exact /me shape (permissions included, avatar signed) so the
      // client can replace its stored user without dropping any fields.
      const profile = await authService.getProfile(req.user.id);
      return sendSuccess(reply, profile);
    },
  });
};
