/**
 * OrgUserManageRow — icon + label + chevron row for the "Manage" section
 * of the SA User detail screen (68: Change role · Reset password · Suspend).
 */

import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';

type Props = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  danger?: boolean;
  accent?: string;
};

export const OrgUserManageRow = React.memo(({ icon, label, onPress, danger, accent }: Props) => {
  const colors = useColors();
  const color = danger ? colors.semantic.error : accent ?? colors.text.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.surface.background }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Feather name={icon} size={18} color={color} />
      <Text style={[s.label, { color }]}>{label}</Text>
      <Feather name="chevron-right" size={17} color={colors.surface.borderStrong} />
    </Pressable>
  );
});

OrgUserManageRow.displayName = 'OrgUserManageRow';

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, paddingHorizontal: 16 },
  label: { flex: 1, fontSize: 14, fontFamily: 'Inter-Regular', letterSpacing: 0 },
});
