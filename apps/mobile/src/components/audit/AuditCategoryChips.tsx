import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';

import type { AuditCategory } from '../../data/audit.mock';
import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

type Props = {
  options: { value: AuditCategory | 'ALL'; label: string }[];
  active: AuditCategory | 'ALL';
  onChange: (value: AuditCategory | 'ALL') => void;
};

// Single-accent-color quick filter row — distinct from TaskFilterBar, which
// colors each chip per-status. Audit categories share one accent (matches
// HTML screens 50 + 52, where every active chip is brand blue regardless of
// category).
export const AuditCategoryChips = React.memo(({ options, active, onChange }: Props) => {
  const colors = useColors();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((opt) => {
        const isActive = active === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.chip,
              { backgroundColor: colors.surface.background },
              isActive && { backgroundColor: colors.brand.primary },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.text, { color: colors.text.secondary }, isActive && { color: colors.text.inverse }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

AuditCategoryChips.displayName = 'AuditCategoryChips';

const styles = StyleSheet.create({
  row: { gap: Spacing[2], alignItems: 'center' },
  chip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
  text: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
  },
});
