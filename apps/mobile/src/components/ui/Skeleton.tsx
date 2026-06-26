import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

import { Colors } from '../../constants/colors';

type Props = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: object;
};

export const Skeleton = ({ width = '100%', height = 16, borderRadius = 8, style }: Props) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
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
