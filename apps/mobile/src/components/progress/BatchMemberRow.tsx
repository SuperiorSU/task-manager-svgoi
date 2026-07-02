/**
 * BatchMemberRow — one roster row in the Batch Progress screen: avatar,
 * name, contextual sub-label, status badge, chevron to the member's
 * isolated copy.
 */
import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { BatchMemberProgress } from '../../services/batchProgress.service';
import { useColors } from '../../constants/colors';
import { solidAvatarColor } from '../../utils/avatarPalette';
import { getInitials } from '../../utils/initial';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

type Props = {
  member: BatchMemberProgress;
  onPress: (taskId: string) => void;
};

export const BatchMemberRow = React.memo(({ member, onPress }: Props) => {
  const colors = useColors();
  const { task, statusLabel, subLabel, status, isAtRisk } = member;
  const initials = getInitials(task.assignee.name);

  const handlePress = useCallback(() => onPress(task.id), [onPress, task.id]);

  const badge = (() => {
    switch (status) {
      case 'REVIEW': return { bg: colors.status.underReview.bg, text: colors.status.underReview.text };
      case 'DONE': return { bg: colors.status.completed.bg, text: colors.status.completed.text };
      case 'ACTIVE': return { bg: colors.status.inProgress.bg, text: colors.status.inProgress.text };
      case 'CANCELLED': return { bg: colors.status.cancelled.bg, text: colors.status.cancelled.text };
      case 'NOT_STARTED':
      default: return { bg: colors.status.pending.bg, text: colors.status.pending.text };
    }
  })();

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface.card, borderTopColor: colors.surface.border },
        pressed && { opacity: 0.85 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${task.assignee.name} — ${statusLabel}`}
    >
      <View style={[styles.avatar, { backgroundColor: solidAvatarColor(initials) }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.textCol}>
        <Text style={[styles.name, { color: colors.text.primary }]} numberOfLines={1}>
          {task.assignee.name}
        </Text>
        <View style={styles.subRow}>
          {isAtRisk && <Feather name="alert-triangle" size={11} color={colors.semantic.error} />}
          <Text
            style={[styles.subLabel, { color: isAtRisk ? colors.semantic.error : colors.text.tertiary }]}
            numberOfLines={1}
          >
            {subLabel}
          </Text>
        </View>
      </View>

      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.badgeText, { color: badge.text }]}>{statusLabel}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.text.disabled} />
    </Pressable>
  );
});

BatchMemberRow.displayName = 'BatchMemberRow';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3] + 1,
    borderTopWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 13, fontFamily: 'Inter-Bold', color: '#FFFFFF' },
  textCol: { flex: 1, minWidth: 0, gap: 2 },
  name: { ...Typography.bodyLg, fontFamily: 'Inter-SemiBold' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  subLabel: { ...Typography.captionSm, fontFamily: 'Inter-Regular', flexShrink: 1 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, flexShrink: 0 },
  badgeText: { ...Typography.labelSm, fontFamily: 'Inter-Bold', letterSpacing: 0.3 },
});
