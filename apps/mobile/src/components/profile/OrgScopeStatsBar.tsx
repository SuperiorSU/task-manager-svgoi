import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useColors } from '../../constants/colors';

type Props = {
  departments: number;
  admins: number;
  users: number;
};

const StatCell = React.memo(({ value, label }: { value: number; label: string }) => {
  const colors = useColors();
  return (
    <View style={[s.cell, { backgroundColor: colors.surface.card }]}>
      <Text style={[s.value, { color: colors.text.primary }]}>{value}</Text>
      <Text style={[s.label, { color: colors.text.tertiary }]}>{label}</Text>
    </View>
  );
});

StatCell.displayName = 'StatCell';

// Screen 71's mini stats strip — org-wide headcounts, not personal task
// stats (Super Admin has no personal task load, unlike ProfileStatsBar's
// onTimeRate/completed/active which only make sense for Admin/Employee).
// Sourced from useSystemHealth() — the same numbers already shown on the SA
// Dashboard, never a second parallel count.
export const OrgScopeStatsBar = React.memo(({ departments, admins, users }: Props) => {
  const colors = useColors();
  return (
    <View style={[s.row, { backgroundColor: colors.surface.border }]}>
      <StatCell value={departments} label="Departments" />
      <StatCell value={admins} label="Admins" />
      <StatCell value={users} label="Users" />
    </View>
  );
});

OrgScopeStatsBar.displayName = 'OrgScopeStatsBar';

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 1,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  value: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 24,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
});
