import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';

// ─── Types ────────────────────────────────────────────────────────────────────
// Compact "dept + N deadlines" row for the month selected-day panel and the
// agenda list (FR-72 aggregate view). Tapping opens the day breakdown.

type Props = {
  color: string;
  name: string;
  count: number;
  onPress?: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const DeptDeadlineRow = React.memo(({ color, name, count, onPress }: Props) => {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface.card },
        pressed && onPress && { opacity: 0.85 },
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${name}, ${count} deadlines`}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.name, { color: colors.text.primary }]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={[styles.count, { color: colors.text.secondary }]}>
        {count} deadline{count === 1 ? '' : 's'}
      </Text>
      {onPress && <Feather name="chevron-right" size={17} color={colors.text.disabled} />}
    </Pressable>
  );
});

DeptDeadlineRow.displayName = 'DeptDeadlineRow';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  name: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'Inter-SemiBold',
  },
  count: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});
