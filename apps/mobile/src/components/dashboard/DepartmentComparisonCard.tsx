import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import type { DepartmentComparisonEntry } from '../../data/superAdminDashboard.mock';

type Props = {
  entries: DepartmentComparisonEntry[];
  onReportPress?: () => void;
};

const rateColor = (rate: number, colors: ReturnType<typeof useColors>) => {
  if (rate >= 75) return colors.semantic.success;
  if (rate >= 50) return colors.semantic.warning;
  return colors.semantic.error;
};

const rateTextColor = (rate: number, colors: ReturnType<typeof useColors>) => {
  if (rate >= 75) return colors.status.completed.text;
  if (rate >= 50) return colors.status.inProgress.text;
  return colors.status.overdue.text;
};

export const DepartmentComparisonCard = React.memo(({ entries, onReportPress }: Props) => {
  const colors = useColors();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Department comparison</Text>
        {onReportPress ? (
          <Pressable onPress={onReportPress} hitSlop={8}>
            <Text style={[styles.link, { color: colors.brand.primary }]}>Report</Text>
          </Pressable>
        ) : (
          <Text style={[styles.link, { color: colors.text.tertiary }]}>Report</Text>
        )}
      </View>
      <View
        style={[styles.card, { backgroundColor: colors.surface.card, borderColor: colors.surface.border }]}
      >
        {entries.map((entry) => (
          <View key={entry.departmentId} style={styles.row}>
            <View style={styles.rowTop}>
              <Text style={[styles.deptName, { color: colors.text.primary }]} numberOfLines={1}>
                {entry.departmentName}
              </Text>
              <Text style={[styles.rate, { color: rateTextColor(entry.completionRate, colors) }]}>
                {entry.completionRate}%
              </Text>
            </View>
            <View style={[styles.track, { backgroundColor: colors.surface.background }]}>
              <View
                style={[
                  styles.fill,
                  { width: `${entry.completionRate}%`, backgroundColor: rateColor(entry.completionRate, colors) },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
});

DepartmentComparisonCard.displayName = 'DepartmentComparisonCard';

const styles = StyleSheet.create({
  section: { gap: Spacing[3] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 15, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  link: { fontSize: 12, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing[4],
    gap: Spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  row: { gap: 5 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deptName: { flex: 1, fontSize: 12.5, fontFamily: 'Inter-Medium', letterSpacing: 0 },
  rate: { fontSize: 11.5, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  track: { height: 8, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
});
