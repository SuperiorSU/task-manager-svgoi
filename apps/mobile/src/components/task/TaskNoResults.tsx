import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

type Props = {
  search: string;
};

export const TaskNoResults = ({ search }: Props) => {
  const colors = useColors();
  return (
    <View style={s.wrap}>
      <Feather name="search" size={36} color={colors.text.tertiary} />
      <Text style={[s.title, { color: colors.text.primary }]}>No results for "{search}"</Text>
      <Text style={[s.sub, { color: colors.text.tertiary }]}>
        Try a different name, department, or task ID
      </Text>
    </View>
  );
};

const s = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: Spacing[2],
    paddingTop: 60,
    paddingHorizontal: Spacing[8],
  },
  title: { ...Typography.h4, fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  sub: { ...Typography.bodyMd, fontFamily: 'Inter-Regular', textAlign: 'center' },
});
