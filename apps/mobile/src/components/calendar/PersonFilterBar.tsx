import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { AdminCalendarAssignee } from '../../data/adminCalendar.mock';
import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  members: AdminCalendarAssignee[];
  /** undefined = whole team view */
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const PersonFilterBar = React.memo(({ members, selectedId, onSelect }: Props) => {
  const colors = useColors();
  const isAllActive = !selectedId;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
    >
      {/* Whole team chip */}
      <Pressable
        onPress={() => onSelect(undefined)}
        style={({ pressed }) => [
          styles.chip,
          {
            backgroundColor: isAllActive ? colors.brand.primary : colors.surface.card,
            borderColor: isAllActive ? colors.brand.primary : colors.surface.border,
          },
          pressed && { opacity: 0.8 },
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: isAllActive }}
        accessibilityLabel="Whole team"
      >
        <Feather
          name="users"
          size={13}
          color={isAllActive ? '#FFFFFF' : colors.text.secondary}
        />
        <Text
          style={[
            styles.chipLabel,
            {
              color: isAllActive ? '#FFFFFF' : colors.text.secondary,
              fontFamily: 'Inter-SemiBold',
            },
          ]}
        >
          Whole team
        </Text>
      </Pressable>

      {/* Per-member chips */}
      {members.map((m) => {
        const active = selectedId === m.id;
        return (
          <Pressable
            key={m.id}
            onPress={() => onSelect(active ? undefined : m.id)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: active ? colors.brand.primary : colors.surface.card,
                borderColor: active ? colors.brand.primary : colors.surface.border,
              },
              pressed && { opacity: 0.8 },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={m.name}
          >
            <Text
              style={[
                styles.chipLabel,
                {
                  color: active ? '#FFFFFF' : colors.text.secondary,
                  fontFamily: active ? 'Inter-SemiBold' : 'Inter-Medium',
                },
              ]}
            >
              {m.name.split(' ')[0] ?? m.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

PersonFilterBar.displayName = 'PersonFilterBar';

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
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    borderRadius: 16,
    borderWidth: 1,
    flexShrink: 0,
  },
  chipLabel: {
    fontSize: 12.5,
    letterSpacing: 0,
  },
});
