import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { getApiClient } from '@godigitify/api-client';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const useFileUpload = (taskId: string) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (isProof = false) => {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return null;
    const file = result.assets[0];
    if (!file) return null;

    if (file.size && file.size > MAX_FILE_SIZE) {
      setError('File must be under 10MB');
      return null;
    }

    setUploading(true);
    try {
      const client = getApiClient();

      // 1. Get presigned URL
      const presignRes = await client.post<{
        uploadUrl: string;
        storageKey: string;
      }>('/files/presign', {
        taskId,
        fileName: file.name,
        mimeType: file.mimeType ?? 'application/octet-stream',
        isProof,
      });

      // 2. Upload directly to storage
      await fetch(presignRes.data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.mimeType ?? 'application/octet-stream' },
        body: await (await fetch(file.uri)).blob(),
      });

      // 3. Confirm with API
      const confirmed = await client.post('/files/confirm', {
        taskId,
        storageKey: presignRes.data.storageKey,
        fileName: file.name,
        fileSize: file.size ?? 0,
        mimeType: file.mimeType ?? 'application/octet-stream',
        isProof,
      });

      return confirmed.data;
    } catch (err) {
      setError('Upload failed. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading, error };
};
