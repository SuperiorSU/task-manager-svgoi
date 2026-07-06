import { useCallback, useRef, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { filesApi } from '@godigitify/api-client';
import type { FileAttachment } from '@godigitify/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
// Must match the backend's ALLOWED_MIME_TYPES (files.routes.ts) exactly — the
// presign endpoint rejects anything else, so validating here gives a clear
// on-device message instead of a confusing server 400.
const ALLOWED = ['image/jpeg', 'image/png', 'application/pdf'];

export type PendingFile = {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
  isImage: boolean;
};

/**
 * Two-phase attachment upload so the user gets a preview + explicit confirm
 * before anything transfers, and a real 0–100% progress bar during it.
 *
 * Phase 1 `pickFile()` only opens the picker + validates; nothing uploads.
 * Phase 2 `confirmUpload()` runs presign → PUT → confirm. The PUT uses
 * XMLHttpRequest (not fetch) because only XHR exposes `upload.onprogress` in
 * React Native. `confirm` is the DB commit point, so an aborted/crashed
 * transfer only ever leaves an orphaned storage object with no DB row (benign,
 * swept by bucket lifecycle rules) — there is nothing partial to roll back.
 */
export const useFileUpload = (taskId: string) => {
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0); // 0–100
  const [error, setError] = useState<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const reset = useCallback(() => {
    setPendingFile(null);
    setUploading(false);
    setProgress(0);
    setError(null);
    xhrRef.current = null;
  }, []);

  const pickFile = useCallback(async (): Promise<PendingFile | null> => {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return null;

    const file = result.assets[0];
    if (!file) return null;

    // Normalise the common `image/jpg` alias to the canonical `image/jpeg`
    // the backend (and S3 ContentType) expects.
    const rawMime = file.mimeType ?? 'application/octet-stream';
    const mimeType = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime;
    if (!ALLOWED.includes(mimeType)) {
      setError('Only JPG, PNG or PDF files are allowed');
      return null;
    }
    if (file.size && file.size > MAX_FILE_SIZE) {
      setError('File must be under 10 MB');
      return null;
    }

    const picked: PendingFile = {
      uri: file.uri,
      name: file.name,
      size: file.size ?? 0,
      mimeType,
      isImage: mimeType.startsWith('image/'),
    };
    setPendingFile(picked);
    return picked;
  }, []);

  const putWithProgress = (uploadUrl: string, blob: Blob, mimeType: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open('PUT', uploadUrl);
      // Must match the ContentType the presign was signed with, or S3 rejects
      // the signature. `pendingFile.mimeType` is the same value sent to presign.
      xhr.setRequestHeader('Content-Type', mimeType);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        // RN's XHR sometimes reports status 0 on an otherwise-successful storage
        // PUT (opaque/no-CORS response), so only treat an explicit 4xx/5xx as a
        // failure — `filesApi.confirm` is the real commit-point validator.
        if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 400)) resolve();
        else reject(new Error(`Storage upload failed (HTTP ${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.onabort = () => reject(new Error('cancelled'));
      xhr.send(blob);
    });

  const confirmUpload = useCallback(
    async (isProof = false): Promise<FileAttachment | null> => {
      if (!pendingFile) return null;
      setError(null);
      setUploading(true);
      setProgress(0);
      try {
        const presign = await filesApi.presign({
          taskId,
          fileName: pendingFile.name,
          mimeType: pendingFile.mimeType,
          isProof,
        });
        const blob = await (await fetch(pendingFile.uri)).blob();
        await putWithProgress(presign.data.uploadUrl, blob, pendingFile.mimeType);

        const confirmed = await filesApi.confirm({
          taskId,
          storageKey: presign.data.storageKey,
          fileName: pendingFile.name,
          fileSize: pendingFile.size,
          mimeType: pendingFile.mimeType,
          isProof,
        });
        reset();
        return confirmed.data;
      } catch (err) {
        setUploading(false);
        setProgress(0);
        xhrRef.current = null;
        // A user-initiated cancel is not an error the UI should shout about.
        if (err instanceof Error && err.message === 'cancelled') {
          return null;
        }
        console.warn('[useFileUpload] upload failed:', err);
        setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
        return null;
      }
    },
    [pendingFile, taskId, reset]
  );

  const cancelUpload = useCallback(() => {
    xhrRef.current?.abort();
    reset();
  }, [reset]);

  return { pendingFile, uploading, progress, error, pickFile, confirmUpload, cancelUpload, clearPending: reset };
};
