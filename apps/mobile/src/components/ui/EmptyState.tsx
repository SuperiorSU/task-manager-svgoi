import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

type Props = {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
};

export const EmptyState = ({ icon = 'inbox', title, subtitle }: Props) => (
  <View style={styles.container}>
    <View style={styles.iconBg}>
      <Feather name={icon} size={32} color={Colors.brand.primary} />
    </View>
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[12],
    gap: Spacing[3],
  },
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  title: { ...Typography.h4, fontFamily: 'Inter-SemiBold', color: Colors.text.primary, textAlign: 'center' },
  subtitle: { ...Typography.bodyMd, fontFamily: 'Inter-Regular', color: Colors.text.secondary, textAlign: 'center' },
});
