import React from 'react';
import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native';

import type { HistoryStatusChip } from '../../../data/adminWorkload.mock';
import { useColors } from '../../../constants/colors';

const CHIPS: { value: HistoryStatusChip; label: string; dot?: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'COMPLETED', label: 'Completed', dot: '#16A34A' },
  { value: 'OVERDUE', label: 'Overdue', dot: '#EF4444' },
  { value: 'ACTIVE', label: 'Active', dot: '#F59E0B' },
];

type Props = {
  active: HistoryStatusChip;
  counts: Record<HistoryStatusChip, number>;
  onChange: (value: HistoryStatusChip) => void;
};

// Status chip row (HTML screen 74) — All / Completed / Overdue / Active with
// live counts and a colour dot per non-"All" bucket.
export const HistoryStatusChips = ({ active, counts, onChange }: Props) => {
  const colors = useColors();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {CHIPS.map((chip) => {
        const isActive = active === chip.value;
        return (
          <Pressable
            key={chip.value}
            onPress={() => onChange(chip.value)}
            style={({ pressed }) => [
              styles.chip,
              { backgroundColor: colors.surface.card, borderColor: colors.surface.border },
              isActive && { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            {chip.dot && <View style={[styles.dot, { backgroundColor: chip.dot }]} />}
            <Text style={[styles.text, { color: isActive ? colors.text.inverse : colors.text.secondary }]}>
              {chip.label} {counts[chip.value]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 13,
    borderRadius: 15,
    borderWidth: 1,
  },
  pressed: { opacity: 0.8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontSize: 12, fontFamily: 'Inter-Medium' },
});
