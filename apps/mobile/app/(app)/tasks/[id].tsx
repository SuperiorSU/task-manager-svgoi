import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { canTransitionTo, getNextStatus } from '@godigitify/utils';

import { Colors } from '../../../src/constants/colors';
import { Typography } from '../../../src/constants/typography';
import { Spacing, Layout } from '../../../src/constants/spacing';
import { ScreenHeader } from '../../../src/components/layout/ScreenHeader';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { TaskStatusBadge } from '../../../src/components/task/TaskStatusBadge';
import { TaskPriorityIndicator, priorityStripeColor } from '../../../src/components/task/TaskPriorityIndicator';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Button } from '../../../src/components/ui/Button';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { useTask, useUpdateTaskStatus } from '../../../src/hooks/useTasks';
import { usePermissions } from '../../../src/hooks/usePermissions';
import { useFileUpload } from '../../../src/hooks/useFileUpload';
import { useAuthStore } from '../../../src/stores/auth.store';
import { PERMISSIONS } from '../../../src/constants/permissions';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: task, isLoading } = useTask(id);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateTaskStatus();
  const { hasPermission } = usePermissions();
  const user = useAuthStore((s) => s.user);
  const { uploadFile, uploading } = useFileUpload(id);

  const t = task as {
    id: string;
    title: string;
    description?: string | null;
    status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'CANCELLED';
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    dueDate: string;
    assignee?: { id: string; name: string; avatarUrl?: string | null } | null;
    department?: { name: string } | null;
    _count?: { comments?: number };
  } | null;

  const canUpdateStatus =
    hasPermission(PERMISSIONS.TASK_UPDATE_STATUS) &&
    t?.status &&
    !['COMPLETED', 'CANCELLED'].includes(t.status);

  const nextStatus = t?.status ? getNextStatus(t.status as Parameters<typeof getNextStatus>[0]) : null;

  const handleStatusUpdate = () => {
    if (!nextStatus || !t?.id) return;
    Alert.alert(
      'Update Status',
      `Move task to "${nextStatus.replace('_', ' ')}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () =>
            updateStatus(
              { id: t.id, dto: { status: nextStatus, note: '' } },
              { onError: () => Alert.alert('Error', 'Failed to update status') }
            ),
        },
      ]
    );
  };

  if (isLoading || !t) {
    return (
      <SafeScreen>
        <ScreenHeader title="Task Detail" showBack />
        <View style={styles.loadingContainer}>
          <Skeleton height={24} width="70%" />
          <Skeleton height={16} width="40%" />
          <Skeleton height={80} />
        </View>
      </SafeScreen>
    );
  }

  const isOverdue =
    !['COMPLETED', 'CANCELLED'].includes(t.status) &&
    dayjs(t.dueDate).isBefore(dayjs());

  return (
    <SafeScreen>
      {/* Priority stripe at top */}
      <View style={[styles.topStripe, { backgroundColor: priorityStripeColor(t.priority) }]} />
      <ScreenHeader title="Task Detail" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title + badges */}
        <View style={styles.section}>
          <Text style={styles.title}>{t.title}</Text>
          <View style={styles.badgeRow}>
            <TaskStatusBadge status={t.status} isOverdue={isOverdue} />
            <TaskPriorityIndicator priority={t.priority} />
          </View>
        </View>

        {/* Meta */}
        <View style={styles.metaCard}>
          <MetaRow icon="calendar" label="Due Date">
            <Text style={[styles.metaValue, isOverdue && styles.overdueText]}>
              {dayjs(t.dueDate).format('MMM D, YYYY')}
              {isOverdue && ' (Overdue)'}
            </Text>
          </MetaRow>

          {t.department && (
            <MetaRow icon="briefcase" label="Department">
              <Text style={styles.metaValue}>{t.department.name}</Text>
            </MetaRow>
          )}

          {t.assignee && (
            <MetaRow icon="user" label="Assignee">
              <View style={styles.assigneeRow}>
                <Avatar name={t.assignee.name} uri={t.assignee.avatarUrl} size={24} />
                <Text style={styles.metaValue}>{t.assignee.name}</Text>
              </View>
            </MetaRow>
          )}
        </View>

        {/* Description */}
        {t.description && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.description}>{t.description}</Text>
          </View>
        )}

        {/* Comments shortcut */}
        <Pressable
          style={({ pressed }) => [styles.commentsRow, pressed && styles.pressed]}
          onPress={() => router.push(`/(app)/tasks/${id}/comments`)}
        >
          <Feather name="message-circle" size={18} color={Colors.brand.primary} />
          <Text style={styles.commentsText}>
            {t._count?.comments ?? 0} Comments
          </Text>
          <Feather name="chevron-right" size={18} color={Colors.text.tertiary} style={{ marginLeft: 'auto' }} />
        </Pressable>

        {/* Actions */}
        {canUpdateStatus && nextStatus && (
          <Button
            label={isUpdating ? 'Updating...' : `Mark as ${nextStatus.replace(/_/g, ' ')}`}
            onPress={handleStatusUpdate}
            loading={isUpdating}
            fullWidth
          />
        )}

        {hasPermission(PERMISSIONS.FILE_UPLOAD) && (
          <Button
            label={uploading ? 'Uploading...' : 'Attach File'}
            variant="secondary"
            loading={uploading}
            fullWidth
            onPress={() => uploadFile(t.status === 'UNDER_REVIEW')}
          />
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const MetaRow = ({
  icon,
  label,
  children,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  children: React.ReactNode;
}) => (
  <View style={styles.metaRow}>
    <Feather name={icon} size={16} color={Colors.text.tertiary} />
    <Text style={styles.metaLabel}>{label}</Text>
    <View style={styles.metaValueContainer}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  topStripe: { height: 4 },
  loadingContainer: { flex: 1, padding: Spacing[5], gap: Spacing[4] },
  content: { padding: Spacing[4], gap: Spacing[4], paddingBottom: Spacing[10] },
  section: { gap: Spacing[3] },
  title: { ...Typography.h3, fontFamily: 'Inter-Bold', color: Colors.text.primary },
  badgeRow: { flexDirection: 'row', gap: Spacing[2], flexWrap: 'wrap' },
  metaCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
    gap: Spacing[4],
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  metaLabel: { ...Typography.labelMd, fontFamily: 'Inter-Medium', color: Colors.text.secondary, width: 80 },
  metaValueContainer: { flex: 1 },
  metaValue: { ...Typography.bodyMd, fontFamily: 'Inter-Regular', color: Colors.text.primary },
  overdueText: { color: Colors.semantic.error },
  assigneeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  sectionLabel: { ...Typography.labelMd, fontFamily: 'Inter-SemiBold', color: Colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.8 },
  description: { ...Typography.bodyMd, fontFamily: 'Inter-Regular', color: Colors.text.primary, lineHeight: 24 },
  commentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.surface.card,
    borderRadius: 10,
    padding: Spacing[4],
  },
  commentsText: { ...Typography.bodyMd, fontFamily: 'Inter-Medium', color: Colors.brand.primary },
  pressed: { opacity: 0.7 },
});
