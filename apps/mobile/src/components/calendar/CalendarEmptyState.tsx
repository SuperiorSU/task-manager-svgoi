import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

interface CalendarEmptyStateProps {
  date: string;
}

export const CalendarEmptyState = ({ date }: CalendarEmptyStateProps) => {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surface.background }]}>
        <Feather name="calendar" size={32} color={colors.text.tertiary} />
      </View>
      <Text style={[styles.title, { color: colors.text.primary }]}>No tasks on this day</Text>
      <Text style={[styles.sub, { color: colors.text.tertiary }]}>{dayjs(date).format('dddd, MMMM D')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[10],
    paddingHorizontal: Spacing[8],
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  title: { ...Typography.h4, fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  sub: { ...Typography.bodyMd, fontFamily: 'Inter-Regular', textAlign: 'center' },
});