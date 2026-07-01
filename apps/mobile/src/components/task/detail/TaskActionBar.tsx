import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import type { MockTask } from '../../../data/tasks.mock';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing } from '../../../constants/spacing';

// Map current status → what the primary CTA should be (assignee/employee flow)
const STATUS_CTA: Record<
  MockTask['status'],
  { label: string; icon: keyof typeof Feather.glyphMap; nextStatus: MockTask['status'] | null; color: string } | null
> = {
  PENDING:      { label: 'Accept Task',         icon: 'check-circle',    nextStatus: 'ACCEPTED',     color: Colors.semantic.success },
  ACCEPTED:     { label: 'Start Working',        icon: 'zap',             nextStatus: 'IN_PROGRESS',  color: Colors.status.inProgress.text },
  IN_PROGRESS:  { label: 'Submit for Review',    icon: 'upload',          nextStatus: 'UNDER_REVIEW', color: Colors.brand.primary },
  UNDER_REVIEW: { label: 'Awaiting review…',     icon: 'clock',           nextStatus: null,           color: Colors.text.tertiary },
  COMPLETED:    null,
  CANCELLED:    null,
};

type Props = {
  task: MockTask;
  /** When true, renders the admin creator approval bar (Approve & Complete / Revise) */
  isAdminCreator?: boolean;
  onStatusChange: (task: MockTask, nextStatus: MockTask['status']) => void;
  onApprove?: (task: MockTask) => void;
  onRevise?: (task: MockTask) => void;
  onUploadProof: (task: MockTask) => void;
  onAddComment: (task: MockTask) => void;
};

export const TaskActionBar = React.memo(
  ({ task, isAdminCreator = false, onStatusChange, onApprove, onRevise, onUploadProof, onAddComment }: Props) => {
    const insets = useSafeAreaInsets();
    const pb = insets.bottom + Spacing[2];

    // ── Admin creator approval bar (UNDER_REVIEW only) ──────────────────────
    if (isAdminCreator && task.status === 'UNDER_REVIEW') {
      return (
        <View style={[actionStyles.bar, { paddingBottom: pb }]}>
          {/* Revise button */}
          <Pressable
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRevise?.(task);
            }}
            style={({ pressed }) => [
              actionStyles.reviseBtn,
              pressed && { opacity: 0.78 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Request revision"
          >
            <Feather name="rotate-ccw" size={16} color="#B45309" />
            <Text style={actionStyles.reviseLabel}>Revise</Text>
          </Pressable>

          {/* Approve & Complete button */}
          <Pressable
            onPress={async () => {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onApprove?.(task);
            }}
            style={({ pressed }) => [
              actionStyles.approveBtn,
              pressed && { opacity: 0.87 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Approve and complete"
          >
            <Feather name="check" size={17} color="#FFFFFF" />
            <Text style={actionStyles.approveLabel}>Approve &amp; Complete</Text>
          </Pressable>
        </View>
      );
    }

    const cta = STATUS_CTA[task.status];

    // ── Completed / Cancelled closed bar ────────────────────────────────────
    if (!cta) {
      return (
        <View style={[actionStyles.bar, { paddingBottom: pb }]}>
          <View style={actionStyles.closedRow}>
            <View style={actionStyles.closedIcon}>
              <Feather
                name={task.status === 'COMPLETED' ? 'check-circle' : 'x-circle'}
                size={20}
                color={task.status === 'COMPLETED' ? Colors.semantic.success : Colors.text.tertiary}
              />
            </View>
            <Text style={actionStyles.closedText}>
              {task.status === 'COMPLETED' ? 'Task Completed' : 'Task Cancelled'}
            </Text>
          </View>
        </View>
      );
    }

    // ── "Awaiting review" read-only state for assignee ───────────────────────
    if (task.status === 'UNDER_REVIEW') {
      return (
        <View style={[actionStyles.bar, { paddingBottom: pb }]}>
          <View style={actionStyles.closedRow}>
            <Feather name="clock" size={18} color={Colors.text.tertiary} />
            <Text style={actionStyles.closedText}>Waiting for review…</Text>
          </View>
        </View>
      );
    }

    // ── Standard assignee action bar ─────────────────────────────────────────
    return (
      <View style={[actionStyles.bar, { paddingBottom: pb }]}>
        {/* Secondary: Upload Proof */}
        <Pressable
          onPress={async () => {
            await Haptics.selectionAsync();
            onUploadProof(task);
          }}
          style={({ pressed }) => [actionStyles.secondaryBtn, pressed && { opacity: 0.75 }]}
          accessibilityLabel="Upload proof"
        >
          <Feather name="paperclip" size={18} color={Colors.text.secondary} />
        </Pressable>

        {/* Secondary: Add Comment */}
        <Pressable
          onPress={async () => {
            await Haptics.selectionAsync();
            onAddComment(task);
          }}
          style={({ pressed }) => [actionStyles.secondaryBtn, pressed && { opacity: 0.75 }]}
          accessibilityLabel="Add comment"
        >
          <Feather name="message-circle" size={18} color={Colors.text.secondary} />
        </Pressable>

        {/* Primary CTA */}
        <Pressable
          onPress={async () => {
            if (!cta.nextStatus) return;
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onStatusChange(task, cta.nextStatus);
          }}
          style={({ pressed }) => [
            actionStyles.primaryBtn,
            { backgroundColor: cta.color },
            pressed && { opacity: 0.87 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={cta.label}
        >
          <Feather name={cta.icon} size={18} color={Colors.text.inverse} />
          <Text style={actionStyles.primaryLabel}>{cta.label}</Text>
        </Pressable>
      </View>
    );
  },
);

TaskActionBar.displayName = 'TaskActionBar';

const actionStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    backgroundColor: Colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: Colors.surface.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 8 },
    }),
  },
  secondaryBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.surface.background,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    height: 52,
    borderRadius: 12,
  },
  primaryLabel: {
    ...Typography.labelLg,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.inverse,
  },
  closedRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    height: 52,
  },
  closedIcon: { opacity: 0.8 },
  closedText: {
    ...Typography.labelLg,
    fontFamily: 'Inter-Medium',
    color: Colors.text.tertiary,
  },
  // Admin creator approval layout
  reviseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    width: 110,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
  },
  reviseLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#B45309',
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    height: 52,
    borderRadius: 12,
    backgroundColor: '#16A34A',
  },
  approveLabel: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});
