/**
 * GovernanceTaskDetailScreen — "Tracking" detail (HTML screen 63). The SA
 * reviews a governance task's progress and, once UNDER_REVIEW, approves or
 * requests revision. Reuses RevisionReasonSheet / ApprovedConfirmationModal
 * / TaskActivityTimeline from the Admin review flow (generic, presentational,
 * no changes needed) plus the module's own LifecycleStepper.
 */

import React, { useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { useGovernanceTask } from '../hooks/useSuperAdminTasks';
import { useGovernanceReviewActions } from '../hooks/useGovernanceReviewActions';
import { useColors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { QUICK_REVISION_REASONS } from '../constants/reviewReasons';

import { LifecycleStepper } from '../components/task/oversight/LifecycleStepper';
import { TaskActivityTimeline } from '../components/task/detail/TaskActivityTimeline';
import { RevisionReasonSheet } from '../components/progress/RevisionReasonSheet';
import { ApprovedConfirmationModal } from '../components/progress/ApprovedConfirmationModal';
import { Skeleton } from '../components/ui/Skeleton';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'AWAITING ACCEPT',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN PROGRESS',
  UNDER_REVIEW: 'AWAITING YOUR APPROVAL',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export function GovernanceTaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: task, isLoading, refetch } = useGovernanceTask(id ?? '');

  const review = useGovernanceReviewActions(task, {
    onApproved: () => refetch(),
    onRevised: () => refetch(),
  });

  const handleApproveDone = useCallback(() => {
    review.closeApproved();
  }, [review]);

  if (isLoading || !task) {
    return (
      <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
        <View style={[s.header, { paddingTop: insets.top + 6 }]}>
          <Pressable onPress={() => router.back()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Back">
            <Feather name="chevron-left" size={22} color={colors.text.primary} />
          </Pressable>
        </View>
        <View style={s.loadingBody}>
          <Skeleton height={100} borderRadius={14} />
          <Skeleton height={120} borderRadius={14} />
          <Skeleton height={180} borderRadius={14} />
        </View>
      </View>
    );
  }

  const proof = task.attachments.find((a) => a.isProof) ?? task.attachments[0];
  const note = task.comments[task.comments.length - 1];
  const isReview = task.status === 'UNDER_REVIEW';

  return (
    <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
      <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.text.primary }]}>Tracking</Text>
        <View style={[s.statusBadge, { backgroundColor: isReview ? '#F5F3FF' : colors.surface.background }]}>
          <Text style={[s.statusBadgeText, { color: isReview ? '#6D28D9' : colors.text.secondary }]}>
            {STATUS_LABEL[task.status]}
          </Text>
        </View>
      </View>
      <View style={[s.topStripe, { backgroundColor: isReview ? colors.semantic.success : colors.brand.secondary }]} />

      <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: Spacing[6] }} showsVerticalScrollIndicator={false}>
        <View style={[s.titleBlock, { backgroundColor: colors.surface.card }]}>
          <Text style={[s.title, { color: colors.text.primary }]}>{task.title}</Text>
          <View style={s.titleMetaRow}>
            <View style={[s.assigneeAvatar, { backgroundColor: colors.brand.secondary }]}>
              <Text style={s.assigneeAvatarText}>{task.assignee.initials}</Text>
            </View>
            <View style={s.titleMetaInfo}>
              <Text style={[s.assigneeName, { color: colors.text.primary }]}>
                {task.assignee.name} · {task.assignee.designation}
              </Text>
              <Text style={[s.assignedDate, { color: colors.text.tertiary }]}>
                You assigned · {dayjs(task.createdAt).format('MMM D')}
              </Text>
            </View>
            <View style={[s.onTimeChip, { backgroundColor: colors.surface.background }]}>
              <Text style={[s.onTimeText, { color: colors.text.secondary }]}>
                {dayjs(task.dueDate).isBefore(dayjs()) && task.status !== 'COMPLETED' ? 'Overdue' : 'On time'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[s.card, { backgroundColor: colors.surface.card }]}>
          <Text style={[s.cardTitle, { color: colors.text.secondary }]}>Progress</Text>
          <LifecycleStepper status={task.status} />
        </View>

        {proof && (
          <View style={[s.card, { backgroundColor: colors.surface.card }]}>
            <Text style={[s.cardTitle, { color: colors.text.secondary }]}>Submitted proof</Text>
            <View style={[s.proofRow, { borderColor: colors.surface.border }]}>
              <View style={[s.proofIcon, { backgroundColor: colors.semantic.errorBg }]}>
                <Feather name="file-text" size={18} color={colors.semantic.error} />
              </View>
              <View style={s.proofInfo}>
                <Text style={[s.proofName, { color: colors.text.primary }]} numberOfLines={1}>
                  {proof.fileName}
                </Text>
                <Text style={[s.proofMeta, { color: colors.text.tertiary }]}>
                  {(proof.fileSize / 1_000_000).toFixed(1)} MB · submitted {dayjs(proof.createdAt).fromNow()}
                </Text>
              </View>
              <Feather name="download" size={18} color={colors.text.secondary} />
            </View>
            {note && (
              <View style={[s.noteBox, { backgroundColor: colors.surface.background }]}>
                <Text style={[s.noteText, { color: colors.text.secondary }]}>
                  <Text style={[s.noteAuthor, { color: colors.text.primary }]}>Note from {note.author.name}: </Text>
                  {note.content}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={[s.card, { backgroundColor: colors.surface.card }]}>
          <TaskActivityTimeline events={task.activity} />
        </View>
      </ScrollView>

      {isReview && (
        <View style={[s.footer, { backgroundColor: colors.surface.card, borderTopColor: colors.surface.border, paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={review.approve}
            disabled={review.loading}
            style={({ pressed }) => [s.approveBtn, { backgroundColor: colors.semantic.success }, pressed && s.pressed, review.loading && s.disabled]}
            accessibilityRole="button"
            accessibilityLabel="Approve"
          >
            <Feather name="check" size={17} color="#FFFFFF" />
            <Text style={s.approveText}>Approve</Text>
          </Pressable>
          <Pressable
            onPress={review.openRevision}
            disabled={review.loading}
            style={({ pressed }) => [s.revisionBtn, { borderColor: colors.surface.border }, pressed && s.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Request revision"
          >
            <Feather name="rotate-ccw" size={16} color="#B45309" />
            <Text style={s.revisionText}>Revision</Text>
          </Pressable>
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

      <ApprovedConfirmationModal
        visible={review.approvedVisible}
        taskTitle={task.title}
        assigneeName={task.assignee.name}
        onDone={handleApproveDone}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingBottom: 12 },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Inter-SemiBold' },
  statusBadge: { borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4 },
  statusBadgeText: { fontSize: 10, fontFamily: 'Inter-Bold', letterSpacing: 0.3 },
  topStripe: { height: 6 },
  loadingBody: { padding: Spacing[4], gap: Spacing[3] },
  body: { flex: 1 },
  titleBlock: { padding: Spacing[5], paddingTop: Spacing[4] },
  title: { fontSize: 19, fontFamily: 'Inter-SemiBold', letterSpacing: -0.2, lineHeight: 26 },
  titleMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 11 },
  assigneeAvatar: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  assigneeAvatarText: { fontSize: 10, fontFamily: 'Inter-Bold', color: '#FFFFFF' },
  titleMetaInfo: { flex: 1, minWidth: 0 },
  assigneeName: { fontSize: 12.5, fontFamily: 'Inter-SemiBold' },
  assignedDate: { fontSize: 11, fontFamily: 'Inter-Regular' },
  onTimeChip: { borderRadius: 7, paddingHorizontal: 10, paddingVertical: 4 },
  onTimeText: { fontSize: 11, fontFamily: 'Inter-SemiBold' },
  card: { marginTop: 8, padding: Spacing[5] },
  cardTitle: { fontSize: 13, fontFamily: 'Inter-SemiBold', marginBottom: 16 },
  proofRow: { flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderRadius: 10, padding: 12 },
  proofIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  proofInfo: { flex: 1, minWidth: 0 },
  proofName: { fontSize: 12.5, fontFamily: 'Inter-SemiBold' },
  proofMeta: { fontSize: 11, fontFamily: 'Inter-Regular', marginTop: 1 },
  noteBox: { borderRadius: 9, padding: 12, marginTop: 11 },
  noteText: { fontSize: 12.5, lineHeight: 19, fontFamily: 'Inter-Regular' },
  noteAuthor: { fontFamily: 'Inter-SemiBold' },
  footer: { flexDirection: 'row', gap: 10, padding: Spacing[4], borderTopWidth: 1 },
  approveBtn: { flex: 1, height: 50, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  approveText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
  revisionBtn: { width: 140, height: 50, borderRadius: 10, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  revisionText: { fontSize: 13, fontFamily: 'Inter-SemiBold', color: '#B45309' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
