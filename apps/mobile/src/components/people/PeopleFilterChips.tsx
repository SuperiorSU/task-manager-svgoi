/**
 * PeopleFilterChips — Users-view filter chips (All · Admins · Employees ·
 * Suspended), screen 55. Distinct from team/TeamFilterBar (Admin's own-dept
 * Team module) so this module never depends on Admin's component/types.
 */

import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';

import type { OrgUserFilter } from '../../services/orgDirectory.service';
import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

type ChipDef = { id: OrgUserFilter; label: string };

const CHIPS: ChipDef[] = [
  { id: 'ALL', label: 'All' },
  { id: 'ADMINS', label: 'Admins' },
  { id: 'EMPLOYEES', label: 'Employees' },
  { id: 'SUSPENDED', label: 'Suspended' },
];

type Props = {
  active: OrgUserFilter;
  onChange: (filter: OrgUserFilter) => void;
};

export const PeopleFilterChips = React.memo(({ active, onChange }: Props) => {
  const colors = useColors();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.container}>
      {CHIPS.map((chip) => {
        const isActive = chip.id === active;
        return (
          <Pressable
            key={chip.id}
            onPress={() => onChange(chip.id)}
            style={({ pressed }) => [
              s.chip,
              isActive
                ? { backgroundColor: colors.brand.primary }
                : { backgroundColor: colors.surface.background },
              pressed && s.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={chip.label}
          >
            <Text style={[s.chipText, { color: isActive ? colors.text.inverse : colors.text.secondary }]}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

PeopleFilterChips.displayName = 'PeopleFilterChips';

const s = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing[4] },
  chip: { height: 32, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 18, flexShrink: 0 },
  chipText: { fontSize: 12.5, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  pressed: { opacity: 0.8 },
});
