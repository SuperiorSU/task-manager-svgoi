import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import dayjs from 'dayjs';

import type { CalendarTask } from '../../data/calendar.mock';
import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Layout } from '../../constants/spacing';

const STATUS_LABEL: Record<CalendarTask['status'], string> = {
  PENDING:      'Pending',
  ACCEPTED:     'Accepted',
  IN_PROGRESS:  'In Progress',
  UNDER_REVIEW: 'Under Review',
  COMPLETED:    'Completed',
  CANCELLED:    'Cancelled',
};

type Props = {
  task: CalendarTask;
  onPress?: (task: CalendarTask) => void;
};

export const CalendarDayTaskCard = React.memo(({ task, onPress }: Props) => {
  const colors = useColors();
  const d = dayjs(task.dueDate);
  const hour = d.format('h');
  const minute = d.minute() !== 0 ? `:${d.format('mm')}` : '';
  const period = d.format('A');

  const priorityKey = task.priority.toLowerCase() as keyof typeof colors.priority;
  const stripeColor = colors.priority[priorityKey].solid;
  const statusLabel = STATUS_LABEL[task.status];
  const STATUS_COLOR_MAP: Record<string, string> = {
    PENDING:      colors.status.pending.text,
    ACCEPTED:     colors.status.accepted.text,
    IN_PROGRESS:  colors.status.inProgress.text,
    UNDER_REVIEW: colors.status.underReview.text,
    COMPLETED:    colors.status.completed.text,
    CANCELLED:    colors.status.cancelled.text,
  };
  const statusColor = STATUS_COLOR_MAP[task.status] ?? colors.text.secondary;

  return (
    <Pressable
      onPress={() => onPress?.(task)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface.card },
        pressed && { opacity: 0.82 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}, ${statusLabel}`}
    >
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />

      <View style={styles.timeCol}>
        <Text style={[styles.timeHour, { color: colors.text.primary }]}>
          {hour}{minute}
        </Text>
        <Text style={[styles.timePeriod, { color: colors.text.tertiary }]}>{period}</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.surface.border }]} />

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={2}>
          {task.title}
        </Text>
        <Text style={[styles.meta, { color: colors.text.tertiary }]} numberOfLines={1}>
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
    lineHeight: 16,
  },
  timePeriod: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    lineHeight: 14,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
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
    lineHeight: 18,
  },
  meta: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
  },
  status: {
    fontFamily: 'Inter-Medium',
  },
});
