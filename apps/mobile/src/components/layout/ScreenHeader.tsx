import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/spacing';

type Props = {
  title: string;
  showBack?: boolean;
  rightAction?: { icon: keyof typeof Feather.glyphMap; onPress: () => void; label: string };
};

export const ScreenHeader = ({ title, showBack, rightAction }: Props) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const C = useColors();

  return (
    <View style={[
      styles.header,
      {
        paddingTop: insets.top + 4, // insets.top works on both iOS and Android
        backgroundColor: C.surface.card,
        borderBottomColor: C.surface.border,
      },
    ]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.iconBtn}
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={24} color={C.text.primary} />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}

        <Text style={[styles.title, { color: C.text.primary }]} numberOfLines={1}>
          {title}
        </Text>

        {rightAction ? (
          <Pressable
            onPress={rightAction.onPress}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.iconBtn}
            accessibilityLabel={rightAction.label}
          >
            <Feather name={rightAction.icon} size={22} color={C.brand.primary} />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  row: {
    height: Layout.headerHeight - 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...Typography.h4,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
