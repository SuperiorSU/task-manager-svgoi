import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';

import type { TaskStatus } from '@godigitify/types';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

const FILTERS: { label: string; value: TaskStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Overdue', value: 'CANCELLED' },
];

type Props = {
  active: TaskStatus | 'ALL';
  onChange: (value: TaskStatus | 'ALL') => void;
};

export const TaskFilterBar = ({ active, onChange }: Props) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.container}
  >
    {FILTERS.map((f) => {
      const isActive = active === f.value;
      return (
        <Pressable
          key={f.value}
          onPress={() => onChange(f.value)}
          style={[styles.chip, isActive && styles.chipActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: isActive }}
        >
          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{f.label}</Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], gap: Spacing[2] },
  chip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  chipActive: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary },
  chipText: { ...Typography.labelMd, fontFamily: 'Inter-Medium', color: Colors.text.secondary },
  chipTextActive: { color: Colors.text.inverse },
});
