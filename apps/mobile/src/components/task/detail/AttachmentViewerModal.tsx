import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { filesApi } from '@godigitify/api-client';
import type { TaskAttachment } from '@godigitify/types';

import { useColors } from '../../../constants/colors';
import { ProgressRing } from '../../ui/ProgressRing';

type Props = {
  /** Image attachment to view, or null to close. Non-image files are opened externally by the caller. */
  attachment: TaskAttachment | null;
  onClose: () => void;
};

type Phase =
  | { kind: 'preparing' }
  | { kind: 'downloading'; progress: number }
  | { kind: 'ready'; dataUri: string }
  | { kind: 'error' };

// In-app full-screen image viewer with a real download-progress ring. The bytes
// are pulled with XMLHttpRequest (the only RN transport that reports download
// progress) off a short-lived signed URL, then shown via expo-image as a data
// URI. PDFs/other types are handled by the caller (opened in the device viewer).
export const AttachmentViewerModal = ({ attachment, onClose }: Props) => {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>({ kind: 'preparing' });

  useEffect(() => {
    if (!attachment) return;
    const att = attachment;
    let cancelled = false;
    let xhr: XMLHttpRequest | null = null;
    setPhase({ kind: 'preparing' });

    (async () => {
      try {
        const res = await filesApi.getDownloadUrl(att.id);
        if (cancelled) return;
        xhr = new XMLHttpRequest();
        xhr.open('GET', res.data.url);
        xhr.responseType = 'blob';
        xhr.onprogress = (e) => {
          if (e.lengthComputable && !cancelled) {
            setPhase({ kind: 'downloading', progress: Math.round((e.loaded / e.total) * 100) });
          }
        };
        xhr.onload = () => {
          if (cancelled) return;
          if (xhr!.status === 0 || (xhr!.status >= 200 && xhr!.status < 400)) {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (cancelled) return;
              // The stored S3 object's content-type is generic (see files.routes.ts),
              // so rebuild the data URI with the attachment's known mime type —
              // otherwise expo-image gets `data:application/octet-stream…` and
              // refuses to render it as an image.
              const raw = reader.result as string;
              const base64 = raw.includes(',') ? raw.slice(raw.indexOf(',') + 1) : raw;
              setPhase({ kind: 'ready', dataUri: `data:${att.mimeType};base64,${base64}` });
            };
            reader.onerror = () => !cancelled && setPhase({ kind: 'error' });
            reader.readAsDataURL(xhr!.response as Blob);
          } else {
            setPhase({ kind: 'error' });
          }
        };
        xhr.onerror = () => !cancelled && setPhase({ kind: 'error' });
        xhr.send();
      } catch {
        if (!cancelled) setPhase({ kind: 'error' });
      }
    })();

    return () => {
      cancelled = true;
      xhr?.abort();
    };
  }, [attachment]);

  return (
    <Modal visible={attachment !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.fileName} numberOfLines={1}>
            {attachment?.fileName ?? ''}
          </Text>
          <Pressable onPress={onClose} hitSlop={10} style={s.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
            <Feather name="x" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Body */}
        <View style={s.body}>
          {phase.kind === 'preparing' && <ActivityIndicator color="#FFFFFF" size="large" />}

          {phase.kind === 'downloading' && (
            <ProgressRing
              percent={phase.progress}
              size={90}
              thickness={9}
              color={colors.brand.primary}
              trackColor="rgba(255,255,255,0.25)"
              holeColor="#000000"
            >
              <Text style={s.progressText}>{phase.progress}%</Text>
            </ProgressRing>
          )}

          {phase.kind === 'ready' && (
            <Image source={{ uri: phase.dataUri }} style={s.image} contentFit="contain" transition={150} />
          )}

          {phase.kind === 'error' && (
            <View style={s.errorBlock}>
              <Feather name="alert-circle" size={32} color="#F87171" />
              <Text style={s.errorText}>Couldn&apos;t load this file. Please try again.</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  fileName: { flex: 1, color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter-Medium' },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12 },
  image: { width: '100%', height: '100%' },
  progressText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter-Bold' },
  errorBlock: { alignItems: 'center', gap: 12, paddingHorizontal: 40 },
  errorText: { color: '#E2E8F0', fontSize: 14, fontFamily: 'Inter-Regular', textAlign: 'center' },
});
