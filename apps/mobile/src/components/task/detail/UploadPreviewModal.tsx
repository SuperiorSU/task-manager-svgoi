import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';

import type { PendingFile } from '../../../hooks/useFileUpload';
import { useColors } from '../../../constants/colors';
import { Spacing } from '../../../constants/spacing';
import { ProgressRing } from '../../ui/ProgressRing';

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

type Props = {
  file: PendingFile | null;
  uploading: boolean;
  progress: number; // 0–100
  isProof: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

// Preview-and-confirm step before an attachment actually transfers: shows a
// thumbnail (images) or a file icon (PDFs), name + size, then swaps the Upload
// button for a live progress ring while the transfer runs. Reuses ProgressRing.
export const UploadPreviewModal = ({ file, uploading, progress, isProof, error, onConfirm, onCancel }: Props) => {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={file !== null}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable style={s.backdrop} onPress={uploading ? undefined : onCancel}>
        <Pressable
          style={[s.sheet, { backgroundColor: colors.surface.card, paddingBottom: insets.bottom + Spacing[4] }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[s.handle, { backgroundColor: colors.surface.border }]} />
          <Text style={[s.title, { color: colors.text.primary }]}>
            {isProof ? 'Upload completion proof' : 'Add attachment'}
          </Text>

          {/* Preview */}
          {file && (
            <View style={s.previewRow}>
              {file.isImage ? (
                <Image source={{ uri: file.uri }} style={s.thumb} contentFit="cover" transition={120} />
              ) : (
                <View style={[s.thumb, s.fileThumb, { backgroundColor: colors.semantic.errorBg }]}>
                  <Feather name="file-text" size={30} color={colors.semantic.error} />
                </View>
              )}
              <View style={s.fileInfo}>
                <Text style={[s.fileName, { color: colors.text.primary }]} numberOfLines={2}>
                  {file.name}
                </Text>
                <Text style={[s.fileSize, { color: colors.text.tertiary }]}>{formatBytes(file.size)}</Text>
              </View>
            </View>
          )}

          {/* Error (retryable) */}
          {!uploading && error && (
            <View style={s.errorRow}>
              <Feather name="alert-circle" size={14} color={colors.semantic.error} />
              <Text style={[s.errorText, { color: colors.semantic.error }]}>{error}</Text>
            </View>
          )}

          {/* Actions / progress */}
          {uploading ? (
            <View style={s.progressBlock}>
              <ProgressRing
                percent={progress}
                size={72}
                thickness={8}
                color={colors.brand.primary}
                trackColor={colors.surface.background}
                holeColor={colors.surface.card}
              >
                <Text style={{ fontSize: 15, fontFamily: 'Inter-Bold', color: colors.text.primary }}>
                  {progress}%
                </Text>
              </ProgressRing>
              <Text style={[s.uploadingNote, { color: colors.text.tertiary }]}>
                Uploading… keep the app open until this finishes.
              </Text>
              <Pressable
                onPress={onCancel}
                style={({ pressed }) => [s.cancelBtn, { borderColor: colors.surface.border }, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel="Cancel upload"
              >
                <Text style={[s.cancelText, { color: colors.text.secondary }]}>Cancel upload</Text>
              </Pressable>
            </View>
          ) : (
            <View style={s.actions}>
              <Pressable
                onPress={onConfirm}
                style={({ pressed }) => [s.uploadBtn, { backgroundColor: colors.brand.primary }, pressed && { opacity: 0.88 }]}
                accessibilityRole="button"
                accessibilityLabel="Upload"
              >
                <Feather name="upload" size={16} color="#FFFFFF" />
                <Text style={s.uploadText}>Upload</Text>
              </Pressable>
              <Pressable
                onPress={onCancel}
                style={({ pressed }) => [s.cancelBtn, { borderColor: colors.surface.border }, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={[s.cancelText, { color: colors.text.secondary }]}>Cancel</Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.5)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 10 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  title: { fontSize: 16, fontFamily: 'Inter-SemiBold', textAlign: 'center', marginBottom: 18 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  thumb: { width: 64, height: 64, borderRadius: 12 },
  fileThumb: { alignItems: 'center', justifyContent: 'center' },
  fileInfo: { flex: 1, minWidth: 0, gap: 4 },
  fileName: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  fileSize: { fontSize: 12, fontFamily: 'Inter-Regular' },
  actions: { gap: 10, marginTop: 22 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 12,
  },
  uploadText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
  cancelBtn: { height: 50, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  progressBlock: { alignItems: 'center', gap: 14, marginTop: 22 },
  uploadingNote: { fontSize: 12.5, fontFamily: 'Inter-Regular', textAlign: 'center' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  errorText: { flex: 1, fontSize: 12.5, fontFamily: 'Inter-Regular' },
});
