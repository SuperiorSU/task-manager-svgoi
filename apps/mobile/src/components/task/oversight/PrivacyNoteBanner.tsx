import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Typography } from '../../../constants/typography';
import { Spacing } from '../../../constants/spacing';

type Props = {
  text: string;
};

// FR-72 privacy reinforcement — "aggregate view, task contents stay private"
// (screens 57 and 59). Purple lock-card, shown wherever the SA sees rollup
// counts instead of individual task titles.
export const PrivacyNoteBanner = React.memo(({ text }: Props) => (
  <View style={styles.wrap}>
    <Feather name="lock" size={16} color="#6D28D9" style={styles.icon} />
    <Text style={styles.text}>{text}</Text>
  </View>
));

PrivacyNoteBanner.displayName = 'PrivacyNoteBanner';

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2] + 2,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    borderRadius: 11,
    padding: Spacing[3] + 1,
  },
  icon: { flexShrink: 0 },
  text: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Regular',
    color: '#6D28D9',
    flex: 1,
    lineHeight: 16,
  },
});
