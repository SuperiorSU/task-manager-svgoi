import React from 'react';
import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native';

import type { SuperAdminCalendarDept } from '../../data/superAdminCalendar.mock';
import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  departments: SuperAdminCalendarDept[];
  /** undefined = all departments */
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────
// Navy-accented (brand.secondary), distinct from PersonFilterBar's blue —
// departments are org units under SA oversight, not team members.

export const DeptFilterChips = React.memo(({ departments, selectedId, onSelect }: Props) => {
  const colors = useColors();
  const isAllActive = !selectedId;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
    >
      <Pressable
        onPress={() => onSelect(undefined)}
        style={({ pressed }) => [
          styles.chip,
          {
            backgroundColor: isAllActive ? colors.brand.secondary : colors.surface.card,
            borderColor: isAllActive ? colors.brand.secondary : colors.surface.border,
          },
          pressed && { opacity: 0.8 },
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: isAllActive }}
        accessibilityLabel="All departments"
      >
        <Text
          style={[
            styles.chipLabel,
            { color: isAllActive ? '#FFFFFF' : colors.text.secondary, fontFamily: 'Inter-SemiBold' },
          ]}
        >
          All depts
        </Text>
      </Pressable>

      {departments.map((dept) => {
        const active = selectedId === dept.id;
        return (
          <Pressable
            key={dept.id}
            onPress={() => onSelect(active ? undefined : dept.id)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: active ? colors.brand.secondary : colors.surface.card,
                borderColor: active ? colors.brand.secondary : colors.surface.border,
              },
              pressed && { opacity: 0.8 },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={dept.name}
          >
            {!active && <View style={[styles.dot, { backgroundColor: dept.color }]} />}
            <Text
              style={[
                styles.chipLabel,
                {
                  color: active ? '#FFFFFF' : colors.text.secondary,
                  fontFamily: active ? 'Inter-SemiBold' : 'Inter-Medium',
                },
              ]}
            >
              {dept.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

DeptFilterChips.displayName = 'DeptFilterChips';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing[5],
    paddingTop: 13,
    paddingBottom: 14,
  },
  chip: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    borderRadius: 15,
    borderWidth: 1,
    flexShrink: 0,
  },
  chipLabel: {
    fontSize: 12,
    letterSpacing: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
