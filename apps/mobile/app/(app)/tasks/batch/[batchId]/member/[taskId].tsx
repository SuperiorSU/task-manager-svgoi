/**
 * Member Copy — one person's isolated slice of a duplicated batch.
 *
 * Reached by tapping a roster row on the Batch Progress screen. Shows only
 * that member's own submission — matching the HTML reference's isolation
 * guarantee ("members can't see one another's tasks or proof"). When the
 * copy is under review, the same Approve / Request Revision decision flow
 * used on the Individual Progress screen is available here too.
 */
import React, { useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useTask, useTaskAttachments, useTaskComments, useTaskActivity } from '../../../../../../src/hooks/useTasks';
import { useTaskReviewActions } from '../../../../../../src/hooks/useTaskReviewActions';
import { useColors } from '../../../../../../src/constants/colors';
import { Typography } from '../../../../../../src/constants/typography';
import { Spacing, Layout } from '../../../../../../src/constants/spacing';
import { QUICK_REVISION_REASONS } from '../../../../../../src/constants/reviewReasons';

import { Avatar } from '../../../../../../src/components/ui/Avatar';
import { Skeleton } from '../../../../../../src/components/ui/Skeleton';
import { EmptyState } from '../../../../../../src/components/ui/EmptyState';
import { TaskStatusBadge } from '../../../../../../src/components/task/TaskStatusBadge';
import { TaskAttachmentsSection } from '../../../../../../src/components/task/detail/TaskAttachmentsSection';
import { TaskActivityTimeline } from '../../../../../../src/components/task/detail/TaskActivityTimeline';
import { TaskActionBar } from '../../../../../../src/components/task/detail/TaskActionBar';
import { ProgressNote } from '../../../../../../src/components/progress/ProgressNote';
import { SubmissionNoteCard } from '../../../../../../src/components/progress/SubmissionNoteCard';
import { RevisionReasonSheet } from '../../../../../../src/components/progress/RevisionReasonSheet';
import { ApprovedConfirmationModal } from '../../../../../../src/components/progress/ApprovedConfirmationModal';
import { ConfirmActionModal } from '../../../../../../src/components/ui/ConfirmActionModal';

import type { TaskStatus } from '@godigitify/types';

const STATUS_MESSAGE: Record<TaskStatus, { icon: keyof typeof Feather.glyphMap; label: string }> = {
  PENDING: { icon: 'circle', label: 'Not started yet — no action needed' },
  ACCEPTED: { icon: 'zap', label: 'Accepted — waiting for work to begin' },
  IN_PROGRESS: { icon: 'clock', label: 'Currently in progress' },
  UNDER_REVIEW: { icon: 'upload', label: 'Awaiting your review' },
  COMPLETED: { icon: 'check-circle', label: 'Approved and completed' },
  CANCELLED: { icon: 'x-circle', label: 'Cancelled' },
};

