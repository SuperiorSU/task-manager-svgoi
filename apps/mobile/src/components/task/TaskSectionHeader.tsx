import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

type Props = {
  title: string;
  count: number;
};

export const TaskSectionHeader = ({ title, count }: Props) => {
  const colors = useColors();
  return (
    <View style={[s.row, { backgroundColor: colors.surface.background }]}>
      <Text style={[s.title, { color: colors.text.secondary }]}>{title}</Text>
      <View style={[s.badge, { backgroundColor: colors.brand.primaryLight }]}>
        <Text style={[s.badgeText, { color: colors.brand.primary }]}>{count}</Text>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  title: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flex: 1,
  },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { ...Typography.labelSm, fontFamily: 'Inter-Bold' },
});
