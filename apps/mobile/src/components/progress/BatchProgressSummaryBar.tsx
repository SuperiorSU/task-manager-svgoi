/**
 * BatchProgressSummaryBar — segmented "overall completion" bar + legend,
 * fully data-driven from a list of segments (status/count/percent/color).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import type { BatchSegment } from '../../services/batchProgress.service';
import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Layout } from '../../constants/spacing';

type Props = {
  segments: BatchSegment[];
  doneCount: number;
  totalMembers: number;
};

export const BatchProgressSummaryBar = React.memo(({ segments, doneCount, totalMembers }: Props) => {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface.card }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text.secondary }]}>Overall completion</Text>
        <Text style={[styles.count, { color: colors.semantic.success }]}>
          {doneCount} of {totalMembers} done
        </Text>
      </View>

      <View style={[styles.track, { backgroundColor: colors.surface.background }]}>
        {segments.map((seg) => (
          <View key={seg.status} style={{ width: `${seg.percent}%`, backgroundColor: seg.color }} />
        ))}
      </View>

      <View style={styles.legendGrid}>
        {segments.map((seg) => (
          <View key={seg.status} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: seg.color }]} />
            <Text style={[styles.legendLabel, { color: colors.text.secondary }]}>
              {seg.label === 'REVIEW' ? 'Under review' : seg.label === 'TO DO' ? 'Not started' : seg.label.charAt(0) + seg.label.slice(1).toLowerCase()}
            </Text>
            <Text style={[styles.legendCount, { color: colors.text.primary }]}>{seg.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

BatchProgressSummaryBar.displayName = 'BatchProgressSummaryBar';

const styles = StyleSheet.create({
  card: {
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[3] + 2 },
  title: { ...Typography.labelLg, fontFamily: 'Inter-SemiBold' },
  count: { ...Typography.labelLg, fontFamily: 'Inter-Bold' },
  track: {
    height: 10,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing[4],
    rowGap: Spacing[2] + 2,
  },
  legendRow: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendLabel: { ...Typography.bodySm, fontFamily: 'Inter-Regular', flex: 1 },
  legendCount: { ...Typography.bodySm, fontFamily: 'Inter-Bold' },
});
