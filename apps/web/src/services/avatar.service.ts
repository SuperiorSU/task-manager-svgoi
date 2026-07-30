import { api } from '@/lib/api';
import type { User } from '@godigitify/types';

const AVATAR_SIZE = 512;
const AVATAR_QUALITY = 0.7;

type Envelope<T> = { data: T };

/**
 * Center-square crop + downscale to 512px + JPEG compression, done client-side
 * with a canvas. No upload library and no raw multi-MB file ever leaves the
 * browser — the same size/shape contract as the mobile avatar flow.
 */
async function processToSquareBlob(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser cannot process images.');
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', AVATAR_QUALITY)
  );
  if (!blob) throw new Error('Could not process the image.');
  return blob;
}

export const avatarService = {
  // presign → PUT to storage → confirm; returns the caller's updated profile.
  async change(file: File): Promise<User> {
    if (!file.type.startsWith('image/')) throw new Error('Please choose an image file (JPG or PNG).');
    const blob = await processToSquareBlob(file);

    const presign = await api.post<Envelope<{ uploadUrl: string; storageKey: string }>>(
      '/files/avatar/presign',
      { fileName: 'avatar.jpg', mimeType: 'image/jpeg' }
    );
    const { uploadUrl, storageKey } = presign.data.data;

    const put = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
      body: blob,
    });
    if (!put.ok && put.status !== 0) throw new Error(`Storage upload failed (HTTP ${put.status})`);

    const confirmed = await api.post<Envelope<User>>('/files/avatar/confirm', { storageKey });
    return confirmed.data.data;
  },
};
