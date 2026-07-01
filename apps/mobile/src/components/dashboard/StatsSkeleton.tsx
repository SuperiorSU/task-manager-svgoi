import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Skeleton } from '../ui/Skeleton';
import { Spacing, Layout } from '../../constants/spacing';

export const StatsSkeleton = () => (
  <View style={styles.statsGrid}>
    <View style={styles.statsRow}>
      <Skeleton height={130} borderRadius={Layout.cardRadius} style={styles.statFlex} />
      <Skeleton height={130} borderRadius={Layout.cardRadius} style={styles.statFlex} />
    </View>
    <View style={styles.statsRow}>
      <Skeleton height={130} borderRadius={Layout.cardRadius} style={styles.statFlex} />
      <Skeleton height={130} borderRadius={Layout.cardRadius} style={styles.statFlex} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  statsGrid: { gap: Spacing[3] },
  statsRow: { flexDirection: 'row', gap: Spacing[3] },
  statFlex: { flex: 1 },
});