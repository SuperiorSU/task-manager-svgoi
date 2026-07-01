/**
 * SubmissionNoteCard — the assignee's own note explaining their submission,
 * shown above the activity timeline on the Review Task screen.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { Avatar } from '../ui/Avatar';
import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Layout } from '../../constants/spacing';

dayjs.extend(relativeTime);

type Props = {
  authorName: string;
  createdAt: string;
  content: string;
};

export const SubmissionNoteCard = React.memo(({ authorName, createdAt, content }: Props) => {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface.card }]}>
      <Text style={[styles.title, { color: colors.text.secondary }]}>Submission note</Text>
      <View style={styles.row}>
        <Avatar name={authorName} size={32} />
        <View style={styles.textCol}>
          <View style={styles.headerRow}>
            <Text style={[styles.author, { color: colors.text.primary }]}>{authorName}</Text>
            <Text style={[styles.time, { color: colors.text.tertiary }]}>{dayjs(createdAt).fromNow()}</Text>
          </View>
          <View style={[styles.bubble, { backgroundColor: colors.surface.background, borderColor: colors.surface.border }]}>
            <Text style={[styles.content, { color: colors.text.secondary }]}>{content}</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

SubmissionNoteCard.displayName = 'SubmissionNoteCard';

const styles = StyleSheet.create({
  card: {
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  title: {
    ...Typography.labelLg,
    fontFamily: 'Inter-SemiBold',
  },
  row: { flexDirection: 'row', gap: Spacing[3] },
  textCol: { flex: 1, gap: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  author: {
    ...Typography.labelLg,
    fontFamily: 'Inter-SemiBold',
  },
  time: {
    ...Typography.captionSm,
    fontFamily: 'Inter-Regular',
  },
  bubble: {
    borderRadius: 10,
    borderWidth: 1,
    padding: Spacing[3],
  },
  content: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    lineHeight: 21,
  },
});
