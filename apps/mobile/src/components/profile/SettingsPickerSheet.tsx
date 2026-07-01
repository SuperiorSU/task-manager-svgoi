import React from 'react';
import { Modal, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

export type PickerOption<T extends string | number> = {
  value: T;
  label: string;
  color?: string | undefined;
};

type Props<T extends string | number> = {
  visible: boolean;
  title: string;
  options: PickerOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
};

export function SettingsPickerSheet<T extends string | number>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: Props<T>) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[s.backdrop, { backgroundColor: colors.surface.overlay }]} onPress={onClose}>
        <Pressable
          style={[s.sheet, { backgroundColor: colors.surface.card, paddingBottom: insets.bottom + Spacing[4] }]}
        >
          <View style={[s.handle, { backgroundColor: colors.surface.borderStrong }]} />
          <View style={[s.header, { borderBottomColor: colors.surface.border }]}>
            <Text style={[s.title, { color: colors.text.primary }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={22} color={colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {options.map((opt) => {
              const active = opt.value === selected;
              return (
                <Pressable
                  key={String(opt.value)}
                  onPress={() => {
                    onSelect(opt.value);
                    onClose();
                  }}
                  style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                >
                  {opt.color && <View style={[s.dot, { backgroundColor: opt.color }]} />}
                  <Text style={[s.rowLabel, { color: colors.text.primary, flex: 1 }]}>{opt.label}</Text>
                  {active && <Feather name="check" size={18} color={colors.brand.primary} />}
                </Pressable>
              );
            })}
            <View style={s.spacer} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing[4],
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing[3],
    marginBottom: Spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    marginBottom: Spacing[2],
  },
  title: { fontSize: 16, fontFamily: 'Inter-SemiBold' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  rowLabel: { fontSize: 14, fontFamily: 'Inter-Regular' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  spacer: { height: Spacing[6] },
});
