import { useCallback, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { filesApi } from '@godigitify/api-client';
import type { User } from '@godigitify/types';

import { useAuthStore } from '../stores/auth.store';
import { queryKeys } from '../constants/queryKeys';

const AVATAR_SIZE = 512; // square avatars — one dimension is plenty
const AVATAR_QUALITY = 0.7;

/**
 * Profile-photo change flow: pick from library → native square crop → downscale
 * + compress → presign → PUT (with progress) → confirm. `confirm` returns the
 * caller's profile with a freshly signed avatarUrl, which we push straight into
 * the profile cache + auth store so every avatar in the app updates at once.
 *
 * The crop step (expo-image-picker `allowsEditing`) is the user's explicit
 * confirm before anything transfers. Compression is best-effort — if
 * expo-image-manipulator isn't in the build the original cropped image uploads.
 */
export const useAvatarUpload = () => {
  const qc = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0); // 0–100
  const [error, setError] = useState<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const putWithProgress = (uploadUrl: string, blob: Blob, mimeType: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', mimeType);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        // RN XHR can report 0 on an otherwise-fine storage PUT (opaque response).
        if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 400)) resolve();
        else reject(new Error(`Storage upload failed (HTTP ${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(blob);
    });

  const changeAvatar = useCallback(async (): Promise<User | null> => {
    setError(null);

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Photo library access is needed to change your picture.');
      return null;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, // native crop UI = the confirm step
      aspect: [1, 1],
      quality: 1,
    });
    if (picked.canceled) return null;
    const asset = picked.assets[0];
    if (!asset) return null;

    setBusy(true);
    setProgress(0);
    const mimeType = 'image/jpeg';
    try {
      // Downscale to a square + compress (best-effort).
      let uri = asset.uri;
      try {
        const ImageManipulator = await import('expo-image-manipulator');
        const manipulateAsync = (ImageManipulator as { manipulateAsync?: unknown }).manipulateAsync;
        const SaveFormat = (ImageManipulator as { SaveFormat?: { JPEG?: unknown } }).SaveFormat;
        if (typeof manipulateAsync === 'function') {
          const res = await (manipulateAsync as (
            uri: string,
            actions: unknown[],
            options: { compress: number; format?: unknown }
          ) => Promise<{ uri: string }>)(
            asset.uri,
            [{ resize: { width: AVATAR_SIZE, height: AVATAR_SIZE } }],
            { compress: AVATAR_QUALITY, format: SaveFormat?.JPEG ?? 'jpeg' }
          );
          uri = res.uri;
        }
      } catch (e) {
        console.warn('[useAvatarUpload] resize skipped:', e);
      }

      const presign = await filesApi.avatarPresign({ fileName: 'avatar.jpg', mimeType });
      const blob = await (await fetch(uri)).blob();
      await putWithProgress(presign.data.uploadUrl, blob, mimeType);
      const confirmed = await filesApi.avatarConfirm({ storageKey: presign.data.storageKey });
      const updated = confirmed.data;

      qc.setQueryData(queryKeys.auth.profile(), updated);
      updateUser(updated);
      setBusy(false);
      setProgress(0);
      xhrRef.current = null;
      return updated;
    } catch (e) {
      setBusy(false);
      setProgress(0);
      xhrRef.current = null;
      console.warn('[useAvatarUpload] avatar upload failed:', e);
      setError(e instanceof Error ? e.message : 'Could not update photo. Please try again.');
      return null;
    }
  }, [qc, updateUser]);

  return { busy, progress, error, changeAvatar };
};
