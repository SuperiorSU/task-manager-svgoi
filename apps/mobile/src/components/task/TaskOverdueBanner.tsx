import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Layout } from '../../constants/spacing';

type Props = {
  count: number;
  onPress: () => void;
};

export const TaskOverdueBanner = ({ count, onPress }: Props) => {
  const colors = useColors();
  if (count === 0) return null;
  return (
    <Pressable
      onPress={onPress}
      style={[
        s.row,
        {
          backgroundColor: colors.semantic.errorBg,
          borderColor: colors.status.overdue.solid,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${count} overdue task${count > 1 ? 's' : ''}. Tap to review.`}
    >
      <View style={s.iconWrap}>
        <Feather name="alert-triangle" size={16} color={colors.semantic.error} />
      </View>
      <View style={s.textBlock}>
        <Text style={[s.title, { color: colors.semantic.error }]}>
          {count} task{count > 1 ? 's' : ''} overdue
        </Text>
        <Text style={[s.sub, { color: colors.status.overdue.text }]}>
          Tap to review overdue tasks
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.semantic.error} />
    </Pressable>
  );
};

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[3],
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  title: { ...Typography.labelMd, fontFamily: 'Inter-SemiBold' },
  sub: { ...Typography.caption, fontFamily: 'Inter-Regular' },
});
