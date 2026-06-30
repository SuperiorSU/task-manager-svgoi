import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Skeleton } from '../ui/Skeleton';
import { Spacing } from '../../constants/spacing';

interface ListSkeletonProps {
  rows?: number;
}

export const ListSkeleton = ({ rows = 3 }: ListSkeletonProps) => (
  <View style={styles.skeletonList}>
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} height={72} borderRadius={12} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeletonList: { gap: Spacing[2], marginTop: Spacing[3] },
});