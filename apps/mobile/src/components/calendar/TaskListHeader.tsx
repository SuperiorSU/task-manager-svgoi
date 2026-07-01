import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import dayjs from 'dayjs';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

interface TaskListHeaderProps {
  date: string;
  count: number;
}

export const TaskListHeader = ({ date, count }: TaskListHeaderProps) => {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.text, { color: colors.text.secondary }]}>
        {dayjs(date).format('dddd, D MMMM')}
      </Text>
      <View style={[styles.badge, { backgroundColor: colors.brand.primaryLight }]}>
        <Text style={[styles.badgeText, { color: colors.brand.primary }]}>
          {count} task{count !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  text: { ...Typography.labelMd, fontFamily: 'Inter-SemiBold', flex: 1 },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { ...Typography.labelSm, fontFamily: 'Inter-SemiBold' },
});