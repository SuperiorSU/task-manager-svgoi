import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing, Layout } from '../../../constants/spacing';

type Props = {
  progress: number;          // 0–100
  completedSubtasks: number;
  totalSubtasks: number;
};

export const TaskProgressBar = React.memo(({ progress, completedSubtasks, totalSubtasks }: Props) => {
  const pct = Math.min(100, Math.max(0, progress));
  const color =
    pct === 100
      ? Colors.semantic.success
      : pct >= 50
      ? Colors.brand.primary
      : Colors.semantic.warning;

  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Progress</Text>
        <Text style={[styles.pctText, { color }]}>{pct}%</Text>
      </View>

      {/* Track */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
      </View>

      {totalSubtasks > 0 && (
        <Text style={styles.subtaskText}>
          {completedSubtasks} of {totalSubtasks} subtasks completed
        </Text>
      )}
    </View>
  );
});

TaskProgressBar.displayName = 'TaskProgressBar';

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  pctText: {
    ...Typography.h4,
    fontFamily: 'Inter-Bold',
  },
  track: {
    height: 8,
    backgroundColor: Colors.surface.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  subtaskText: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
  },
});
