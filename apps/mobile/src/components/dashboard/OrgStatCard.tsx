import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { Spacing, Layout } from '../../constants/spacing';

type Props = {
  value: number;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  iconBg: string;
  iconColor: string;
  cardBg?: string | undefined;
  cardBorder?: string | undefined;
  valueColor?: string | undefined;
  onPress?: (() => void) | undefined;
};

// Org-level stat card for the Super Admin Dashboard 2×2 grid — each card
// carries its own icon tint (unlike the generic StatCard's fixed
// default/alert/success variants) to match the distinct blue/indigo/green/red
// treatment per metric in the HTML reference (screen 48).
export const OrgStatCard = React.memo(
  ({ value, label, icon, iconBg, iconColor, cardBg, cardBorder, valueColor, onPress }: Props) => {
    const colors = useColors();

    return (
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: cardBg ?? colors.surface.card, borderColor: cardBorder ?? colors.surface.border },
          pressed && onPress && styles.pressed,
        ]}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${label}: ${value}`}
      >
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <Feather name={icon} size={19} color={iconColor} />
        </View>
        <Text style={[styles.value, { color: valueColor ?? colors.text.primary }]}>{value}</Text>
        <Text style={[styles.label, { color: colors.text.secondary }]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    );
  }
);

OrgStatCard.displayName = 'OrgStatCard';

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing[4],
    gap: Spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  pressed: { opacity: 0.82 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Layout.badgeRadius + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 25,
    lineHeight: 30,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },
});
