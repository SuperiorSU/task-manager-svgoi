import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

import { Colors } from '../../constants/colors';

type Props = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: object;
};

export const Skeleton = ({ width = '100%', height = 16, borderRadius = 8, style }: Props) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.4, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(opacity.value, [0.4, 1], [0.4, 1]),
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const TaskCardSkeleton = () => (
  <View style={styles.card}>
    <Skeleton height={14} width="60%" />
    <Skeleton height={12} width="40%" />
    <Skeleton height={12} width="80%" />
  </View>
);

const styles = StyleSheet.create({
  skeleton: { backgroundColor: Colors.surface.border },
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
});
