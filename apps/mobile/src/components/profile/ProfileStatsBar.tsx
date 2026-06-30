import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import type { ProfileStats } from '../../data/profile.mock';
import { useColors } from '../../constants/colors';

type Props = { stats: ProfileStats };

type StatCellProps = {
  value: string;
  label: string;
  borderRight?: boolean;
};

const StatCell = React.memo(({ value, label, borderRight }: StatCellProps) => {
  const colors = useColors();
  return (
    <View style={[s.cell, borderRight && { borderRightWidth: 1, borderRightColor: colors.surface.border }]}>
      <Text style={[s.value, { color: colors.text.primary }]}>{value}</Text>
      <Text style={[s.label, { color: colors.text.tertiary }]}>{label}</Text>
    </View>
  );
});

StatCell.displayName = 'StatCell';

export const ProfileStatsBar = React.memo(({ stats }: Props) => {
  const colors = useColors();
  return (
    <View style={[s.container, { borderTopColor: colors.surface.border }]}>
      <StatCell value={`${stats.onTimeRate}%`} label="On-time" borderRight />
      <StatCell value={String(stats.completed)} label="Completed" borderRight />
      <StatCell value={String(stats.active)} label="Active" />
    </View>
  );
});

ProfileStatsBar.displayName = 'ProfileStatsBar';

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    marginTop: 18,
    width: '100%',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  value: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 24,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
});
