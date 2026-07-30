import crypto from 'crypto';

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env } from './env.js';

// Single shared S3/Supabase-Storage client. Previously this lived inline in
// files.routes.ts; it's centralized here so avatar signing (avatar.utils.ts)
// and task-attachment handling use exactly the same client + bucket.
export const s3 = new S3Client({
  region: 'auto',
  ...(env.SUPABASE_URL ? { endpoint: `${env.SUPABASE_URL}/storage/v1/s3` } : {}),
  ...(env.SUPABASE_SERVICE_KEY
    ? { credentials: { accessKeyId: 'supabase', secretAccessKey: env.SUPABASE_SERVICE_KEY } }
    : {}),
});

export const STORAGE_BUCKET = 'svgoi-task-attachments';

export const ALLOWED_UPLOAD_MIME = new Set(['image/jpeg', 'image/png', 'application/pdf']);
export const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png']);

/** Signed PUT URL for uploading an object. ContentType is deliberately left
 * unsigned (see files.routes.ts note) so RN blob uploads don't 403. */
export const signPutUrl = (storageKey: string, expiresIn = 300): Promise<string> =>
  getSignedUrl(s3, new PutObjectCommand({ Bucket: STORAGE_BUCKET, Key: storageKey }), { expiresIn });

/** Short-lived signed GET URL for reading a private object. */
export const signGetUrl = (storageKey: string, expiresIn = 900): Promise<string> =>
  getSignedUrl(s3, new GetObjectCommand({ Bucket: STORAGE_BUCKET, Key: storageKey }), { expiresIn });

const AVATAR_PREFIX = 'avatars';

/** Deterministic storage key for a user's avatar upload. */
export const buildAvatarKey = (userId: string, fileName: string): string => {
  const ext = (fileName.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  return `${AVATAR_PREFIX}/${userId}/${crypto.randomUUID()}.${ext}`;
};

/** Guard: a confirm call may only attach a key under the caller's own folder. */
export const isOwnedAvatarKey = (storageKey: string, userId: string): boolean =>
  storageKey.startsWith(`${AVATAR_PREFIX}/${userId}/`);
