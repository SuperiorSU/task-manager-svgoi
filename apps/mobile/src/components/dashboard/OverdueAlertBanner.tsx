import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Layout } from '../../constants/spacing';

type Props = {
  count: number;
  onPress: () => void;
};

export const OverdueAlertBanner = React.memo(({ count, onPress }: Props) => {
  const colors = useColors();

  if (count <= 0) return null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.banner,
        { backgroundColor: colors.status.overdue.bg, borderColor: colors.status.overdue.solid },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${count} overdue task${count > 1 ? 's' : ''}. Tap to view.`}
    >
      <View style={styles.iconWrap}>
        <Feather name="alert-triangle" size={18} color={colors.status.overdue.text} />
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.status.overdue.text }]}>
          {count} Overdue Task{count > 1 ? 's' : ''}
        </Text>
        <Text style={[styles.subtitle, { color: colors.status.overdue.text }]}>
          These require your immediate attention
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.status.overdue.text} />
    </Pressable>
  );
});

OverdueAlertBanner.displayName = 'OverdueAlertBanner';

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  pressed: { opacity: 0.85 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  title: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-SemiBold',
  },
  subtitle: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    opacity: 0.85,
    marginTop: 2,
  },
});
