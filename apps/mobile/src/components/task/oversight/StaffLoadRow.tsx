import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { riskAccentColor, type RiskLevel } from './RiskBadge';

export type StaffLoadRowData = {
  staffId: string;
  name: string;
  initials: string;
  avatarBg: string;
  riskLevel: RiskLevel;
  activeCount: number;
  overdueCount: number;
  capacityPercent: number;
};

type Props = {
  staff: StaffLoadRowData;
  onPress: (staffId: string) => void;
};

// "Load by staff" row inside the department drill-down (screen 59) — counts
// only per FR-72, never a task title.
export const StaffLoadRow = React.memo(({ staff, onPress }: Props) => {
  const colors = useColors();
  const accent = riskAccentColor(staff.riskLevel);
  const loadPercent = Math.min(100, staff.capacityPercent);

  return (
    <Pressable
      onPress={() => onPress(staff.staffId)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${staff.name}, ${staff.overdueCount} overdue, ${staff.activeCount} active`}
    >
      <View style={[styles.avatar, { backgroundColor: staff.avatarBg }]}>
        <Text style={styles.avatarText}>{staff.initials}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.topLine}>
          <Text style={[styles.name, { color: colors.text.secondary }]} numberOfLines={1}>
            {staff.name}
          </Text>
          <Text style={[styles.stats, { color: colors.text.secondary }]}>
            <Text style={{ color: accent, fontFamily: 'Inter-Bold' }}>{staff.overdueCount}</Text> overdue · {staff.activeCount} active
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: colors.surface.background }]}>
          <View style={[styles.fill, { width: `${loadPercent}%`, backgroundColor: accent }]} />
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={colors.surface.borderStrong} />
    </Pressable>
  );
});

StaffLoadRow.displayName = 'StaffLoadRow';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  pressed: { opacity: 0.8 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 10, fontFamily: 'Inter-Bold', color: '#FFFFFF' },
  info: { flex: 1, minWidth: 0 },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { ...Typography.labelLg, fontSize: 12.5, fontFamily: 'Inter-Regular' },
  stats: { fontSize: 11, fontFamily: 'Inter-Regular' },
  track: { height: 6, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
