import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Layout } from '../../constants/spacing';

export const TaskPriorityLegend = React.memo(() => {
  const colors = useColors();

  const PRIORITIES = [
    { label: 'Critical', color: colors.priority.critical.solid },
    { label: 'High',     color: colors.priority.high.solid },
    { label: 'Medium',   color: colors.priority.medium.solid },
    { label: 'Low',      color: colors.priority.low.solid },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface.card }]}>
      <Text style={[styles.heading, { color: colors.text.secondary }]}>Priority</Text>
      <View style={styles.row}>
        {PRIORITIES.map((p) => (
          <View key={p.label} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: p.color }]} />
            <Text style={[styles.label, { color: colors.text.primary }]}>{p.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

TaskPriorityLegend.displayName = 'TaskPriorityLegend';

const styles = StyleSheet.create({
  card: {
    borderRadius: Layout.cardRadius,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  heading: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing[5],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Regular',
  },
});
