import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import type { MockTask } from '../../data/tasks.mock';
import { Colors } from '../../constants/colors';
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

type ActionDef = {
  id: OverflowAction;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color?: string;
  danger?: boolean;
  showFor?: Array<MockTask['status']>;
  hideFor?: Array<MockTask['status']>;
};

const ACTIONS: ActionDef[] = [
  { id: 'view',           label: 'View Details',    icon: 'eye' },
  { id: 'accept',         label: 'Accept Task',     icon: 'check-circle',   color: Colors.semantic.success, showFor: ['PENDING'] },
  { id: 'mark_progress',  label: 'Mark In Progress',icon: 'zap',            color: Colors.status.inProgress.text, showFor: ['ACCEPTED'] },
  { id: 'submit_review',  label: 'Submit for Review', icon: 'upload',       color: Colors.brand.primary, showFor: ['IN_PROGRESS'] },
  { id: 'mark_complete',  label: 'Mark Complete',   icon: 'check-square',   color: Colors.semantic.success, showFor: ['UNDER_REVIEW'] },
  { id: 'upload_proof',   label: 'Upload Proof',    icon: 'paperclip',      hideFor: ['COMPLETED', 'CANCELLED'] },
  { id: 'add_comment',    label: 'Add Comment',     icon: 'message-circle', hideFor: ['COMPLETED', 'CANCELLED'] },
  { id: 'share',          label: 'Share Task',      icon: 'share-2' },
  { id: 'delete',         label: 'Delete Task',     icon: 'trash-2',        danger: true },
];

type Props = {
  visible: boolean;
  task: MockTask | null;
  onAction: (action: OverflowAction, task: MockTask) => void;
  onClose: () => void;
};

export const TaskOverflowSheet = ({ visible, task, onAction, onClose }: Props) => {
  const insets = useSafeAreaInsets();

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
      <Pressable style={sheet.backdrop} onPress={onClose}>
        <Pressable style={[sheet.panel, { paddingBottom: insets.bottom + Spacing[2] }]}>
          {/* Handle */}
          <View style={sheet.handle} />

          {/* Task title context */}
          <View style={sheet.context}>
            <Feather name="file-text" size={14} color={Colors.text.tertiary} />
            <Text style={sheet.contextText} numberOfLines={1}>
              {task.title}
            </Text>
          </View>

          {/* Actions */}
          <View style={sheet.list}>
            {visibleActions.map((action, idx) => (
              <React.Fragment key={action.id}>
                {action.danger && idx > 0 && <View style={sheet.divider} />}
                <Pressable
                  onPress={() => handleAction(action.id)}
                  style={({ pressed }) => [sheet.item, pressed && sheet.itemPressed]}
                  accessibilityRole="button"
                >
                  <View style={[
                    sheet.itemIcon,
                    action.danger && sheet.itemIconDanger,
                    action.color && !action.danger ? { backgroundColor: `${action.color}18` } : null,
                  ]}>
                    <Feather
                      name={action.icon}
                      size={18}
                      color={action.danger ? Colors.semantic.error : (action.color ?? Colors.text.secondary)}
                    />
                  </View>
                  <Text style={[sheet.itemLabel, action.danger && sheet.itemLabelDanger]}>
                    {action.label}
                  </Text>
                  <Feather name="chevron-right" size={16} color={Colors.text.tertiary} />
                </Pressable>
              </React.Fragment>
            ))}
          </View>

          {/* Cancel */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [sheet.cancelBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={sheet.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const sheet = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.surface.overlay,
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: Colors.surface.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing[4],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surface.borderStrong,
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
    borderBottomColor: Colors.surface.border,
  },
  contextText: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
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
  itemPressed: { backgroundColor: Colors.surface.background },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surface.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconDanger: { backgroundColor: Colors.semantic.errorBg },
  itemLabel: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
    flex: 1,
  },
  itemLabelDanger: { color: Colors.semantic.error },
  divider: {
    height: 1,
    backgroundColor: Colors.surface.border,
    marginVertical: Spacing[2],
  },
  cancelBtn: {
    marginTop: Spacing[2],
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface.background,
    borderRadius: 12,
  },
  cancelText: {
    ...Typography.labelLg,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.secondary,
  },
});
