import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';

export type RadioOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: RadioOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
};

export function SettingsRadioCard<T extends string>({ options, selected, onSelect }: Props<T>) {
  const colors = useColors();
  return (
    <View style={[s.card, { backgroundColor: colors.surface.card }]}>
      {options.map((opt, i) => {
        const active = opt.value === selected;
        return (
          <React.Fragment key={opt.value}>
            <Pressable
              onPress={() => onSelect(opt.value)}
              style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              <Text style={[s.label, { color: colors.text.primary }]}>{opt.label}</Text>
              <View
                style={[
                  s.radio,
                  { borderColor: active ? colors.brand.primary : colors.surface.borderStrong },
                  active && { backgroundColor: colors.brand.primary },
                ]}
              >
                {active && <Feather name="check" size={12} color={colors.text.inverse} />}
              </View>
            </Pressable>
            {i < options.length - 1 && (
              <View style={[s.divider, { backgroundColor: colors.surface.border }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  label: { flex: 1, fontSize: 14, fontFamily: 'Inter-Regular' },
  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, marginLeft: 16 },
});
