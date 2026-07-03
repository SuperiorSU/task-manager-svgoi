/**
 * TeamFilterBar — horizontal scrollable filter chips (screen 33).
 * Chips: All · Employees · Suspended
 */

import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';

import type { TeamFilter } from '../../utils/teamMemberView';
import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

// ─── Chip config ──────────────────────────────────────────────────────────────

type ChipDef = { id: TeamFilter; label: string };

const CHIPS: ChipDef[] = [
  { id: 'ALL',       label: 'All' },
  { id: 'EMPLOYEES', label: 'Employees' },
  { id: 'SUSPENDED', label: 'Suspended' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  active: TeamFilter;
  onChange: (filter: TeamFilter) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const TeamFilterBar = React.memo(({ active, onChange }: Props) => {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.container}
    >
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
                : {
                    backgroundColor: colors.surface.card,
                    borderWidth: 1,
                    borderColor: colors.surface.border,
                  },
              pressed && s.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={chip.label}
          >
            <Text
              style={[
                s.chipText,
                { color: isActive ? colors.text.inverse : colors.text.secondary },
              ]}
            >
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

TeamFilterBar.displayName = 'TeamFilterBar';

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing[4],
    paddingVertical: 14,
  },
  chip: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 16,
    flexShrink: 0,
  },
  chipText: {
    fontSize: 12.5,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  pressed: {
    opacity: 0.8,
  },
});
