import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import type { RiskLevel } from '../../../data/superAdminTasks.mock';
import { Typography } from '../../../constants/typography';

export type { RiskLevel };

const RISK_META: Record<RiskLevel, { label: string; bg: string; color: string }> = {
  CRITICAL: { label: 'CRITICAL', bg: '#FEF2F2', color: '#B91C1C' },
  AT_RISK: { label: 'AT RISK', bg: '#FFFBEB', color: '#B45309' },
  HEALTHY: { label: 'HEALTHY', bg: '#F0FDF4', color: '#15803D' },
};

type Props = {
  level: RiskLevel;
  /** Override the default label (e.g. "OVERDUE · 2 DAYS" for a single task). */
  label?: string | undefined;
};

export const RiskBadge = React.memo(({ level, label }: Props) => {
  const meta = RISK_META[level];
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.text, { color: meta.color }]}>{label ?? meta.label}</Text>
    </View>
  );
});

RiskBadge.displayName = 'RiskBadge';

export const riskAccentColor = (level: RiskLevel): string =>
  level === 'CRITICAL' ? '#EF4444' : level === 'AT_RISK' ? '#F59E0B' : '#10B981';

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.labelSm,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },
});
