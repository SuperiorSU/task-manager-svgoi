import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import type { DeptStatusDistribution } from '@godigitify/types';
import { useColors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing } from '../../../constants/spacing';

// 5-bucket rollup taxonomy (pending / in progress / review / overdue /
// blocked) — `blocked` is a server-computed heuristic on the real
// `DeptStatusDistribution` type (dashboardApi.getDeptHealth()), so it's
// consumed like any other bucket now.
const BUCKETS: { key: keyof DeptStatusDistribution; label: string; color: string }[] = [
  { key: 'pending', label: 'Pending', color: '#94A3B8' },
  { key: 'inProgress', label: 'In progress', color: '#F59E0B' },
  { key: 'review', label: 'Under review', color: '#7C3AED' },
  { key: 'overdue', label: 'Overdue', color: '#EF4444' },
  { key: 'blocked', label: 'Blocked', color: '#64748B' },
];

type Props = {
  distribution: DeptStatusDistribution;
  total: number;
  size?: 'sm' | 'lg';
  showLegend?: boolean;
  onSegmentPress?: (() => void) | undefined;
};

export const StatusDistributionBar = React.memo(
  ({ distribution, total, size = 'lg', showLegend = true, onSegmentPress }: Props) => {
    const colors = useColors();
    const barHeight = size === 'lg' ? 11 : 7;

    const bar = (
      <View style={[styles.bar, { height: barHeight }]}>
        {BUCKETS.map((bucket) => {
          const count = distribution[bucket.key];
          return (
            <View
              key={bucket.key}
              style={{ flex: count > 0 ? count : 0, backgroundColor: bucket.color }}
            />
          );
        })}
      </View>
    );

    return (
      <View>
        {onSegmentPress ? (
          <Pressable onPress={onSegmentPress} accessibilityRole="button" accessibilityLabel="View tasks">
            {bar}
          </Pressable>
        ) : (
          bar
        )}
        {showLegend && (
          <View style={styles.legend}>
            {BUCKETS.map((bucket) => (
              <View key={bucket.key} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: bucket.color }]} />
                <Text style={[styles.legendText, { color: colors.text.secondary }]}>
                  {bucket.label} <Text style={[styles.legendCount, { color: colors.text.primary }]}>{distribution[bucket.key]}</Text>
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }
);

StatusDistributionBar.displayName = 'StatusDistributionBar';

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    gap: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2] + 2,
    marginTop: Spacing[3],
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 3 },
  legendText: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Regular',
  },
  legendCount: {
    fontFamily: 'Inter-SemiBold',
  },
});
