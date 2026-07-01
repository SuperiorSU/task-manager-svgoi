import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';

type Props = {
  icon: keyof typeof Feather.glyphMap;
  iconColor?: string | undefined;
  label: string;
  labelColor?: string | undefined;
  valueLabel?: string | undefined;
  onPress: () => void;
  showDivider?: boolean;
};

export const ProfileSettingsItem = React.memo(
  ({ icon, iconColor, label, labelColor, valueLabel, onPress, showDivider }: Props) => {
    const colors = useColors();
    const resolvedIconColor = iconColor ?? colors.text.secondary;

    return (
      <>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [s.row, pressed && s.pressed]}
          accessibilityRole="button"
        >
          <Feather name={icon} size={19} color={resolvedIconColor} />
          <Text
            style={[s.label, { color: labelColor ?? colors.text.primary }]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {valueLabel ? (
            <Text style={[s.valueLabel, { color: colors.text.tertiary }]}>{valueLabel}</Text>
          ) : null}
          <Feather name="chevron-right" size={17} color={colors.surface.borderStrong} />
        </Pressable>
        {showDivider && <View style={[s.divider, { backgroundColor: colors.surface.border }]} />}
      </>
    );
  }
);

ProfileSettingsItem.displayName = 'ProfileSettingsItem';

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  valueLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  pressed: { opacity: 0.7 },
  divider: {
    height: 1,
    marginLeft: 49,
  },
});
