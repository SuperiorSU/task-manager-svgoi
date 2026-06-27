import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

export const CalendarLegend = React.memo(() => {
  const colors = useColors();

  const ITEMS = [
    { label: 'Critical', color: colors.priority.critical.solid },
    { label: 'High',     color: colors.priority.high.solid },
    { label: 'Medium',   color: colors.priority.medium.solid },
    { label: 'Low',      color: colors.priority.low.solid },
  ];

  return (
    <View style={[
      styles.row,
      { borderTopColor: colors.surface.border, backgroundColor: colors.surface.card },
    ]}>
      {ITEMS.map(({ label, color }) => (
        <View key={label} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.label, { color: colors.text.secondary }]}>{label}</Text>
        </View>
      ))}
    </View>
  );
});

CalendarLegend.displayName = 'CalendarLegend';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderTopWidth: 1,
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
  },
});
