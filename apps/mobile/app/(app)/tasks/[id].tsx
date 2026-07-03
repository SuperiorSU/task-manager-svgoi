import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import * as Haptics from 'expo-haptics';

import type { RichTask, TaskStatus, TaskAttachment } from '@godigitify/types';
import {
  useTask,
  useTaskComments,
  useTaskActivity,
  useTaskAttachments,
  useUpdateTaskStatus,
  useAddComment,
  useDeleteTask,
} from '../../../src/hooks/useTasks';
import { useFileUpload } from '../../../src/hooks/useFileUpload';
import { useAuthStore } from '../../../src/stores/auth.store';
import { filesApi } from '@godigitify/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../src/constants/queryKeys';

import { Colors } from '../../../src/constants/colors';
import { Typography } from '../../../src/constants/typography';
import { Spacing, Layout } from '../../../src/constants/spacing';

import { TaskStatusBadge } from '../../../src/components/task/TaskStatusBadge';
import { TaskPriorityIndicator } from '../../../src/components/task/TaskPriorityIndicator';
import { TaskAttachmentsSection } from '../../../src/components/task/detail/TaskAttachmentsSection';
import { TaskActivityTimeline } from '../../../src/components/task/detail/TaskActivityTimeline';
import { TaskCommentsSection } from '../../../src/components/task/detail/TaskCommentsSection';
import { TaskActionBar } from '../../../src/components/task/detail/TaskActionBar';
import { TaskOverflowSheet, type OverflowAction } from '../../../src/components/task/TaskOverflowSheet';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Skeleton } from '../../../src/components/ui/Skeleton';

const isOverdue = (task: RichTask) =>
  !['COMPLETED', 'CANCELLED'].includes(task.status) && dayjs(task.dueDate).isBefore(dayjs());

// ─── MetaRow ─────────────────────────────────────────────────────────────────
const MetaRow = ({
  icon,
  label,
  children,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  children: React.ReactNode;
}) => (
  <View style={meta.row}>
    <View style={meta.iconWrap}>
      <Feather name={icon} size={14} color={Colors.text.tertiary} />
    </View>
    <Text style={meta.label}>{label}</Text>
    <View style={meta.valueCol}>{children}</View>
  </View>
);

const meta = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  iconWrap: { width: 20, alignItems: 'center' },
  label: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Medium',
    color: Colors.text.tertiary,
    width: 96,
  },
  valueCol: { flex: 1 },
});

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const DetailSkeleton = ({ insets }: { insets: ReturnType<typeof useSafeAreaInsets> }) => (
  <View style={[sk.screen, { paddingTop: insets.top }]}>
    <View style={sk.header}>
      <View style={sk.backBtn} />
      <Skeleton height={22} width={120} borderRadius={6} />
      <View style={sk.moreBtn} />
    </View>
    <ScrollView contentContainerStyle={sk.content} showsVerticalScrollIndicator={false}>
      <Skeleton height={5} borderRadius={0} />
      <Skeleton height={28} width="80%" borderRadius={8} />
      <View style={sk.badgeRow}>
        <Skeleton height={24} width={80} borderRadius={12} />
        <Skeleton height={24} width={60} borderRadius={12} />
      </View>
      <Skeleton height={140} borderRadius={12} />
      <Skeleton height={90} borderRadius={12} />
      <Skeleton height={120} borderRadius={12} />
    </ScrollView>
  </View>
);

