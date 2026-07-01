import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import dayjs from 'dayjs';

import type { AdminCalendarTask } from '../../data/adminCalendar.mock';
import { useColors } from '../../constants/colors';

// ─── Status → readable label ──────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDING:      'Pending',
  ACCEPTED:     'Accepted',
  IN_PROGRESS:  'Active',
  UNDER_REVIEW: 'Under Review',
  COMPLETED:    'Completed',
  CANCELLED:    'Cancelled',
};

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  task: AdminCalendarTask;
  onPress?: (task: AdminCalendarTask) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const AdminCalendarTaskCard = React.memo(({ task, onPress }: Props) => {
  const colors = useColors();
  const timeStr = dayjs(task.dueDate).format('h:mm A');
  const priorityKey = task.priority.toLowerCase() as keyof typeof colors.priority;
  const stripeColor = colors.priority[priorityKey].solid;
  const firstName = task.assignee.name.split(' ')[0] ?? task.assignee.name;

  return (
    <Pressable
      onPress={() => onPress?.(task)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface.card },
        pressed && { opacity: 0.82, transform: [{ scale: 0.99 }] },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}, assigned to ${task.assignee.name}`}
    >
      {/* Priority stripe */}
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />

      {/* Card body */}
      <View style={styles.inner}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: task.assignee.avatarColor }]}>
          <Text style={styles.initials}>{task.assignee.initials}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text
            style={[styles.title, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {firstName} · {timeStr} · {STATUS_LABEL[task.status] ?? task.status}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

AdminCalendarTaskCard.displayName = 'AdminCalendarTaskCard';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  stripe: {
    width: 4,
    flexShrink: 0,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 14,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initials: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  meta: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    letterSpacing: 0,
  },
});
