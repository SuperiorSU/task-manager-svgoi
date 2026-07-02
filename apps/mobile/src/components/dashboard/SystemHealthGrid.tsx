import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

type Item = {
  value: number;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
};

type Props = {
  activeUsers: number;
  admins: number;
  departments: number;
};

export const SystemHealthGrid = React.memo(({ activeUsers, admins, departments }: Props) => {
  const colors = useColors();

  const items: Item[] = [
    { value: activeUsers, label: 'Active users', icon: 'users', color: colors.semantic.success },
    { value: admins, label: 'Admins', icon: 'shield', color: colors.brand.primary },
    { value: departments, label: 'Departments', icon: 'briefcase', color: '#4F46E5' },
  ];

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View
          key={item.label}
          style={[styles.cell, { backgroundColor: colors.surface.card, borderColor: colors.surface.border }]}
        >
          <Feather name={item.icon} size={20} color={item.color} style={styles.icon} />
          <Text style={[styles.value, { color: colors.text.primary }]}>{item.value}</Text>
          <Text style={[styles.label, { color: colors.text.tertiary }]} numberOfLines={1}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
});

SystemHealthGrid.displayName = 'SystemHealthGrid';

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 11 },
  cell: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 13,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  icon: { marginBottom: 8 },
  value: { fontSize: 20, lineHeight: 24, fontFamily: 'Inter-Bold', letterSpacing: 0 },
  label: { fontSize: 10.5, fontFamily: 'Inter-Regular', letterSpacing: 0, marginTop: 4 },
});
