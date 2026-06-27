import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import dayjs from 'dayjs';

import type { CalendarTask } from '../../data/calendar.mock';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Layout } from '../../constants/spacing';

// ─── Status label map ─────────────────────────────────────────────────────────

const STATUS_LABEL: Record<CalendarTask['status'], string> = {
  PENDING:      'Pending',
  ACCEPTED:     'Accepted',
  IN_PROGRESS:  'In Progress',
  UNDER_REVIEW: 'Under Review',
  COMPLETED:    'Completed',
  CANCELLED:    'Cancelled',
};

const STATUS_COLOR: Record<CalendarTask['status'], string> = {
  PENDING:      Colors.status.pending.text,
  ACCEPTED:     Colors.status.accepted.text,
  IN_PROGRESS:  Colors.status.inProgress.text,
  UNDER_REVIEW: Colors.status.underReview.text,
  COMPLETED:    Colors.status.completed.text,
  CANCELLED:    Colors.status.cancelled.text,
};

type Props = {
  task: CalendarTask;
  onPress?: (task: CalendarTask) => void;
};

export const CalendarDayTaskCard = React.memo(({ task, onPress }: Props) => {
  const d = dayjs(task.dueDate);
  const hour = d.format('h');
  const minute = d.minute() !== 0 ? `:${d.format('mm')}` : '';
  const period = d.format('A');

  const priorityKey = task.priority.toLowerCase() as keyof typeof Colors.priority;
  const stripeColor = Colors.priority[priorityKey].solid;
  const statusLabel = STATUS_LABEL[task.status];
  const statusColor = STATUS_COLOR[task.status];

  return (
    <Pressable
      onPress={() => onPress?.(task)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.82 }]}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}, ${statusLabel}`}
    >
      {/* 4pt priority stripe */}
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />

      {/* Time column */}
      <View style={styles.timeCol}>
        <Text style={styles.timeHour}>
          {hour}{minute}
        </Text>
        <Text style={styles.timePeriod}>{period}</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {task.department}
          <Text style={[styles.status, { color: statusColor }]}>
            {'  ·  '}{statusLabel}
          </Text>
        </Text>
      </View>
    </Pressable>
  );
});

CalendarDayTaskCard.displayName = 'CalendarDayTaskCard';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.card,
    borderRadius: Layout.cardRadius,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stripe: {
    width: 4,
    alignSelf: 'stretch',
  },
  timeCol: {
    width: 44,
    alignItems: 'center',
    paddingVertical: Spacing[3],
  },
  timeHour: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    color: Colors.text.primary,
    lineHeight: 16,
  },
  timePeriod: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
    lineHeight: 14,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: Colors.surface.border,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    gap: 3,
  },
  title: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
    lineHeight: 18,
  },
  meta: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
  },
  status: {
    fontFamily: 'Inter-Medium',
  },
});
