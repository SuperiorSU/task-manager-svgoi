import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { ProgressRing } from '../ui/ProgressRing';

type Props = {
  percentage: number;
  completedCount: number;
  inFlightCount: number;
  subtitle: string;
};

export const OrgCompletionRing = React.memo(
  ({ percentage, completedCount, inFlightCount, subtitle }: Props) => {
    const colors = useColors();
    const clamped = Math.min(Math.max(percentage, 0), 100);

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface.card, borderColor: colors.surface.border },
        ]}
      >
        <ProgressRing
          percent={clamped}
          color={colors.brand.secondary}
          trackColor="#EEF2F7"
          holeColor={colors.surface.card}
        >
          <Text style={{ fontSize: 22, fontFamily: 'Inter-Bold', color: colors.text.primary, lineHeight: 26 }}>
            {clamped}%
          </Text>
          <Text style={{ fontSize: 10, fontFamily: 'Inter-Regular', color: colors.text.tertiary, marginTop: 2 }}>
            org-wide
          </Text>
        </ProgressRing>
        <View style={styles.right}>
          <Text style={[styles.title, { color: colors.text.primary }]}>Overall completion rate</Text>
          <Text style={[styles.subtitle, { color: colors.text.tertiary }]}>{subtitle}</Text>
          <View style={styles.legend}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: colors.brand.secondary }]} />
              <Text style={[styles.legendText, { color: colors.text.secondary }]}>Completed</Text>
              <Text style={[styles.legendValue, { color: colors.text.primary }]}>{completedCount}</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: colors.surface.border }]} />
              <Text style={[styles.legendText, { color: colors.text.secondary }]}>In flight</Text>
              <Text style={[styles.legendValue, { color: colors.text.primary }]}>{inFlightCount}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }
);

OrgCompletionRing.displayName = 'OrgCompletionRing';

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  right: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontSize: 14, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  subtitle: { fontSize: 11.5, fontFamily: 'Inter-Regular', letterSpacing: 0, marginTop: 2 },
  legend: { gap: 8, marginTop: 13 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 9, height: 9, borderRadius: 3 },
  legendText: { flex: 1, fontSize: 12, fontFamily: 'Inter-Regular', letterSpacing: 0 },
  legendValue: { fontSize: 12, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
});
