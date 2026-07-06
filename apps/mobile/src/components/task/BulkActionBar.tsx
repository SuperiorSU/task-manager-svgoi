import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

type Props = {
  count: number;
  loading: boolean;
  onCancelTasks: () => void;
  onDismiss: () => void;
};

/** Replaces the FAB while a task list is in multi-select mode (Admin bulk cancel). */
export const BulkActionBar = ({ count, loading, onCancelTasks, onDismiss }: Props) => {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        s.bar,
        { backgroundColor: colors.surface.card, borderTopColor: colors.surface.border, paddingBottom: insets.bottom + Spacing[2] },
      ]}
    >
      <Pressable onPress={onDismiss} hitSlop={8} style={s.dismissBtn} accessibilityLabel="Exit selection" accessibilityRole="button">
        <Feather name="x" size={20} color={colors.text.secondary} />
      </Pressable>

      <Text style={[s.countText, { color: colors.text.primary }]}>
        {count} selected
      </Text>

      <Pressable
        onPress={onCancelTasks}
        disabled={loading}
        style={[s.cancelBtn, { backgroundColor: colors.semantic.errorBg }, loading && { opacity: 0.6 }]}
        accessibilityRole="button"
        accessibilityLabel="Cancel selected tasks"
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.semantic.error} />
        ) : (
          <>
            <Feather name="x-circle" size={16} color={colors.semantic.error} />
            <Text style={[s.cancelBtnText, { color: colors.semantic.error }]}>Cancel Tasks</Text>
          </>
        )}
      </Pressable>
    </View>
  );
};

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  dismissBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  countText: { flex: 1, fontSize: 14, fontFamily: 'Inter-SemiBold' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 10,
  },
  cancelBtnText: { fontSize: 13.5, fontFamily: 'Inter-SemiBold' },
});
