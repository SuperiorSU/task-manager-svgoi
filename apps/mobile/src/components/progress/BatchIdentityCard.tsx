/**
 * BatchIdentityCard — "DUPLICATED BATCH" + priority badge, title, due date
 * and assignee count, shown at the top of the Batch Progress screen.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import type { BatchProgressSummary } from '../../services/batchProgress.service';
import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Layout } from '../../constants/spacing';

type Props = { summary: BatchProgressSummary };

export const BatchIdentityCard = React.memo(({ summary }: Props) => {
  const colors = useColors();
  const priorityColor = colors.priority[summary.priority.toLowerCase() as keyof typeof colors.priority];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface.card }]}>
      <View style={styles.badgeRow}>
        <View style={[styles.batchBadge, { backgroundColor: colors.brand.primaryLight }]}>
          <Feather name="copy" size={12} color={colors.brand.primary} />
          <Text style={[styles.batchBadgeText, { color: colors.brand.primary }]}>DUPLICATED BATCH</Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: priorityColor.bg, borderColor: priorityColor.border }]}>
          <Text style={[styles.priorityText, { color: priorityColor.text }]}>{summary.priority}</Text>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text.primary }]}>{summary.title}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Feather name="clock" size={14} color={colors.text.secondary} />
          <Text style={[styles.metaText, { color: colors.text.secondary }]}>
            Due {dayjs(summary.dueDate).format('MMM D, h:mm A')}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="users" size={14} color={colors.text.secondary} />
          <Text style={[styles.metaText, { color: colors.text.secondary }]}>
            {summary.totalMembers} assignees
          </Text>
        </View>
      </View>
    </View>
  );
});

BatchIdentityCard.displayName = 'BatchIdentityCard';

const styles = StyleSheet.create({
  card: {
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  batchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  batchBadgeText: { ...Typography.labelSm, fontFamily: 'Inter-Bold', letterSpacing: 0.4 },
  priorityBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  priorityText: { ...Typography.labelSm, fontFamily: 'Inter-Bold', letterSpacing: 0.4 },
  title: { ...Typography.h2, fontFamily: 'Inter-SemiBold', letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', gap: Spacing[5] },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { ...Typography.bodySm, fontFamily: 'Inter-SemiBold' },
});
