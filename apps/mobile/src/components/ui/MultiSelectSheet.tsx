import React from 'react';
import { Modal, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { Spacing, Layout } from '../../constants/spacing';

export type MultiSelectOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  visible: boolean;
  title: string;
  options: MultiSelectOption<T>[];
  selected: T[];
  onToggle: (value: T) => void;
  onDone: () => void;
  onClose: () => void;
};

// Generic multi-select bottom sheet — checkbox rows + a Done button, distinct
// from SettingsPickerSheet (single-select, closes immediately on pick).
export function MultiSelectSheet<T extends string>({
  visible,
  title,
  options,
  selected,
  onToggle,
  onDone,
  onClose,
}: Props<T>) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[s.backdrop, { backgroundColor: colors.surface.overlay }]} onPress={onClose}>
        <Pressable style={[s.sheet, { backgroundColor: colors.surface.card, paddingBottom: insets.bottom + Spacing[4] }]}>
          <View style={[s.handle, { backgroundColor: colors.surface.borderStrong }]} />
          <View style={[s.header, { borderBottomColor: colors.surface.border }]}>
            <Text style={[s.title, { color: colors.text.primary }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={22} color={colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={s.scroll}>
            {options.map((opt) => {
              const active = selected.includes(opt.value);
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => onToggle(opt.value)}
                  style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={opt.label}
                >
                  <View
                    style={[
                      s.checkbox,
                      {
                        borderColor: active ? colors.brand.primary : colors.surface.borderStrong,
                        backgroundColor: active ? colors.brand.primary : 'transparent',
                      },
                    ]}
                  >
                    {active && <Feather name="check" size={13} color="#FFFFFF" />}
                  </View>
                  <Text style={[s.rowLabel, { color: colors.text.primary }]}>{opt.label}</Text>
                </Pressable>
              );
            })}
            <View style={s.spacer} />
          </ScrollView>

          <Pressable
            onPress={onDone}
            style={({ pressed }) => [s.doneBtn, { backgroundColor: colors.brand.primary }, pressed && { opacity: 0.88 }]}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={s.doneBtnText}>Done</Text>
          </Pressable>
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
    maxHeight: '75%',
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
  title: { fontSize: 16, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  scroll: { maxHeight: 320 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowLabel: { fontSize: 14, fontFamily: 'Inter-Regular', letterSpacing: 0, flex: 1 },
  spacer: { height: Spacing[3] },
  doneBtn: {
    height: 50,
    borderRadius: Layout.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
  doneBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFFFFF', letterSpacing: 0 },
});
