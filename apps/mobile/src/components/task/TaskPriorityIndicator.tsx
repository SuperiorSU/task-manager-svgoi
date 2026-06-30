import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import type { TaskPriority } from '@godigitify/types';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

type Props = { priority: TaskPriority };

export const TaskPriorityIndicator = React.memo(({ priority }: Props) => {
  const colors = useColors();
  const pk = priority.toLowerCase() as keyof typeof colors.priority;
  const config = colors.priority[pk];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.text }]}>
        {priority.replace('_', ' ')}
      </Text>
    </View>
  );
});

TaskPriorityIndicator.displayName = 'TaskPriorityIndicator';


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
