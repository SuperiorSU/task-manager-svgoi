import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../../constants/colors';
import { Spacing, Layout } from '../../../constants/spacing';

type Trend = { label: string; direction: 'up' | 'down'; tone: 'positive' | 'negative' };

type Props = {
  value: string;
  label: string;
  valueColor?: string | undefined;
  trend?: Trend | undefined;
};

// Overview KPI grid card (screen 57) — like OrgStatCard but supports an
// inline trend/percent badge next to the value ("37  8.6%", "184  ↑12%"),
// which OrgStatCard's fixed layout doesn't have. Kept as its own component
// rather than extending the Dashboard's card (off-limits per module scope).
export const TaskKpiCard = React.memo(({ value, label, valueColor, trend }: Props) => {
  const colors = useColors();
  const trendColor = trend?.tone === 'positive' ? colors.semantic.success : colors.semantic.error;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface.card }]}>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: valueColor ?? colors.text.primary }]}>{value}</Text>
        {trend && (
          <View
            style={
              trend.direction === 'down'
                ? [styles.trendChip, { backgroundColor: `${trendColor}1A` }]
                : styles.trendInline
            }
          >
            {trend.direction === 'up' && (
              <Feather name="arrow-up" size={10} color={trendColor} style={styles.trendIcon} />
            )}
            <Text style={[styles.trendText, { color: trendColor }]}>{trend.label}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.label, { color: colors.text.secondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
});

TaskKpiCard.displayName = 'TaskKpiCard';

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 13,
    padding: Spacing[4] - 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 1,
  },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  value: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 11.5,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  trendChip: {
    borderRadius: Layout.badgeRadius - 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  trendInline: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  trendIcon: { marginTop: 1 },
  trendText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
});
