import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Layout } from '../../constants/spacing';

type Props = {
  value: number;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  isAlert?: boolean;
};

export const StatCard = React.memo(({ value, label, icon, isAlert }: Props) => (
  <View style={[styles.card, isAlert && value > 0 && styles.alertCard]}>
    <View style={[styles.iconBg, isAlert && value > 0 && styles.alertIconBg]}>
      <Feather
        name={icon}
        size={20}
        color={isAlert && value > 0 ? Colors.semantic.error : Colors.brand.primary}
      />
    </View>
    <Text style={[styles.value, isAlert && value > 0 && styles.alertValue]}>
      {value}
    </Text>
    <Text style={styles.label}>{label}</Text>
  </View>
));

StatCard.displayName = 'StatCard';

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface.card,
    borderRadius: Layout.cardRadius,
    padding: Layout.cardPadding,
    gap: Spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    minHeight: 120,
  },
  alertCard: { backgroundColor: Colors.semantic.errorBg },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIconBg: { backgroundColor: '#FEE2E2' },
  value: { ...Typography.displaySm, fontFamily: 'Inter-Bold', color: Colors.text.primary },
  alertValue: { color: Colors.semantic.error },
  label: { ...Typography.labelMd, fontFamily: 'Inter-Regular', color: Colors.text.secondary },
});
