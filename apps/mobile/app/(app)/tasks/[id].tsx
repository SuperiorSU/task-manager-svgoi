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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import * as Haptics from 'expo-haptics';

import type { MockTask } from '../../../src/data/tasks.mock';
import { isTaskOverdue } from '../../../src/data/tasks.mock';
import { useMockTaskDetail } from '../../../src/hooks/useTasksMock';
import { adminTasksService } from '../../../src/services/adminTasks.service';

import { Colors } from '../../../src/constants/colors';
import { Typography } from '../../../src/constants/typography';
import { Spacing, Layout } from '../../../src/constants/spacing';

import { TaskStatusBadge } from '../../../src/components/task/TaskStatusBadge';
import { TaskPriorityIndicator } from '../../../src/components/task/TaskPriorityIndicator';
import { TaskProgressBar } from '../../../src/components/task/detail/TaskProgressBar';
import { TaskSubtasksSection } from '../../../src/components/task/detail/TaskSubtasksSection';
import { TaskAttachmentsSection } from '../../../src/components/task/detail/TaskAttachmentsSection';
import { TaskActivityTimeline } from '../../../src/components/task/detail/TaskActivityTimeline';
import { TaskCommentsSection } from '../../../src/components/task/detail/TaskCommentsSection';
import { TaskActionBar } from '../../../src/components/task/detail/TaskActionBar';
import { TaskOverflowSheet, type OverflowAction } from '../../../src/components/task/TaskOverflowSheet';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Skeleton } from '../../../src/components/ui/Skeleton';

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
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: task, isLoading } = useMockTaskDetail(id ?? '');
  const [localTask, setLocalTask] = useState<MockTask | null>(null);
  const [overflowVisible, setOverflowVisible] = useState(false);
  const [revisionModalVisible, setRevisionModalVisible] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const displayed = localTask ?? task ?? null;
  const isAdminCreator = displayed ? adminTasksService.isAdminCreator(displayed) : false;

  // ── handlers ──
  const handleBack = useCallback(() => router.back(), [router]);

  const handleStatusChange = useCallback(async (t: MockTask, nextStatus: MockTask['status']) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Update Status',
      `Move "${t.title}" to ${nextStatus.replace(/_/g, ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => setLocalTask((prev) => ({ ...(prev ?? t), status: nextStatus })),
        },
      ]
    );
  }, []);

  const handleApprove = useCallback(async (t: MockTask) => {
    setActionLoading(true);
    try {
      await adminTasksService.approveTask(t.id);
      setLocalTask((prev) => ({ ...(prev ?? t), status: 'COMPLETED' }));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(app)/(admin)/tasks' as Parameters<typeof router.replace>[0]);
    } catch {
      Alert.alert('Error', 'Could not approve the task. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }, [router]);

  const handleRevise = useCallback((_t: MockTask) => {
    setRevisionNote('');
    setRevisionModalVisible(true);
  }, []);

  const handleRevisionSubmit = useCallback(async () => {
    const t = displayed;
    if (!t) return;
    setActionLoading(true);
    try {
      await adminTasksService.requestRevision(t.id, revisionNote.trim());
      setLocalTask((prev) => ({ ...(prev ?? t), status: 'IN_PROGRESS' }));
      setRevisionModalVisible(false);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.replace('/(app)/(admin)/tasks' as Parameters<typeof router.replace>[0]);
    } catch {
      Alert.alert('Error', 'Could not request revision. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }, [displayed, revisionNote, router]);

  const handleUploadProof = useCallback((_t: MockTask) => {
    Alert.alert('Upload Proof', 'File picker would open here in production.');
  }, []);

  const handleAddComment = useCallback((_t: MockTask) => {
    // scroll to comments — handled inline in screen
  }, []);

  const handleOverflowAction = useCallback((action: OverflowAction, t: MockTask) => {
    if (action === 'delete') {
      Alert.alert('Delete Task', 'This action cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => router.back() },
      ]);
    }
    if (action === 'mark_complete') {
      setLocalTask({ ...t, status: 'COMPLETED' });
    }
  }, [router]);

  if (isLoading) {
    return <DetailSkeleton insets={insets} />;
  }

  if (!displayed) {
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

  const t = displayed;
  const overdue = isTaskOverdue(t);
  const completedSubtasks = t.subtasks.filter((s) => s.completed).length;

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

        {/* Description */}
        {t.description && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.descriptionText}>{t.description}</Text>
          </View>
        )}

        {/* Meta info card */}
        <View style={[styles.card, styles.metaCard]}>
          <MetaRow icon="layers" label="Project">
            <Text style={styles.metaValue}>{t.project.name}</Text>
          </MetaRow>
          <View style={styles.divider} />

          <MetaRow icon="briefcase" label="Department">
            <Text style={styles.metaValue}>{t.department.name}</Text>
          </MetaRow>
          <View style={styles.divider} />

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

        {/* Labels */}
        {t.labels.length > 0 && (
          <View style={styles.labelsRow}>
            {t.labels.map((label) => (
              <View key={label} style={styles.labelChip}>
                <Text style={styles.labelText}>{label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Progress */}
        <TaskProgressBar
          progress={t.progress}
          completedSubtasks={completedSubtasks}
          totalSubtasks={t.subtasks.length}
        />

        {/* Subtasks */}
        <TaskSubtasksSection subtasks={t.subtasks} />

        {/* Attachments */}
        <TaskAttachmentsSection
          attachments={t.attachments}
          canAdd={!['COMPLETED', 'CANCELLED'].includes(t.status)}
          onAdd={() => handleUploadProof(t)}
        />

        {/* Comments */}
        <TaskCommentsSection comments={t.comments} />

        {/* Activity Timeline */}
        <TaskActivityTimeline events={t.activity} />
      </ScrollView>

      {/* ── Fixed action bar ── */}
      <TaskActionBar
        task={t}
        isAdminCreator={isAdminCreator}
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
                disabled={actionLoading}
                style={({ pressed }) => [
                  revisionModal.submitBtn,
                  pressed && { opacity: 0.85 },
                  actionLoading && { opacity: 0.6 },
                ]}
              >
                <Text style={revisionModal.submitLabel}>
                  {actionLoading ? 'Sending…' : 'Send for Revision'}
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
  labelsRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  labelChip: {
    backgroundColor: Colors.brand.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  labelText: {
    ...Typography.labelSm,
    fontFamily: 'Inter-Medium',
    color: Colors.brand.primary,
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
