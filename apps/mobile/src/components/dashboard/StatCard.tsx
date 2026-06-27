import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Layout } from '../../constants/spacing';

type Variant = 'default' | 'alert' | 'success';

type Props = {
  value: number;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  variant?: Variant;
  subtitle?: string;
  onPress?: () => void;
};

const VARIANT_STYLES: Record<
  Variant,
  { card: object; iconBg: object; iconColor: string; valueColor: string }
> = {
  default: {
    card: { backgroundColor: Colors.surface.card },
    iconBg: { backgroundColor: Colors.brand.primaryLight },
    iconColor: Colors.brand.primary,
    valueColor: Colors.text.primary,
  },
  alert: {
    card: { backgroundColor: Colors.semantic.errorBg },
    iconBg: { backgroundColor: '#FEE2E2' },
    iconColor: Colors.semantic.error,
    valueColor: Colors.semantic.error,
  },
  success: {
    card: { backgroundColor: Colors.semantic.successBg },
    iconBg: { backgroundColor: '#DCFCE7' },
    iconColor: Colors.semantic.success,
    valueColor: Colors.semantic.success,
  },
};

export const StatCard = React.memo(
  ({ value, label, icon, variant = 'default', subtitle, onPress }: Props) => {
    const v = VARIANT_STYLES[variant];

    return (
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.card, v.card, pressed && onPress && styles.cardPressed]}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${label}: ${value}`}
      >
        <View style={[styles.iconCircle, v.iconBg]}>
          <Feather name={icon} size={20} color={v.iconColor} />
        </View>
        <Text style={[styles.value, { color: v.valueColor }]}>{value}</Text>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </Pressable>
    );
  }
);

StatCard.displayName = 'StatCard';

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Layout.cardRadius,
    padding: Layout.cardPadding,
    minHeight: 130,
    gap: Spacing[1],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[1],
  },
  value: {
    ...Typography.displaySm,
    fontFamily: 'Inter-Bold',
  },
  label: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
  },
  subtitle: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  cardPressed: {
    opacity: 0.82,
  },
});
