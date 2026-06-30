import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';

type InfoRow = {
  icon: keyof typeof Feather.glyphMap;
  subLabel: string;
  value: string;
  readOnly?: boolean;
};

type Props = { rows: InfoRow[] };

const InfoRowItem = React.memo(({ icon, subLabel, value, readOnly }: InfoRow) => {
  const colors = useColors();
  return (
    <View style={s.row}>
      <View style={s.iconWrap}>
        <Feather name={icon} size={19} color={colors.text.tertiary} />
      </View>
      <View style={s.textBlock}>
        <Text style={[s.subLabel, { color: colors.text.tertiary }]}>{subLabel}</Text>
        <Text style={[s.value, { color: colors.text.primary }]} numberOfLines={1}>{value}</Text>
      </View>
      {readOnly && <Feather name="lock" size={15} color={colors.surface.borderStrong} />}
    </View>
  );
});

InfoRowItem.displayName = 'InfoRowItem';

export const ProfileInfoCard = React.memo(({ rows }: Props) => {
  const colors = useColors();
  return (
    <View style={[s.card, { backgroundColor: colors.surface.card }]}>
      {rows.map((row, i) => (
        <React.Fragment key={row.subLabel}>
          <InfoRowItem {...row} />
          {i < rows.length - 1 && (
            <View style={[s.divider, { backgroundColor: colors.surface.border, marginLeft: 62 }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
});

ProfileInfoCard.displayName = 'ProfileInfoCard';

const s = StyleSheet.create({
  card: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 14,
  },
  iconWrap: {
    width: 32,
    alignItems: 'center',
  },
  textBlock: { flex: 1 },
  subLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    lineHeight: 14,
  },
  value: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginTop: 1,
  },
  divider: { height: 1 },
});