const sk = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], backgroundColor: Colors.surface.card, borderBottomWidth: 1, borderBottomColor: Colors.surface.border },
  backBtn: { width: 40, height: 40 },
  moreBtn: { width: 40, height: 40 },
  content: { gap: Spacing[4], padding: Spacing[4] },
  badgeRow: { flexDirection: 'row', gap: Spacing[2] },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskId = id ?? '';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const { data: task, isLoading } = useTask(taskId);
  const { data: comments = [] } = useTaskComments(taskId);
  const { data: activity = [] } = useTaskActivity(taskId);
  const { data: attachments = [] } = useTaskAttachments(taskId);

  const updateStatus = useUpdateTaskStatus();
  const addComment = useAddComment(taskId);
  const deleteTask = useDeleteTask();
  const { uploadFile, uploading } = useFileUpload(taskId);

  const [overflowVisible, setOverflowVisible] = useState(false);
  const [revisionModalVisible, setRevisionModalVisible] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');

  const isAdminCreator = task ? task.creatorId === currentUser?.id : false;

  // ── handlers ──
  const handleBack = useCallback(() => router.back(), [router]);

  const handleStatusChange = useCallback(async (t: RichTask, nextStatus: TaskStatus) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Update Status',
      `Move "${t.title}" to ${nextStatus.replace(/_/g, ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => updateStatus.mutate({ id: t.id, dto: { status: nextStatus } }),
        },
      ]
    );
  }, [updateStatus]);

  const handleApprove = useCallback((t: RichTask) => {
    updateStatus.mutate(
      { id: t.id, dto: { status: 'COMPLETED' } },
      {
        onSuccess: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
        onError: () => Alert.alert('Error', 'Could not approve the task. Please try again.'),
      }
    );
  }, [updateStatus, router]);

  const handleRevise = useCallback((_t: RichTask) => {
    setRevisionNote('');
    setRevisionModalVisible(true);
  }, []);

  const handleRevisionSubmit = useCallback(() => {
    if (!task) return;
    const trimmedNote = revisionNote.trim();
    updateStatus.mutate(
      { id: task.id, dto: { status: 'IN_PROGRESS', ...(trimmedNote ? { comment: trimmedNote } : {}) } },
      {
        onSuccess: async () => {
          setRevisionModalVisible(false);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        },
        onError: () => Alert.alert('Error', 'Could not request revision. Please try again.'),
      }
    );
  }, [task, revisionNote, updateStatus, router]);

  const handleUploadProof = useCallback(async (t: RichTask) => {
    const result = await uploadFile(true);
    if (result) {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.attachments(t.id) });
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.activity(t.id) });
    }
  }, [uploadFile, qc]);

  const handleAddComment = useCallback((_t: RichTask) => {
    // No-op: comment composer is always visible in the Comments section below.
  }, []);

  const handleSubmitComment = useCallback(
    async (content: string) => {
      await addComment.mutateAsync({ content });
    },
    [addComment],
  );

  const handleOpenAttachment = useCallback(async (attachment: TaskAttachment) => {
    try {
      const res = await filesApi.getDownloadUrl(attachment.id);
      await Linking.openURL(res.data.url);
    } catch {
      Alert.alert('Error', 'Could not open this file. Please try again.');
    }
  }, []);

  const handleOverflowAction = useCallback((action: OverflowAction) => {
    if (!task) return;
    if (action === 'delete') {
      Alert.alert('Delete Task', 'This action cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTask.mutate(task.id, { onSuccess: () => router.back() }),
        },
      ]);
    }
    if (action === 'mark_complete') {
      updateStatus.mutate({ id: task.id, dto: { status: 'COMPLETED' } });
    }
  }, [task, deleteTask, updateStatus, router]);

  if (isLoading) {
    return <DetailSkeleton insets={insets} />;
  }

  if (!task) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={22} color={Colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Task Detail</Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={notFound.wrap}>
          <View style={notFound.iconWrap}>
            <Feather name="alert-circle" size={36} color={Colors.text.tertiary} />
          </View>
          <Text style={notFound.title}>Task Not Found</Text>
          <Text style={notFound.body}>
            This task may have been deleted or the link is invalid.
          </Text>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [notFound.btn, pressed && { opacity: 0.75 }]}
          >
            <Text style={notFound.btnText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const t = task;
  const overdue = isOverdue(t);
  const priorityColor = Colors.priority[t.priority.toLowerCase() as keyof typeof Colors.priority];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Task Detail
        </Text>

        <Pressable
          onPress={() => setOverflowVisible(true)}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
          accessibilityLabel="More options"
        >
          <Feather name="more-vertical" size={22} color={Colors.text.primary} />
        </Pressable>
      </View>

      {/* ── Content ── */}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 4pt Priority stripe */}
        <View style={[styles.stripe, { backgroundColor: priorityColor.solid }]} />

        {/* Title + badges */}
        <View style={styles.titleSection}>
          <Text style={styles.taskTitle}>{t.title}</Text>
          <View style={styles.badgeRow}>
            <TaskStatusBadge status={t.status} isOverdue={overdue} />
            <TaskPriorityIndicator priority={t.priority} />
            {overdue && (
              <View style={styles.overdueChip}>
                <Feather name="alert-circle" size={11} color={Colors.semantic.error} />
                <Text style={styles.overdueChipText}>Overdue</Text>
              </View>
            )}
          </View>
        </View>

        {/* Individual Progress entry point — richer review surface for the admin creator */}
        {isAdminCreator && t.status === 'UNDER_REVIEW' && (
          <Pressable
            onPress={() => router.push(`/(app)/tasks/review/${t.id}` as Parameters<typeof router.push>[0])}
            style={({ pressed }) => [styles.entryBanner, styles.entryBannerReview, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="Open full review"
          >
            <View style={[styles.entryIconWrap, { backgroundColor: Colors.status.underReview.bg }]}>
              <Feather name="clipboard" size={18} color={Colors.status.underReview.text} />
            </View>
            <View style={styles.entryTextCol}>
              <Text style={styles.entryTitle}>Open full review</Text>
              <Text style={styles.entrySubtitle}>Submission proof, activity &amp; approval decision</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
          </Pressable>
        )}

        {/* Description */}
        {t.description && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.descriptionText}>{t.description}</Text>
          </View>
        )}

        {/* Meta info card */}
        <View style={[styles.card, styles.metaCard]}>
          {t.department && (
            <>
              <MetaRow icon="briefcase" label="Department">
                <Text style={styles.metaValue}>{t.department.name}</Text>
              </MetaRow>
              <View style={styles.divider} />
            </>
          )}

          <MetaRow icon="user-plus" label="Assigned by">
            <View style={styles.userRow}>
              <Avatar name={t.creator.name} size={22} />
              <Text style={styles.metaValue}>{t.creator.name}</Text>
            </View>
          </MetaRow>
          <View style={styles.divider} />

          <MetaRow icon="user" label="Assigned to">
            <View style={styles.userRow}>
              <Avatar name={t.assignee.name} size={22} />
              <Text style={styles.metaValue}>{t.assignee.name}</Text>
            </View>
          </MetaRow>
          <View style={styles.divider} />

          <MetaRow icon="calendar" label="Created">
            <Text style={styles.metaValue}>{dayjs(t.createdAt).format('MMM D, YYYY')}</Text>
          </MetaRow>
          <View style={styles.divider} />

          <MetaRow icon="clock" label="Due date">
            <Text style={[styles.metaValue, overdue && { color: Colors.semantic.error }]}>
              {dayjs(t.dueDate).format('MMM D, YYYY · h:mm A')}
              {overdue ? '  ·  Overdue' : ''}
            </Text>
          </MetaRow>
        </View>

        {/* Attachments */}
        <TaskAttachmentsSection
          attachments={attachments}
          canAdd={!uploading && !['COMPLETED', 'CANCELLED'].includes(t.status)}
          onAdd={() => handleUploadProof(t)}
          onOpen={handleOpenAttachment}
        />

        {/* Comments */}
        <TaskCommentsSection
          comments={comments}
          currentUserId={currentUser?.id ?? ''}
          currentUserName={currentUser?.name ?? 'You'}
          onSubmit={handleSubmitComment}
          isSubmitting={addComment.isPending}
        />

        {/* Activity Timeline */}
        <TaskActivityTimeline events={activity} />
      </ScrollView>

      {/* ── Fixed action bar ── */}
      <TaskActionBar
        task={t}
        isAdminCreator={isAdminCreator}
        currentUserId={currentUser?.id ?? ''}
        onStatusChange={handleStatusChange}
        onApprove={handleApprove}
        onRevise={handleRevise}
        onUploadProof={handleUploadProof}
        onAddComment={handleAddComment}
      />

      {/* ── Overflow sheet ── */}
      <TaskOverflowSheet
        visible={overflowVisible}
        task={t}
        onAction={handleOverflowAction}
        onClose={() => setOverflowVisible(false)}
      />

      {/* ── Revision note modal ── */}
      <Modal
        visible={revisionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRevisionModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={revisionModal.overlay}
        >
          <View style={revisionModal.sheet}>
            <Text style={revisionModal.title}>Request Revision</Text>
            <Text style={revisionModal.subtitle}>
              Explain what needs to be changed before this task can be approved.
            </Text>

            <TextInput
              style={revisionModal.input}
              placeholder="e.g. Please update the safety checklist and re-attach photos…"
              placeholderTextColor={Colors.text.tertiary}
              value={revisionNote}
              onChangeText={setRevisionNote}
              multiline
              maxLength={500}
              autoFocus
            />

            <View style={revisionModal.actions}>
              <Pressable
                onPress={() => setRevisionModalVisible(false)}
                style={({ pressed }) => [revisionModal.cancelBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={revisionModal.cancelLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleRevisionSubmit}
                disabled={updateStatus.isPending}
                style={({ pressed }) => [
                  revisionModal.submitBtn,
                  pressed && { opacity: 0.85 },
                  updateStatus.isPending && { opacity: 0.6 },
                ]}
              >
                <Text style={revisionModal.submitLabel}>
                  {updateStatus.isPending ? 'Sending…' : 'Send for Revision'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
      android: { elevation: 2 },
    }),
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  headerTitle: {
    ...Typography.h4,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    gap: Spacing[4],
    padding: Spacing[4],
  },
  stripe: {
    height: 5,
    borderRadius: 3,
    marginBottom: Spacing[1],
  },
  titleSection: {
    gap: Spacing[3],
  },
  taskTitle: {
    ...Typography.h2,
    fontFamily: 'Inter-Bold',
    color: Colors.text.primary,
    lineHeight: 30,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  overdueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.semantic.errorBg,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  overdueChipText: {
    ...Typography.labelSm,
    fontFamily: 'Inter-SemiBold',
    color: Colors.semantic.error,
  },
  entryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.surface.card,
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.brand.primaryLight,
  },
  entryBannerReview: {
    borderColor: Colors.status.underReview.bg,
  },
  entryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTextCol: { flex: 1, gap: 2 },
  entryTitle: {
    ...Typography.labelLg,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  entrySubtitle: {
    ...Typography.captionSm,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
  },
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  metaCard: { gap: 0 },
  divider: {
    height: 1,
    backgroundColor: Colors.surface.border,
    marginVertical: Spacing[3],
  },
  sectionLabel: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  descriptionText: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    color: Colors.text.primary,
    lineHeight: 24,
  },
  metaValue: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    color: Colors.text.primary,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
});

const revisionModal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing[5],
    gap: Spacing[4],
  },
  title: {
    ...Typography.h3,
    fontFamily: 'Inter-Bold',
    color: Colors.text.primary,
  },
  subtitle: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  input: {
    backgroundColor: Colors.surface.background,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    borderRadius: 12,
    padding: Spacing[3],
    minHeight: 96,
    textAlignVertical: 'top',
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    color: Colors.text.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[3],
    paddingBottom: Spacing[2],
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.secondary,
  },
  submitBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});

const notFound = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[8],
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  title: {
    ...Typography.h3,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  body: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    marginTop: Spacing[2],
    backgroundColor: Colors.brand.primary,
    borderRadius: 10,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
  },
  btnText: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});
