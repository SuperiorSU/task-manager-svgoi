import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

type Props = {
  name: string;
  uri?: string | null;
  size?: number;
};

export const Avatar = React.memo(({ name, uri, size = 36 }: Props) => {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
});

Avatar.displayName = 'Avatar';

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: Colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
    color: Colors.brand.primary,
  },
});
