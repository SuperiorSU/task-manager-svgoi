import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { DeptTaskHealth } from '../../../data/superAdminTasks.mock';
import { useColors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing } from '../../../constants/spacing';
import { riskAccentColor } from './RiskBadge';
import { StatusDistributionBar } from './StatusDistributionBar';

const DEPT_ICON: Record<string, keyof typeof Feather.glyphMap> = {
  dept_01: 'compass',
  dept_02: 'monitor',
  dept_03: 'briefcase',
  dept_04: 'book-open',
  dept_05: 'cpu',
};

const RISK_TONE: Record<DeptTaskHealth['riskLevel'], { bg: string; text: string; iconBg: string }> = {
  CRITICAL: { bg: '#FEF2F2', text: '#B91C1C', iconBg: '#FEF2F2' },
  AT_RISK: { bg: '#FFFBEB', text: '#B45309', iconBg: '#FFFBEB' },
  HEALTHY: { bg: '#F0FDF4', text: '#15803D', iconBg: '#F0FDF4' },
};

type Props = {
  dept: DeptTaskHealth;
  onPress: (deptId: string) => void;
};

export const DepartmentHealthCard = React.memo(({ dept, onPress }: Props) => {
  const colors = useColors();
  const tone = RISK_TONE[dept.riskLevel];
  const accent = riskAccentColor(dept.riskLevel);

  return (
    <Pressable
      onPress={() => onPress(dept.departmentId)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface.card, borderLeftColor: accent },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${dept.departmentName}, ${dept.onTimeRate}% on time`}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: tone.iconBg }]}>
          <Feather name={DEPT_ICON[dept.departmentId] ?? 'grid'} size={18} color={tone.text} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text.primary }]} numberOfLines={1}>
            {dept.departmentName}
          </Text>
          <Text style={[styles.meta, { color: colors.text.tertiary }]} numberOfLines={1}>
            {dept.adminName} · {dept.staffCount} staff
          </Text>
        </View>
        <View style={styles.rateBlock}>
          <Text style={[styles.rate, { color: tone.text }]}>{dept.onTimeRate}%</Text>
          <Text style={[styles.rateLabel, { color: colors.text.tertiary }]}>on-time</Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.barFlex}>
          <StatusDistributionBar distribution={dept.statusDistribution} total={dept.activeCount} size="sm" showLegend={false} />
        </View>
        <Text style={[styles.activeText, { color: colors.text.secondary }]}>
          <Text style={[styles.activeCount, { color: colors.text.primary }]}>{dept.activeCount}</Text> active
        </Text>
        <View style={[styles.overdueChip, { backgroundColor: tone.bg }]}>
          <Text style={[styles.overdueText, { color: tone.text }]}>{dept.overdueCount} overdue</Text>
        </View>
      </View>
    </Pressable>
  );
});

DepartmentHealthCard.displayName = 'DepartmentHealthCard';

const styles = StyleSheet.create({
  card: {
    borderRadius: 13,
    borderLeftWidth: 3,
    padding: Spacing[3] + 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 1,
  },
  pressed: { opacity: 0.85 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  name: {
    ...Typography.h4,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  meta: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Regular',
    marginTop: 1,
  },
  rateBlock: { alignItems: 'flex-end' },
  rate: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  rateLabel: { fontSize: 10, fontFamily: 'Inter-Regular' },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 11,
  },
  barFlex: { flex: 1 },
  activeText: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Regular',
  },
  activeCount: { fontFamily: 'Inter-Bold' },
  overdueChip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  overdueText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
  },
});
