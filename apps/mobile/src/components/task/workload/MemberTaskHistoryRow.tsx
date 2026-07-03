import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import dayjs from 'dayjs';

import { isTaskOverdue, type MockTask } from '../../../data/tasks.mock';
import { useColors } from '../../../constants/colors';

type StatusMeta = { label: string; bg: string; color: string; stripe: string };

const STATUS_META: Record<string, StatusMeta> = {
  PENDING: { label: 'PENDING', bg: '#F1F5F9', color: '#475569', stripe: '#94A3B8' },
  ACCEPTED: { label: 'ACCEPTED', bg: '#EFF6FF', color: '#1D4ED8', stripe: '#60A5FA' },
  IN_PROGRESS: { label: 'ACTIVE', bg: '#FFFBEB', color: '#B45309', stripe: '#F59E0B' },
  UNDER_REVIEW: { label: 'REVIEW', bg: '#F5F3FF', color: '#6D28D9', stripe: '#7C3AED' },
  COMPLETED: { label: 'DONE', bg: '#F0FDF4', color: '#15803D', stripe: '#16A34A' },
  CANCELLED: { label: 'CANCELLED', bg: '#F8FAFC', color: '#94A3B8', stripe: '#94A3B8' },
};

const OVERDUE_META: StatusMeta = { label: 'OVERDUE', bg: '#FEF2F2', color: '#B91C1C', stripe: '#EF4444' };

type Props = { task: MockTask; onPress: (task: MockTask) => void };

// Task history row (HTML screen 74) — left status-coloured stripe, title,
// context subtitle, compact status badge. Mirrors StaffTaskRow's shape
// (oversight module precedent) with a DONE case added for completed tasks.
export const MemberTaskHistoryRow = React.memo(({ task, onPress }: Props) => {
  const colors = useColors();
  const overdue = isTaskOverdue(task);
  const meta = overdue ? OVERDUE_META : (STATUS_META[task.status] ?? STATUS_META['PENDING']!);

  const subtitle = overdue
    ? `Due ${dayjs(task.dueDate).format('MMM D')} · ${dayjs().diff(dayjs(task.dueDate), 'day')}d late`
    : task.status === 'UNDER_REVIEW'
      ? `Submitted · awaiting ${task.creator.name}`
      : task.status === 'COMPLETED'
        ? `Completed ${dayjs(task.completedAt ?? task.dueDate).format('MMM D')}`
        : `Due ${dayjs(task.dueDate).format('MMM D')} · assigned by ${task.creator.name}`;

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
        <Text style={[styles.subtitle, { color: overdue ? '#B91C1C' : colors.text.secondary }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: meta.bg }]}>
        <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
      </View>
    </Pressable>
  );
});

MemberTaskHistoryRow.displayName = 'MemberTaskHistoryRow';

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
    elevation: 2,
  },
  pressed: { opacity: 0.85 },
  stripe: { width: 4, height: 46, borderRadius: 3, flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  subtitle: { fontSize: 11.5, fontFamily: 'Inter-Regular', marginTop: 4 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0 },
  badgeText: { fontSize: 10, fontFamily: 'Inter-Bold', letterSpacing: 0.3 },
});
