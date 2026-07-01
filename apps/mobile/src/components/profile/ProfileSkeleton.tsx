import React from 'react';
import { View } from 'react-native';

import { useColors } from '../../constants/colors';
import { Skeleton } from '../ui/Skeleton';

export const ProfileSkeleton = () => {
  const colors = useColors();
  return (
    <View style={{ gap: 12, padding: 16, backgroundColor: colors.surface.background, flex: 1 }}>
      <Skeleton height={220} borderRadius={16} />
      <Skeleton height={110} borderRadius={12} />
      <Skeleton height={200} borderRadius={12} />
      <Skeleton height={56} borderRadius={12} />
    </View>
  );
};