import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

type Props = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export const DashboardSectionHeader = React.memo(
  ({ title, actionLabel, onActionPress }: Props) => {
    const colors = useColors();

    return (
      <View style={styles.row}>
        <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
        {actionLabel && onActionPress ? (
          <Pressable
            onPress={onActionPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.action}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text style={[styles.actionText, { color: colors.brand.primary }]}>{actionLabel}</Text>
            <Feather name="chevron-right" size={14} color={colors.brand.primary} />
          </Pressable>
        ) : null}
      </View>
    );
  }
);

DashboardSectionHeader.displayName = 'DashboardSectionHeader';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...Typography.h4,
    fontFamily: 'Inter-SemiBold',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Medium',
  },
});
