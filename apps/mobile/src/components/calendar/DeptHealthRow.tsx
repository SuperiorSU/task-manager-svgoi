import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useColors } from '../../constants/colors';

// ─── Types ────────────────────────────────────────────────────────────────────
// Richer, non-tappable row for the day-breakdown "By department" section —
// day-specific count on the right, org-level admin/status snapshot as the
// subtitle. Distinct from DeptDeadlineRow (single-line, tappable, agenda/month).

type Props = {
  color: string;
  name: string;
  subtitle: string;
  count: number;
  isLast?: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const DeptHealthRow = React.memo(({ color, name, subtitle, count, isLast }: Props) => {
  const colors = useColors();

  return (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.surface.background },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.textCol}>
        <Text style={[styles.name, { color: colors.text.primary }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.tertiary }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Text style={[styles.count, { color: colors.text.primary }]}>{count}</Text>
    </View>
  );
});

DeptHealthRow.displayName = 'DeptHealthRow';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 13.5,
    fontFamily: 'Inter-SemiBold',
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    marginTop: 1,
  },
  count: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
  },
});
