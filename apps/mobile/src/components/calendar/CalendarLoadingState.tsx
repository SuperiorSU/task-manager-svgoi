import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Skeleton } from '../ui/Skeleton';
import { CalendarSkeleton } from './CalendarSkeleton';

export const CalendarLoadingState = () => {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      <View style={[styles.skHeader, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Skeleton height={22} width={160} borderRadius={6} />
        <View style={styles.skToggle}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={32} width={72} borderRadius={8} />
          ))}
        </View>
      </View>
      <CalendarSkeleton />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  skHeader: {
    padding: Spacing[5],
    gap: Spacing[3],
    borderBottomWidth: 1,
  },
  skToggle: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
});