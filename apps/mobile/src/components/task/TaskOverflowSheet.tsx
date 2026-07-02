import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import type { TaskStatus } from '@godigitify/types';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

export type OverflowAction =
  | 'view'
  | 'accept'
  | 'mark_progress'
  | 'submit_review'
  | 'mark_complete'
  | 'upload_proof'
  | 'add_comment'
  | 'share'
  | 'delete';

/** Minimal shape the overflow sheet needs from a task */
export type TaskOverflowItem = {
  id: string;
  title: string;
  status: TaskStatus;
};

type ActionDef = {
  id: OverflowAction;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color?: string;
  danger?: boolean;
  showFor?: Array<TaskStatus>;
  hideFor?: Array<TaskStatus>;
};

type Props = {
  visible: boolean;
  task: TaskOverflowItem | null;
  onAction: (action: OverflowAction, task: TaskOverflowItem) => void;
  onClose: () => void;
};

export const TaskOverflowSheet = ({ visible, task, onAction, onClose }: Props) => {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const ACTIONS: ActionDef[] = [
    { id: 'view',           label: 'View Details',      icon: 'eye' },
    { id: 'accept',         label: 'Accept Task',       icon: 'check-circle',   color: colors.semantic.success,       showFor: ['PENDING'] },
    { id: 'mark_progress',  label: 'Mark In Progress',  icon: 'zap',            color: colors.status.inProgress.text, showFor: ['ACCEPTED'] },
    { id: 'submit_review',  label: 'Submit for Review', icon: 'upload',         color: colors.brand.primary,          showFor: ['IN_PROGRESS'] },
    { id: 'mark_complete',  label: 'Mark Complete',     icon: 'check-square',   color: colors.semantic.success,       showFor: ['UNDER_REVIEW'] },
    { id: 'upload_proof',   label: 'Upload Proof',      icon: 'paperclip',      hideFor: ['COMPLETED', 'CANCELLED'] },
    { id: 'add_comment',    label: 'Add Comment',       icon: 'message-circle', hideFor: ['COMPLETED', 'CANCELLED'] },
    { id: 'share',          label: 'Share Task',        icon: 'share-2' },
    { id: 'delete',         label: 'Delete Task',       icon: 'trash-2',        danger: true },
  ];

  if (!task) return null;

  const visibleActions = ACTIONS.filter((a) => {
    if (a.showFor && !a.showFor.includes(task.status)) return false;
    if (a.hideFor && a.hideFor.includes(task.status)) return false;
    return true;
  });

  const handleAction = async (action: OverflowAction) => {
    await Haptics.selectionAsync();
    onAction(action, task);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={[s.backdrop, { backgroundColor: colors.surface.overlay }]}
        onPress={onClose}
      >
        <Pressable
          style={[s.panel, { backgroundColor: colors.surface.card, paddingBottom: insets.bottom + Spacing[2] }]}
        >
          {/* Handle */}
          <View style={[s.handle, { backgroundColor: colors.surface.borderStrong }]} />

          {/* Task title context */}
          <View style={[s.context, { borderBottomColor: colors.surface.border }]}>
            <Feather name="file-text" size={14} color={colors.text.tertiary} />
            <Text style={[s.contextText, { color: colors.text.tertiary }]} numberOfLines={1}>
              {task.title}
            </Text>
          </View>

          {/* Actions */}
          <View style={s.list}>
            {visibleActions.map((action, idx) => (
              <React.Fragment key={action.id}>
                {action.danger && idx > 0 && (
                  <View style={[s.divider, { backgroundColor: colors.surface.border }]} />
                )}
                <Pressable
                  onPress={() => handleAction(action.id)}
                  style={({ pressed }) => [
                    s.item,
                    pressed && { backgroundColor: colors.surface.background },
                  ]}
                  accessibilityRole="button"
                >
                  <View style={[
                    s.itemIcon,
                    { backgroundColor: action.danger ? colors.semantic.errorBg : (action.color ? `${action.color}18` : colors.surface.background) },
                  ]}>
                    <Feather
                      name={action.icon}
                      size={18}
                      color={action.danger ? colors.semantic.error : (action.color ?? colors.text.secondary)}
                    />
                  </View>
                  <Text style={[
                    s.itemLabel,
                    { color: action.danger ? colors.semantic.error : colors.text.primary },
                  ]}>
                    {action.label}
                  </Text>
                  <Feather name="chevron-right" size={16} color={colors.text.tertiary} />
                </Pressable>
              </React.Fragment>
            ))}
          </View>

          {/* Cancel */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              s.cancelBtn,
              { backgroundColor: colors.surface.background },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[s.cancelText, { color: colors.text.secondary }]}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  panel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing[4],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing[3],
    marginBottom: Spacing[3],
  },
  context: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[2],
    marginBottom: Spacing[2],
    borderBottomWidth: 1,
  },
  contextText: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  list: { gap: 2 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[1],
    borderRadius: 10,
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: Spacing[2],
  },
  cancelBtn: {
    marginTop: Spacing[2],
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  cancelText: {
    ...Typography.labelLg,
    fontFamily: 'Inter-SemiBold',
  },
});
