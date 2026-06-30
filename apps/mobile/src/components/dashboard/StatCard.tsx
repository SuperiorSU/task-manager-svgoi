import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
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

export const StatCard = React.memo(
  ({ value, label, icon, variant = 'default', subtitle, onPress }: Props) => {
    const colors = useColors();

    const variantStyles = {
      default: {
        cardBg: colors.surface.card,
        iconBg: colors.brand.primaryLight,
        iconColor: colors.brand.primary,
        valueColor: colors.text.primary,
      },
      alert: {
        cardBg: colors.semantic.errorBg,
        iconBg: colors.semantic.errorBg,
        iconColor: colors.semantic.error,
        valueColor: colors.semantic.error,
      },
      success: {
        cardBg: colors.semantic.successBg,
        iconBg: colors.semantic.successBg,
        iconColor: colors.semantic.success,
        valueColor: colors.semantic.success,
      },
    }[variant];

    return (
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: variantStyles.cardBg },
          pressed && onPress && styles.cardPressed,
        ]}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${label}: ${value}`}
      >
        <View style={[styles.iconCircle, { backgroundColor: variantStyles.iconBg }]}>
          <Feather name={icon} size={20} color={variantStyles.iconColor} />
        </View>
        <Text style={[styles.value, { color: variantStyles.valueColor }]}>{value}</Text>
        <Text style={[styles.label, { color: colors.text.secondary }]} numberOfLines={1}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.text.tertiary }]} numberOfLines={1}>{subtitle}</Text>
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
  },
  subtitle: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  cardPressed: {
    opacity: 0.82,
  },
});
