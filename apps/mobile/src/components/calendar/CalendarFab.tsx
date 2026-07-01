import React from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

interface CalendarFabProps {
  onPress: () => void;
}

export const CalendarFab = ({ onPress }: CalendarFabProps) => {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: colors.brand.primary, bottom: insets.bottom + Spacing[6] },
        pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
      ]}
      accessibilityLabel="Add task"
    >
      <Feather name="plus" size={26} color="#FFFFFF" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Spacing[5],
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
});