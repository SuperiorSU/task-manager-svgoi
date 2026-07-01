/**
 * ReviewInfoGrid — 2-column "Due / Submitted / Assigned by / Assignee" grid
 * shown on the Review Task screen, matching the HTML reference layout.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Avatar } from '../ui/Avatar';
import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Layout } from '../../constants/spacing';

type Cell =
  | { kind: 'text'; label: string; value: string; icon?: keyof typeof Feather.glyphMap; valueColor?: string }
  | { kind: 'user'; label: string; name: string };

type Props = { cells: Cell[] };

export const ReviewInfoGrid = React.memo(({ cells }: Props) => {
  const colors = useColors();

  return (
    <View style={[styles.grid, { backgroundColor: colors.surface.card }]}>
      {cells.map((cell) => (
        <View key={cell.label} style={styles.cell}>
          <Text style={[styles.label, { color: colors.text.tertiary }]}>{cell.label.toUpperCase()}</Text>
          {cell.kind === 'text' ? (
            <View style={styles.row}>
              {cell.icon && <Feather name={cell.icon} size={14} color={colors.text.secondary} />}
              <Text style={[styles.value, { color: cell.valueColor ?? colors.text.secondary }]}>
                {cell.value}
              </Text>
            </View>
          ) : (
            <View style={styles.row}>
              <Avatar name={cell.name} size={22} />
              <Text style={[styles.value, { color: colors.text.primary }]}>{cell.name}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
});

ReviewInfoGrid.displayName = 'ReviewInfoGrid';

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
    rowGap: Spacing[4],
  },
  cell: { width: '50%', gap: 6 },
  label: {
    ...Typography.labelSm,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-SemiBold',
  },
});
