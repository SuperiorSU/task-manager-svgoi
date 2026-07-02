/**
 * Batch Progress Tracker — Batch/Group Progress
 *
 * Aggregates every independent task copy that shares a batchId (FR-23
 * duplicate-to-team) into one view: overall completion, a per-member
 * roster, and a bulk "nudge stragglers" action. Matches the HTML
 * reference "Batch Tracker" screens (Part 1 + 2) as one scrollable surface.
 */
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useBatchProgress } from '../../../../src/hooks/useBatchProgress';
import { useColors } from '../../../../src/constants/colors';
import { Typography } from '../../../../src/constants/typography';
import { Spacing, Layout } from '../../../../src/constants/spacing';

import { BatchIdentityCard } from '../../../../src/components/progress/BatchIdentityCard';
import { ProgressNote } from '../../../../src/components/progress/ProgressNote';
import { BatchProgressSummaryBar } from '../../../../src/components/progress/BatchProgressSummaryBar';
import { BatchMemberRow } from '../../../../src/components/progress/BatchMemberRow';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { Skeleton } from '../../../../src/components/ui/Skeleton';

export default function BatchProgressScreen() {
  const { batchId } = useLocalSearchParams<{ batchId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [nudgeSent, setNudgeSent] = useState(false);

  const { summary, isLoading, sortBy, toggleSort, sortedMembers, nudgeStragglers, nudging } =
    useBatchProgress(batchId ?? '');

  const handleBack = useCallback(() => router.back(), [router]);

  const handleMemberPress = useCallback(
    (taskId: string) => router.push(`/(app)/tasks/batch/${batchId}/member/${taskId}` as Parameters<typeof router.push>[0]),
    [router, batchId],
  );

  const handleToggleSort = useCallback(async () => {
    await Haptics.selectionAsync();
    toggleSort();
  }, [toggleSort]);

  const handleNudge = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await nudgeStragglers();
    setNudgeSent(true);
    Alert.alert('Reminder sent', `Notified ${result.notifiedCount} member${result.notifiedCount === 1 ? '' : 's'} behind schedule.`);
  }, [nudgeStragglers]);

  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Skeleton height={110} borderRadius={12} />
          <Skeleton height={140} borderRadius={12} />
          <Skeleton height={200} borderRadius={12} />
        </ScrollView>
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
          <Pressable onPress={handleBack} style={styles.iconBtn} accessibilityLabel="Go back">
            <Feather name="arrow-left" size={22} color={colors.text.primary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Batch progress</Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.content}>
          <EmptyState icon="alert-circle" title="Batch not found" subtitle="This batch may have been removed." />
        </View>
      </View>
    );
  }

  const atRiskLabel = summary.atRiskCount === 1 ? 'member' : 'members';

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable onPress={handleBack} style={styles.iconBtn} accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
          Batch progress
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <BatchIdentityCard summary={summary} />

        <ProgressNote
          icon="lock"
          iconColor={colors.priority.critical.text}
          backgroundColor={colors.priority.critical.bg}
          text={summary.isolationNote}
          textColor={colors.priority.critical.text}
        />

        <BatchProgressSummaryBar
          segments={summary.segments}
          doneCount={summary.doneCount}
          totalMembers={summary.totalMembers}
        />

        {/* Roster */}
        <View style={[styles.rosterCard, { backgroundColor: colors.surface.card }]}>
          <View style={styles.rosterHeader}>
            <Text style={[styles.rosterTitle, { color: colors.text.secondary }]}>Members</Text>
            <Pressable onPress={handleToggleSort} accessibilityRole="button" accessibilityLabel="Toggle sort order">
              <Text style={[styles.sortLabel, { color: colors.brand.primary }]}>
                Sort: {sortBy === 'status' ? 'Status' : 'Name'}
              </Text>
            </Pressable>
          </View>
          {sortedMembers.map((member) => (
            <BatchMemberRow key={member.task.id} member={member} onPress={handleMemberPress} />
          ))}
        </View>

        {summary.atRiskCount > 0 && (
          <ProgressNote
            icon="bell"
            iconColor={colors.status.inProgress.text}
            backgroundColor={colors.status.inProgress.bg}
            borderColor="#FDE68A"
            title={`${summary.atRiskCount} ${atRiskLabel} behind schedule`}
            text="Send a reminder to the active and not-started members"
            titleColor="#92400E"
            textColor={colors.status.inProgress.text}
          />
        )}
      </ScrollView>

      {/* Pinned bulk action bar */}
      <View style={[styles.actionBar, { backgroundColor: colors.surface.card, borderTopColor: colors.surface.border, paddingBottom: insets.bottom + Spacing[2] }]}>
        <Pressable
          onPress={handleNudge}
          disabled={nudging || summary.atRiskCount === 0}
          style={({ pressed }) => [
            styles.nudgeBtn,
            { backgroundColor: colors.brand.primary },
            pressed && { opacity: 0.87 },
            (nudging || summary.atRiskCount === 0) && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Nudge stragglers"
        >
          <Feather name="bell" size={17} color="#FFFFFF" />
          <Text style={styles.nudgeLabel}>
            {nudging ? 'Sending…' : nudgeSent ? 'Reminder sent' : 'Nudge stragglers'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  headerTitle: { ...Typography.h4, fontFamily: 'Inter-SemiBold', flex: 1, textAlign: 'center' },
  content: { gap: Spacing[4], padding: Spacing[4] },
  rosterCard: { borderRadius: Layout.cardRadius, overflow: 'hidden', paddingBottom: Spacing[1] },
  rosterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  rosterTitle: { ...Typography.labelLg, fontFamily: 'Inter-SemiBold' },
  sortLabel: { ...Typography.labelMd, fontFamily: 'Inter-SemiBold' },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
  },
  nudgeBtn: {
    flex: 1,
    height: 50,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  nudgeLabel: { ...Typography.labelLg, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
  disabled: { opacity: 0.55 },
});
