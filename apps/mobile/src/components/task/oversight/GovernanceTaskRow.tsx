import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import type { GovernanceStage, GovernanceTask } from '@godigitify/types';
import { useColors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { getInitials } from '../../../utils/initial';

const STAGE_META: Record<GovernanceStage, { bg: string; text: string; label: string; stripe: string }> = {
  ASSIGNED: { bg: '#F1F5F9', text: '#475569', label: 'ASSIGNED', stripe: '#94A3B8' },
  IN_PROGRESS: { bg: '#FFFBEB', text: '#B45309', label: 'IN PROGRESS', stripe: '#F59E0B' },
  SUBMITTED: { bg: '#F5F3FF', text: '#6D28D9', label: 'REVIEW', stripe: '#10B981' },
  APPROVED: { bg: '#F0FDF4', text: '#15803D', label: 'APPROVED', stripe: '#22C55E' },
  REVISION_REQUESTED: { bg: '#FEF2F2', text: '#B91C1C', label: 'SENT BACK', stripe: '#EF4444' },
};

type Props = {
  task: GovernanceTask;
  onPress: (task: GovernanceTask) => void;
};

// Row for the "Assigned by me" tracker (screen 62) — unlike the aggregate
// oversight rows above, these ARE the SA's own governance tasks so full
// titles are shown (no FR-72 restriction applies to tasks the SA created).
export const GovernanceTaskRow = React.memo(({ task, onPress }: Props) => {
  const colors = useColors();
  const meta = STAGE_META[task.stage];
  const metaLine =
    task.stage === 'SUBMITTED'
      ? `${task.assignee.name} · submitted ${dayjs(task.updatedAt).fromNow()}`
      : task.stage === 'REVISION_REQUESTED'
        ? `${task.assignee.name} · sent back ${dayjs(task.updatedAt).fromNow()}`
        : task.stage === 'ASSIGNED'
          ? `${task.assignee.name} · assigned ${dayjs(task.createdAt).fromNow()}`
          : `${task.assignee.name} · due ${dayjs(task.dueDate).format('MMM D')}`;

  return (
    <Pressable
      onPress={() => onPress(task)}
      style={({ pressed }) => [styles.row, { backgroundColor: colors.surface.card }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={task.title}
    >
      <View style={[styles.stripe, { backgroundColor: meta.stripe }]} />
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={1}>
          {task.title}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.avatar, { backgroundColor: colors.brand.secondary }]}>
            <Text style={styles.avatarText}>{getInitials(task.assignee.name)}</Text>
          </View>
          <Text style={[styles.metaText, { color: colors.text.secondary }]} numberOfLines={1}>
            {metaLine}
          </Text>
        </View>
      </View>
      <View style={[styles.badge, { backgroundColor: meta.bg }]}>
        <Text style={[styles.badgeText, { color: meta.text }]}>{meta.label}</Text>
      </View>
    </Pressable>
  );
});

GovernanceTaskRow.displayName = 'GovernanceTaskRow';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 13,
    padding: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 1,
  },
  pressed: { opacity: 0.85 },
  stripe: { width: 4, height: 48, borderRadius: 3, flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  title: {
    ...Typography.h4,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5 },
  avatar: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 9, fontFamily: 'Inter-Bold', color: '#FFFFFF' },
  metaText: { ...Typography.labelMd, fontFamily: 'Inter-Regular', flex: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontFamily: 'Inter-Bold', letterSpacing: 0.3 },
});
