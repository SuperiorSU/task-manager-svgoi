import React from 'react';
import { View, StyleSheet } from 'react-native';

import { useColors } from '../../constants/colors';
import { Spacing, Layout } from '../../constants/spacing';
import { Skeleton } from '../ui/Skeleton';

export const CalendarSkeleton = () => {
  const colors = useColors();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface.background }]}>
      <Skeleton height={180} borderRadius={0} />
      <View style={styles.rows}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={72} borderRadius={Layout.cardRadius} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  rows: { gap: Spacing[3], padding: Spacing[4] },
});