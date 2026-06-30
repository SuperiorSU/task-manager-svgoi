import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';

import type { StatusFilter } from '../../hooks/useTasksMock';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

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

export const TaskFilterBar = ({ active, onChange }: Props) => {
  const colors = useColors();

  const STATUS_CHIP_COLOR: Record<string, { bg: string; text: string }> = {
    ALL:          { bg: colors.brand.primary,           text: colors.text.inverse },
    PENDING:      { bg: colors.status.pending.solid,    text: colors.text.inverse },
    ACCEPTED:     { bg: colors.status.accepted.solid,   text: colors.text.inverse },
    IN_PROGRESS:  { bg: colors.status.inProgress.solid, text: colors.text.inverse },
    UNDER_REVIEW: { bg: colors.status.underReview.solid, text: colors.text.inverse },
    COMPLETED:    { bg: colors.status.completed.solid,  text: colors.text.inverse },
    OVERDUE:      { bg: colors.status.overdue.solid,    text: colors.text.inverse },
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
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
                { backgroundColor: colors.surface.background, borderColor: colors.surface.border },
                isActive && { backgroundColor: activeColors.bg, borderColor: activeColors.bg },
                pressed && styles.chipPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              {f.value === 'OVERDUE' && (
                <View style={styles.overdotWrap}>
                  <View style={[
                    styles.overdot,
                    { backgroundColor: isActive ? colors.text.inverse : colors.semantic.error }
                  ]} />
                </View>
              )}
              <Text style={[
                styles.chipText,
                { color: colors.text.secondary },
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
};

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
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
    borderWidth: 1,
    gap: 5,
  },
  chipPressed: { opacity: 0.8 },
  chipText: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Medium',
  },
  overdotWrap: { alignItems: 'center', justifyContent: 'center' },
  overdot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
