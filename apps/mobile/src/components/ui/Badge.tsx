import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

type Props = {
  label: string;
  bg: string;
  textColor: string;
  borderColor?: string;
};

export const Badge = React.memo(({ label, bg, textColor, borderColor }: Props) => (
  <View style={[styles.badge, { backgroundColor: bg, borderColor: borderColor ?? bg, borderWidth: borderColor ? 1 : 0 }]}>
    <Text style={[styles.label, { color: textColor }]}>{label}</Text>
  </View>
));

Badge.displayName = 'Badge';

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  label: {
    ...Typography.labelSm,
    fontFamily: 'Inter-SemiBold',
  },
});
