import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useColors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { riskAccentColor, type RiskLevel } from './RiskBadge';

type Props = {
  percent: number; // can exceed 100
  target: number;
  current: number;
  riskLevel: RiskLevel;
};

export const CapacityGauge = React.memo(({ percent, target, current, riskLevel }: Props) => {
  const colors = useColors();
  const fillPercent = Math.min(100, percent);
  const color = riskAccentColor(riskLevel);
  const targetMarkerPercent = current > 0 ? Math.min(96, (target / current) * 100) : 0;

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text.secondary }]}>Capacity</Text>
        <Text style={[styles.percent, { color }]}>{percent}% of target</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surface.background }]}>
        <View style={[styles.fill, { width: `${fillPercent}%`, backgroundColor: color }]} />
        {current > 0 && (
          <View style={[styles.marker, { left: `${targetMarkerPercent}%`, backgroundColor: colors.text.primary }]} />
        )}
      </View>
      <View style={styles.scaleRow}>
        <Text style={[styles.scaleText, { color: colors.text.tertiary }]}>0</Text>
        <Text style={[styles.scaleTarget, { color: colors.text.primary }]}>target {target}</Text>
        <Text style={[styles.scaleText, { color: colors.text.tertiary }]}>{current}</Text>
      </View>
    </View>
  );
});

CapacityGauge.displayName = 'CapacityGauge';

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { ...Typography.h4, fontSize: 13, fontFamily: 'Inter-SemiBold' },
  percent: { fontSize: 11.5, fontFamily: 'Inter-Bold' },
  track: { height: 10, borderRadius: 6, overflow: 'hidden', position: 'relative' },
  fill: { height: '100%', borderRadius: 6 },
  marker: { position: 'absolute', top: -3, width: 2, height: 16, borderRadius: 1 },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  scaleText: { fontSize: 10.5, fontFamily: 'Inter-Regular' },
  scaleTarget: { fontSize: 10, fontFamily: 'Inter-SemiBold' },
});
