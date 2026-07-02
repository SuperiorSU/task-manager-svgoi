/**
 * Review Task — Individual Progress
 *
 * Dedicated review surface for a single-assignee task that's UNDER_REVIEW:
 * submission banner, due/assignee info grid, completion proof, the
 * assignee's own submission note, activity history, and the pinned
 * Approve & Complete / Request Revision decision bar. Matches the HTML
 * reference "Review Task" screens (Part 1 + 2) as one scrollable surface.
 */
import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { useMockTaskDetail } from '../../../../src/hooks/useTasksMock';
import { useTaskReviewActions } from '../../../../src/hooks/useTaskReviewActions';
import { useColors } from '../../../../src/constants/colors';
import { Typography } from '../../../../src/constants/typography';
import { Spacing, Layout } from '../../../../src/constants/spacing';
import { QUICK_REVISION_REASONS } from '../../../../src/constants/reviewReasons';

import { TaskStatusBadge } from '../../../../src/components/task/TaskStatusBadge';
import { TaskPriorityIndicator } from '../../../../src/components/task/TaskPriorityIndicator';
import { TaskAttachmentsSection } from '../../../../src/components/task/detail/TaskAttachmentsSection';
import { TaskActivityTimeline } from '../../../../src/components/task/detail/TaskActivityTimeline';
import { TaskActionBar } from '../../../../src/components/task/detail/TaskActionBar';
import { SubmissionBanner } from '../../../../src/components/progress/SubmissionBanner';
import { ReviewInfoGrid } from '../../../../src/components/progress/ReviewInfoGrid';
import { SubmissionNoteCard } from '../../../../src/components/progress/SubmissionNoteCard';
import { RevisionReasonSheet } from '../../../../src/components/progress/RevisionReasonSheet';
import { ApprovedConfirmationModal } from '../../../../src/components/progress/ApprovedConfirmationModal';
import { Skeleton } from '../../../../src/components/ui/Skeleton';

dayjs.extend(relativeTime);

export default function ReviewTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const { data: task, isLoading } = useMockTaskDetail(id ?? '');

  const handleBack = useCallback(() => router.back(), [router]);
  const handleDone = useCallback(() => router.back(), [router]);

  const review = useTaskReviewActions(task, {
    onApproved: handleDone,
    onRevised: handleDone,
  });

  if (isLoading || !task) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Skeleton height={6} borderRadius={0} />
          <Skeleton height={90} borderRadius={12} />
          <Skeleton height={140} borderRadius={12} />
          <Skeleton height={160} borderRadius={12} />
        </ScrollView>
      </View>
    );
  }

  const priorityColor = colors.priority[task.priority.toLowerCase() as keyof typeof colors.priority];
  const lastActivity = task.activity[task.activity.length - 1];
  const submittedAt = dayjs(lastActivity?.createdAt ?? task.createdAt).fromNow();
  const proof = task.attachments.filter((a) => a.isProof);
  const submissionNote = [...task.comments].reverse().find((c) => c.author.id === task.assignee.id);

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable onPress={handleBack} style={styles.iconBtn} accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
          Review Task
        </Text>
        <View style={styles.iconBtn} />
      </View>

      {/* Priority bar */}
      <View style={[styles.priorityBar, { backgroundColor: priorityColor.solid }]} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title block */}
        <View style={styles.titleBlock}>
          <View style={styles.badgeRow}>
            <TaskPriorityIndicator priority={task.priority} />
            <TaskStatusBadge status={task.status} />
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>{task.title}</Text>
          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: colors.surface.background }]}>
              <Text style={[styles.chipText, { color: colors.text.secondary }]}>{task.department.name}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.surface.background }]}>
              <Text style={[styles.chipText, { color: colors.text.secondary }]}>{task.project.name}</Text>
            </View>
          </View>
        </View>

        {/* Submission banner */}
        <SubmissionBanner assigneeName={task.assignee.name} submittedAt={submittedAt} />

        {/* Info grid */}
        <ReviewInfoGrid
          cells={[
            { kind: 'text', label: 'Due', value: dayjs(task.dueDate).format('MMM D, h:mm A'), icon: 'clock' },
            { kind: 'text', label: 'Submitted', value: submittedAt },
            { kind: 'user', label: 'Assigned by', name: task.creator.name },
            { kind: 'user', label: 'Assignee', name: task.assignee.name },
          ]}
        />

        {/* Completion proof */}
        <TaskAttachmentsSection
          attachments={proof}
          canAdd={false}
          title="Completion proof"
          icon="check-circle"
          emptyLabel="No proof attached yet"
        />

        {/* Submission note */}
        {submissionNote && (
          <SubmissionNoteCard
            authorName={submissionNote.author.name}
            createdAt={submissionNote.createdAt}
            content={submissionNote.content}
          />
        )}

        {/* Activity */}
        <TaskActivityTimeline events={task.activity} />
      </ScrollView>

      {/* Pinned decision bar */}
      <TaskActionBar
        task={task}
        isAdminCreator
        onStatusChange={() => {}}
        onApprove={review.approve}
        onRevise={review.openRevision}
        onUploadProof={() => {}}
        onAddComment={() => {}}
      />

      <RevisionReasonSheet
        visible={review.revisionVisible}
        assigneeName={task.assignee.name}
        reasons={QUICK_REVISION_REASONS}
        loading={review.loading}
        onClose={review.closeRevision}
        onSubmit={review.submitRevision}
      />

      <ApprovedConfirmationModal
        visible={review.approvedVisible}
        taskTitle={task.title}
        assigneeName={task.assignee.name}
        onDone={review.closeApproved}
      />
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
  priorityBar: { height: 6 },
  content: { gap: Spacing[4], padding: Spacing[4] },
  titleBlock: { gap: Spacing[3] },
  badgeRow: { flexDirection: 'row', gap: Spacing[2], alignItems: 'center' },
  title: { ...Typography.h2, fontFamily: 'Inter-SemiBold', letterSpacing: -0.2 },
  chipRow: { flexDirection: 'row', gap: Spacing[2] },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Layout.badgeRadius + 1 },
  chipText: { ...Typography.labelSm, fontFamily: 'Inter-Medium' },
});
