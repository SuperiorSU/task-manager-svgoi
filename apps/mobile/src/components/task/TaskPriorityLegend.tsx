import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Layout } from '../../constants/spacing';

const PRIORITIES = [
  { label: 'Critical', color: Colors.priority.critical.solid },
  { label: 'High',     color: Colors.priority.high.solid },
  { label: 'Medium',   color: Colors.priority.medium.solid },
  { label: 'Low',      color: Colors.priority.low.solid },
] as const;

export const TaskPriorityLegend = React.memo(() => (
  <View style={styles.card}>
    <Text style={styles.heading}>Priority</Text>
    <View style={styles.row}>
      {PRIORITIES.map((p) => (
        <View key={p.label} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: p.color }]} />
          <Text style={styles.label}>{p.label}</Text>
        </View>
      ))}
    </View>
  </View>
));

TaskPriorityLegend.displayName = 'TaskPriorityLegend';

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
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
    color: Colors.text.secondary,
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
    color: Colors.text.primary,
  },
});
