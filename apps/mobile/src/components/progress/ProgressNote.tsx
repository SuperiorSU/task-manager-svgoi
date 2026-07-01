/**
 * ProgressNote — a small icon + text callout used across the Progress
 * module: the "each copy is private" isolation note, the "you're viewing
 * only X's copy" scope reminder, the revision-sheet notify note, and the
 * "N members behind schedule" nudge card. One component, driven entirely
 * by props — no copy or color is hardcoded here.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

type Props = {
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  backgroundColor: string;
  borderColor?: string;
  title?: string;
  titleColor?: string;
  text: string;
  textColor: string;
};

export const ProgressNote = React.memo(
  ({ icon, iconColor, backgroundColor, borderColor, title, titleColor, text, textColor }: Props) => (
    <View
      style={[
        styles.wrap,
        { backgroundColor },
        borderColor ? { borderWidth: 1, borderColor } : null,
      ]}
    >
      <Feather name={icon} size={title ? 20 : 16} color={iconColor} style={styles.icon} />
      <View style={styles.textCol}>
        {title && <Text style={[styles.title, { color: titleColor ?? textColor }]}>{title}</Text>}
        <Text style={[styles.text, { color: textColor }]}>{text}</Text>
      </View>
    </View>
  ),
);

ProgressNote.displayName = 'ProgressNote';

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    borderRadius: 12,
    padding: Spacing[3] + 1,
  },
  icon: { marginTop: 1 },
  textCol: { flex: 1, gap: 2 },
  title: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
  },
  text: {
    ...Typography.bodySm,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
});
