/**
 * SubmissionBanner — "Submitted for your review" row shown at the top of
 * the Review Task screen: icon circle + title + assignee/time subtitle.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Layout } from '../../constants/spacing';

type Props = {
  assigneeName: string;
  submittedAt: string; // relative label, e.g. "2h ago"
};

export const SubmissionBanner = React.memo(({ assigneeName, submittedAt }: Props) => {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface.card }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.status.underReview.bg }]}>
        <Feather name="upload" size={18} color={colors.status.underReview.text} />
      </View>
      <View style={styles.textCol}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Submitted for your review</Text>
        <Text style={[styles.subtitle, { color: colors.text.tertiary }]}>
          {assigneeName} · {submittedAt}
        </Text>
      </View>
    </View>
  );
});

SubmissionBanner.displayName = 'SubmissionBanner';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textCol: { flex: 1, gap: 2 },
  title: {
    ...Typography.labelLg,
    fontFamily: 'Inter-SemiBold',
  },
  subtitle: {
    ...Typography.bodySm,
    fontFamily: 'Inter-Regular',
  },
});
