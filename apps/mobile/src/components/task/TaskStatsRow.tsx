import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Layout } from '../../constants/spacing';
import { Skeleton } from '../ui/Skeleton';

type StatItem = {
  label: string;
  value: number;
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  iconBg: string;
  valueColor?: string;
  cardBg?: string;
};

type Props = {
  total: number;
  pending: number;
  completed: number;
  inProgress: number;
  overdue: number;
  isLoading?: boolean;
};

export const TaskStatsRow = React.memo(({ total, pending, completed, inProgress, overdue, isLoading }: Props) => {
  const stats: StatItem[] = [
    {
      label: 'My Tasks',
      value: total,
      icon: 'list',
      iconColor: Colors.brand.primary,
      iconBg: Colors.brand.primaryLight,
    },
    {
      label: 'Pending',
      value: pending,
      icon: 'clock',
      iconColor: Colors.status.pending.text,
      iconBg: Colors.status.pending.bg,
    },
    {
      label: 'Completed',
      value: completed,
      icon: 'check-circle',
      iconColor: Colors.semantic.success,
      iconBg: Colors.semantic.successBg,
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: 'zap',
      iconColor: Colors.status.inProgress.text,
      iconBg: Colors.status.inProgress.bg,
    },
  ];

  if (isLoading) {
    return (
      <View style={styles.skeletonRow}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={88} borderRadius={Layout.cardRadius} style={styles.skeletonCard} />
        ))}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {stats.map((stat) => (
        <View key={stat.label} style={[styles.card, stat.cardBg ? { backgroundColor: stat.cardBg } : null]}>
          <View style={[styles.iconCircle, { backgroundColor: stat.iconBg }]}>
            <Feather name={stat.icon} size={18} color={stat.iconColor} />
          </View>
          <Text style={[styles.value, stat.valueColor ? { color: stat.valueColor } : null]}>
            {stat.value}
          </Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
      {overdue > 0 && (
        <View style={[styles.card, { backgroundColor: Colors.semantic.errorBg }]}>
          <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
            <Feather name="alert-circle" size={18} color={Colors.semantic.error} />
          </View>
          <Text style={[styles.value, { color: Colors.semantic.error }]}>{overdue}</Text>
          <Text style={styles.label}>Overdue</Text>
        </View>
      )}
    </ScrollView>
  );
});

TaskStatsRow.displayName = 'TaskStatsRow';

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[3],
    paddingVertical: Spacing[1],
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  skeletonCard: { width: 100 },
  card: {
    width: 100,
    backgroundColor: Colors.surface.card,
    borderRadius: Layout.cardRadius,
    padding: Spacing[3],
    gap: Spacing[1],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  value: {
    ...Typography.h2,
    fontFamily: 'Inter-Bold',
    color: Colors.text.primary,
  },
  label: {
    ...Typography.labelSm,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
  },
});
