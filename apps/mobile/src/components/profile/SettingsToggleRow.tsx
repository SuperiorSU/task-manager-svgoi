import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';

type Props = {
  label: string;
  subtitle?: string;
  icon?: keyof typeof Feather.glyphMap;
  enabled: boolean;
  onToggle: () => void;
  showDivider?: boolean;
};

export const SettingsToggleRow = React.memo(
  ({ label, subtitle, icon, enabled, onToggle, showDivider }: Props) => {
    const colors = useColors();
    return (
      <>
        <View style={s.row}>
          {icon && (
            <View style={s.iconWrap}>
              <Feather name={icon} size={20} color={colors.text.secondary} />
            </View>
          )}
          <View style={s.textBlock}>
            <Text style={[s.label, { color: colors.text.primary }]}>{label}</Text>
            {subtitle ? (
              <Text style={[s.subtitle, { color: colors.text.tertiary }]}>{subtitle}</Text>
            ) : null}
          </View>
          <Switch
            value={enabled}
            onValueChange={onToggle}
            trackColor={{ false: colors.surface.border, true: colors.brand.primary }}
            thumbColor="#fff"
            ios_backgroundColor={colors.surface.border}
          />
        </View>
        {showDivider && (
          <View
            style={[s.divider, { backgroundColor: colors.surface.border, marginLeft: icon ? 52 : 16 }]}
          />
        )}
      </>
    );
  }
);

SettingsToggleRow.displayName = 'SettingsToggleRow';

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: { width: 24, alignItems: 'center' },
  textBlock: { flex: 1 },
  label: { fontSize: 14, fontFamily: 'Inter-Regular' },
  subtitle: { fontSize: 11, fontFamily: 'Inter-Regular', marginTop: 1 },
  divider: { height: 1, marginRight: 16 },
});
