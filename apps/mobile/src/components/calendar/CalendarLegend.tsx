import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

const ITEMS = [
  { label: 'Critical', color: Colors.priority.critical.solid },
  { label: 'High',     color: Colors.priority.high.solid },
  { label: 'Medium',   color: Colors.priority.medium.solid },
  { label: 'Low',      color: Colors.priority.low.solid },
] as const;

export const CalendarLegend = React.memo(() => (
  <View style={styles.row}>
    {ITEMS.map(({ label, color }) => (
      <View key={label} style={styles.item}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.label}>{label}</Text>
      </View>
    ))}
  </View>
));

CalendarLegend.displayName = 'CalendarLegend';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.surface.border,
    backgroundColor: Colors.surface.card,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    ...Typography.caption,
    fontFamily: 'Inter-Medium',
    color: Colors.text.secondary,
  },
});
