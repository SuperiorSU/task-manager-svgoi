import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';

import type { StatusFilter } from '../../hooks/useTasksMock';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

// Status color mapping for active chips
const STATUS_CHIP_COLOR: Record<string, { bg: string; text: string }> = {
  ALL:          { bg: Colors.brand.primary,        text: Colors.text.inverse },
  PENDING:      { bg: Colors.status.pending.solid,  text: Colors.text.inverse },
  ACCEPTED:     { bg: Colors.status.accepted.solid, text: Colors.text.inverse },
  IN_PROGRESS:  { bg: Colors.status.inProgress.solid, text: Colors.text.inverse },
  UNDER_REVIEW: { bg: Colors.status.underReview.solid, text: Colors.text.inverse },
  COMPLETED:    { bg: Colors.status.completed.solid, text: Colors.text.inverse },
  OVERDUE:      { bg: Colors.status.overdue.solid,  text: Colors.text.inverse },
};

const FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All',          value: 'ALL' },
  { label: 'Pending',      value: 'PENDING' },
  { label: 'In Progress',  value: 'IN_PROGRESS' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Completed',    value: 'COMPLETED' },
  { label: 'Overdue',      value: 'OVERDUE' },
];

type Props = {
  active: StatusFilter;
  onChange: (value: StatusFilter) => void;
};

export const TaskFilterBar = ({ active, onChange }: Props) => (
  <View style={styles.wrapper}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map((f) => {
        const isActive = active === f.value;
        const activeColors = STATUS_CHIP_COLOR[f.value] ?? STATUS_CHIP_COLOR['ALL']!;
        return (
          <Pressable
            key={f.value}
            onPress={() => onChange(f.value)}
            style={({ pressed }) => [
              styles.chip,
              isActive && { backgroundColor: activeColors.bg, borderColor: activeColors.bg },
              pressed && styles.chipPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            {f.value === 'OVERDUE' && (
              <View style={[styles.overdotWrap]}>
                <View style={[
                  styles.overdot,
                  { backgroundColor: isActive ? Colors.text.inverse : Colors.semantic.error }
                ]} />
              </View>
            )}
            <Text style={[
              styles.chipText,
              isActive && { color: activeColors.text },
            ]}>
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface.border,
  },
  container: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[2],
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.surface.background,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    gap: 5,
  },
  chipPressed: { opacity: 0.8 },
  chipText: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Medium',
    color: Colors.text.secondary,
  },
  overdotWrap: { alignItems: 'center', justifyContent: 'center' },
  overdot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
