import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import type { TaskStatus } from '@godigitify/types';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

type Props = { status: TaskStatus; isOverdue?: boolean };

export const TaskStatusBadge = React.memo(({ status, isOverdue }: Props) => {
  const colors = useColors();

  const STATUS_MAP: Record<TaskStatus, { bg: string; text: string; label: string }> = {
    PENDING:      { bg: colors.status.pending.bg,     text: colors.status.pending.text,     label: 'Pending' },
    ACCEPTED:     { bg: colors.status.accepted.bg,    text: colors.status.accepted.text,    label: 'Accepted' },
    IN_PROGRESS:  { bg: colors.status.inProgress.bg,  text: colors.status.inProgress.text,  label: 'In Progress' },
    UNDER_REVIEW: { bg: colors.status.underReview.bg, text: colors.status.underReview.text, label: 'Under Review' },
    COMPLETED:    { bg: colors.status.completed.bg,   text: colors.status.completed.text,   label: 'Completed' },
    CANCELLED:    { bg: colors.status.cancelled.bg,   text: colors.status.cancelled.text,   label: 'Cancelled' },
  };

  const config = isOverdue
    ? { bg: colors.status.overdue.bg, text: colors.status.overdue.text, label: 'Overdue' }
    : STATUS_MAP[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.text }]}>{config.label.toUpperCase()}</Text>
    </View>
  );
});

TaskStatusBadge.displayName = 'TaskStatusBadge';

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  label: {
    ...Typography.labelSm,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.5,
  },
});
