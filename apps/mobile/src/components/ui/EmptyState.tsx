import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Layout } from '../../constants/spacing';

interface EmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  message?: string;
  title?: string;
  subtitle?: string;
}

export const EmptyState = ({ icon, message, title, subtitle }: EmptyStateProps) => {
  const colors = useColors();
  return (
    <View
      style={[
        styles.emptyWrap,
        { backgroundColor: colors.surface.card, borderColor: colors.surface.border },
      ]}
    >
      <View style={[styles.emptyIconBg, { backgroundColor: colors.surface.background }]}>
        <Feather name={icon} size={28} color={colors.text.tertiary} />
      </View>
      {title ? (
        <>
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>{subtitle}</Text>
          ) : null}
        </>
      ) : message ? (
        <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>{message}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: Spacing[6],
    gap: Spacing[3],
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...Typography.h4,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    paddingHorizontal: Spacing[6],
  },
  emptyText: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingHorizontal: Spacing[6],
  },
});