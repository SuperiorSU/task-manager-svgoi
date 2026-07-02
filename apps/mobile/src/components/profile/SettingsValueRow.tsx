import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';

type Props = {
  label: string;
  value: string;
  valueDotColor?: string | undefined;
  onPress?: () => void;
  showDivider?: boolean;
};

export const SettingsValueRow = React.memo(
  ({ label, value, valueDotColor, onPress, showDivider }: Props) => {
    const colors = useColors();
    return (
      <>
        <Pressable
          onPress={onPress}
          disabled={!onPress}
          style={({ pressed }) => [s.row, pressed && onPress && s.pressed]}
        >
          <Text style={[s.label, { color: colors.text.primary }]}>{label}</Text>
          <View style={s.valueWrap}>
            {valueDotColor && <View style={[s.dot, { backgroundColor: valueDotColor }]} />}
            <Text style={[s.value, { color: colors.text.secondary }]}>{value}</Text>
          </View>
          {onPress && <Feather name="chevron-right" size={17} color={colors.surface.borderStrong} />}
        </Pressable>
        {showDivider && <View style={[s.divider, { backgroundColor: colors.surface.border }]} />}
      </>
    );
  }
);

SettingsValueRow.displayName = 'SettingsValueRow';

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  pressed: { opacity: 0.6 },
  label: { flex: 1, fontSize: 14, fontFamily: 'Inter-Regular' },
  valueWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  value: { fontSize: 13, fontFamily: 'Inter-Regular' },
  divider: { height: 1, marginLeft: 16 },
});
