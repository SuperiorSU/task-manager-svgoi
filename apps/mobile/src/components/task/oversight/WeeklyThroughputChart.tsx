import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import type { WeeklyThroughputPoint } from '../../../data/superAdminTasks.mock';
import { useColors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing } from '../../../constants/spacing';

type Props = {
  points: WeeklyThroughputPoint[];
};

const CHART_HEIGHT = 64;

export const WeeklyThroughputChart = React.memo(({ points }: Props) => {
  const colors = useColors();
  const maxValue = Math.max(1, ...points.flatMap((p) => [p.created, p.completed]));

  return (
    <View>
      <View style={styles.row}>
        {points.map((point) => (
          <View key={point.day} style={styles.col}>
            <View style={styles.bars}>
              <View
                style={[
                  styles.bar,
                  { height: (point.created / maxValue) * CHART_HEIGHT, backgroundColor: colors.surface.borderStrong },
                ]}
              />
              <View
                style={[
                  styles.bar,
                  { height: (point.completed / maxValue) * CHART_HEIGHT, backgroundColor: colors.brand.secondary },
                ]}
              />
            </View>
            <Text style={[styles.dayLabel, { color: colors.text.tertiary }]}>{point.day}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.legendRow, { borderTopColor: colors.surface.background }]}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.surface.borderStrong }]} />
          <Text style={[styles.legendText, { color: colors.text.secondary }]}>Created</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.brand.secondary }]} />
          <Text style={[styles.legendText, { color: colors.text.secondary }]}>Completed</Text>
        </View>
      </View>
    </View>
  );
});

WeeklyThroughputChart.displayName = 'WeeklyThroughputChart';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 9,
    height: CHART_HEIGHT + 14,
  },
  col: { flex: 1, alignItems: 'center', gap: 6 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: CHART_HEIGHT },
  bar: { width: 8, borderRadius: 3, minHeight: 2 },
  dayLabel: { fontSize: 10, fontFamily: 'Inter-Regular' },
  legendRow: {
    flexDirection: 'row',
    gap: Spacing[4],
    marginTop: Spacing[3] + 1,
    paddingTop: Spacing[3],
    borderTopWidth: 1,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 2 },
  legendText: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Regular',
  },
});
