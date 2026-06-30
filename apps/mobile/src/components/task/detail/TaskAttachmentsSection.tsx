import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { MockAttachment } from '../../../data/tasks.mock';

import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing, Layout } from '../../../constants/spacing';

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileIcon = (mimeType: string): keyof typeof Feather.glyphMap => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'file-text';
  return 'file';
};

const fileIconColor = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return Colors.brand.primary;
  if (mimeType === 'application/pdf') return Colors.semantic.error;
  return Colors.text.secondary;
};

type Props = {
  attachments: MockAttachment[];
  onAdd?: () => void;
  canAdd?: boolean;
};

export const TaskAttachmentsSection = React.memo(({ attachments, onAdd, canAdd }: Props) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Feather name="paperclip" size={16} color={Colors.brand.primary} />
        <Text style={styles.title}>Attachments</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{attachments.length}</Text>
        </View>
      </View>
      {canAdd && (
        <Pressable
          onPress={onAdd}
          style={styles.addBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="plus" size={16} color={Colors.brand.primary} />
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      )}
    </View>

    {attachments.length === 0 ? (
      <Text style={styles.emptyText}>No attachments yet</Text>
    ) : (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {attachments.map((att) => (
          <Pressable
            key={att.id}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            accessibilityLabel={`Open ${att.fileName}`}
          >
            <View style={[styles.iconWrap, { backgroundColor: att.mimeType.startsWith('image/') ? Colors.brand.primaryLight : Colors.semantic.errorBg }]}>
              <Feather name={fileIcon(att.mimeType)} size={22} color={fileIconColor(att.mimeType)} />
              {att.isProof && (
                <View style={styles.proofDot}>
                  <Feather name="check" size={8} color={Colors.text.inverse} />
                </View>
              )}
            </View>
            <Text style={styles.fileName} numberOfLines={1}>
              {att.fileName.length > 14 ? att.fileName.slice(0, 12) + '…' + att.fileName.split('.').pop() : att.fileName}
            </Text>
            <Text style={styles.fileSize}>{formatBytes(att.fileSize)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    )}
  </View>
));

TaskAttachmentsSection.displayName = 'TaskAttachmentsSection';

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  title: {
    ...Typography.h4,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  countBadge: {
    backgroundColor: Colors.brand.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    ...Typography.labelSm,
    fontFamily: 'Inter-Bold',
    color: Colors.brand.primary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addText: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Medium',
    color: Colors.brand.primary,
  },
  emptyText: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  scroll: { gap: Spacing[3], paddingVertical: Spacing[1] },
  chip: {
    width: 88,
    alignItems: 'center',
    gap: Spacing[2],
  },
  chipPressed: { opacity: 0.75 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  proofDot: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.semantic.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface.card,
  },
  fileName: {
    ...Typography.labelSm,
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  fileSize: {
    ...Typography.captionSm,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
  },
});