export default function BatchMemberCopyScreen() {
  const { taskId } = useLocalSearchParams<{ batchId: string; taskId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const { data: task, isLoading } = useTask(taskId ?? '');
  const { data: attachments = [] } = useTaskAttachments(taskId ?? '');
  const { data: comments = [] } = useTaskComments(taskId ?? '');
  const { data: activity = [] } = useTaskActivity(taskId ?? '');
  const handleBack = useCallback(() => router.back(), [router]);

  const review = useTaskReviewActions(task, {
    onApproved: handleBack,
    onRevised: handleBack,
  });

  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Skeleton height={90} borderRadius={12} />
          <Skeleton height={140} borderRadius={12} />
        </ScrollView>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
          <Pressable onPress={handleBack} style={styles.iconBtn} accessibilityLabel="Go back">
            <Feather name="arrow-left" size={22} color={colors.text.primary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Member copy</Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.content}>
          <EmptyState icon="alert-circle" title="Copy not found" subtitle="This task copy may have been removed." />
        </View>
      </View>
    );
  }

  const priorityColor = colors.priority[task.priority.toLowerCase() as keyof typeof colors.priority];
  const firstName = task.assignee.name.split(' ')[0];
  const proof = attachments.filter((a) => a.isProof);
  const submissionNote = [...comments].reverse().find((c) => c.author.id === task.assignee.id);
  const statusMessage = STATUS_MESSAGE[task.status];

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable onPress={handleBack} style={styles.iconBtn} accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
          {firstName}&apos;s copy
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={[styles.priorityBar, { backgroundColor: priorityColor.solid }]} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Member banner */}
        <View style={[styles.memberBanner, { backgroundColor: colors.surface.card }]}>
          <Avatar name={task.assignee.name} size={44} />
          <View style={styles.memberTextCol}>
            <Text style={[styles.memberName, { color: colors.text.primary }]}>{task.assignee.name}</Text>
            <Text style={[styles.memberSub, { color: colors.text.tertiary }]}>
              Batch copy{task.department ? ` · ${task.department.name}` : ''}
            </Text>
          </View>
          <TaskStatusBadge status={task.status} />
        </View>

        {/* Scope reminder */}
        <ProgressNote
          icon="info"
          iconColor={colors.brand.primary}
          backgroundColor={colors.brand.primaryLight}
          text={`You're viewing only ${firstName}'s copy. Other members' proof stays private to their own task.`}
          textColor={colors.brand.primaryDark}
        />

        {/* Proof */}
        <TaskAttachmentsSection
          attachments={proof}
          canAdd={false}
          title={`${firstName}'s completion proof`}
          icon="check-circle"
          emptyLabel="No proof attached yet"
        />

        {submissionNote && (
          <SubmissionNoteCard
            authorName={submissionNote.author.name}
            createdAt={submissionNote.createdAt}
            content={submissionNote.content}
          />
        )}

        <TaskActivityTimeline events={activity} />
      </ScrollView>

      {/* Pinned action — only the review decision is actionable here */}
      {task.status === 'UNDER_REVIEW' ? (
        <TaskActionBar
          task={task}
          isAdminCreator
          loading={review.loading}
          onStatusChange={() => {}}
          onApprove={review.requestApprove}
          onRevise={review.openRevision}
          onUploadProof={() => {}}
          onAddComment={() => {}}
        />
      ) : (
        <View style={[styles.readOnlyBar, { backgroundColor: colors.surface.card, borderTopColor: colors.surface.border, paddingBottom: insets.bottom + Spacing[2] }]}>
          <Feather name={statusMessage.icon} size={18} color={colors.text.tertiary} />
          <Text style={[styles.readOnlyText, { color: colors.text.tertiary }]}>{statusMessage.label}</Text>
        </View>
      )}

      <RevisionReasonSheet
        visible={review.revisionVisible}
        assigneeName={task.assignee.name}
        reasons={QUICK_REVISION_REASONS}
        loading={review.loading}
        onClose={review.closeRevision}
        onSubmit={review.submitRevision}
      />

      <ConfirmActionModal
        visible={review.confirmApproveVisible}
        icon="check-circle"
        iconBg="#F0FDF4"
        iconColor="#16A34A"
        title="Approve & complete this task?"
        body={`This marks "${task.title}" as complete and notifies ${task.assignee.name}. This can't be undone.`}
        confirmLabel="Approve & Complete"
        confirmColor="#16A34A"
        onConfirm={review.approve}
        onDismiss={review.cancelApprove}
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
  memberBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
  },
  memberTextCol: { flex: 1, gap: 2, minWidth: 0 },
  memberName: { ...Typography.h3, fontFamily: 'Inter-SemiBold' },
  memberSub: { ...Typography.captionSm, fontFamily: 'Inter-Regular' },
  readOnlyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    height: 68,
    borderTopWidth: 1,
  },
  readOnlyText: { ...Typography.labelLg, fontFamily: 'Inter-Medium' },
});
