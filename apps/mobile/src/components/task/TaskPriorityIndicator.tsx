import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import type { TaskPriority } from '@godigitify/types';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

const PRIORITY_MAP: Record<TaskPriority, { solid: string; bg: string; text: string; label: string }> = {
  CRITICAL: { ...Colors.priority.critical, label: 'Critical' },
  HIGH:     { ...Colors.priority.high,     label: 'High' },
  MEDIUM:   { ...Colors.priority.medium,   label: 'Medium' },
  LOW:      { ...Colors.priority.low,      label: 'Low' },
};

type Props = { priority: TaskPriority };

export const TaskPriorityIndicator = React.memo(({ priority }: Props) => {
  const config = PRIORITY_MAP[priority];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.text }]}>
        {config.label.toUpperCase()}
      </Text>
    </View>
  );
});

TaskPriorityIndicator.displayName = 'TaskPriorityIndicator';

export const priorityStripeColor = (priority: TaskPriority): string =>
  PRIORITY_MAP[priority].solid;

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  label: {
    ...Typography.labelSm,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
  },
});
