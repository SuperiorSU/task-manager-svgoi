import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import type { TaskStatus } from '@godigitify/types';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

const STATUS_MAP: Record<
  TaskStatus,
  { bg: string; text: string; label: string }
> = {
  PENDING:      { bg: Colors.status.pending.bg,     text: Colors.status.pending.text,     label: 'Pending' },
  ACCEPTED:     { bg: Colors.status.accepted.bg,    text: Colors.status.accepted.text,    label: 'Accepted' },
  IN_PROGRESS:  { bg: Colors.status.inProgress.bg,  text: Colors.status.inProgress.text,  label: 'In Progress' },
  UNDER_REVIEW: { bg: Colors.status.underReview.bg, text: Colors.status.underReview.text, label: 'Under Review' },
  COMPLETED:    { bg: Colors.status.completed.bg,   text: Colors.status.completed.text,   label: 'Completed' },
  CANCELLED:    { bg: Colors.status.cancelled.bg,   text: Colors.status.cancelled.text,   label: 'Cancelled' },
};

type Props = { status: TaskStatus; isOverdue?: boolean };

export const TaskStatusBadge = React.memo(({ status, isOverdue }: Props) => {
  const config = isOverdue
    ? { bg: Colors.status.overdue.bg, text: Colors.status.overdue.text, label: 'Overdue' }
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
