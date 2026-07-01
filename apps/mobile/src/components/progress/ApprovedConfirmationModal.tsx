/**
 * ApprovedConfirmationModal — centered success dialog shown after a task
 * submission is approved. Matches the HTML reference "Task approved" screen.
 */
import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Avatar } from '../ui/Avatar';
import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

type Props = {
  visible: boolean;
  taskTitle: string;
  assigneeName: string;
  onDone: () => void;
  onBackToQueue?: () => void;
};

export const ApprovedConfirmationModal = React.memo(
  ({ visible, taskTitle, assigneeName, onDone, onBackToQueue }: Props) => {
    const colors = useColors();

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
        <View style={[styles.overlay, { backgroundColor: colors.surface.overlay }]}>
          <View style={[styles.dialog, { backgroundColor: colors.surface.card }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.semantic.successBg }]}>
              <Feather name="check" size={30} color={colors.semantic.success} />
            </View>

            <Text style={[styles.title, { color: colors.text.primary }]}>Task approved</Text>
            <Text style={[styles.message, { color: colors.text.secondary }]}>
              <Text style={{ fontFamily: 'Inter-SemiBold', color: colors.text.primary }}>{taskTitle}</Text>
              {' is now marked Completed.'}
            </Text>

            <View style={[styles.summaryRow, { backgroundColor: colors.surface.background, borderColor: colors.surface.border }]}>
              <Avatar name={assigneeName} size={34} />
              <View style={styles.summaryTextCol}>
                <Text style={[styles.summaryTitle, { color: colors.text.primary }]}>{assigneeName} notified</Text>
                <Text style={[styles.summarySubtitle, { color: colors.text.tertiary }]}>Completion push sent · just now</Text>
              </View>
              <View style={[styles.statusChip, { backgroundColor: colors.status.completed.bg }]}>
                <Text style={[styles.statusChipText, { color: colors.status.completed.text }]}>COMPLETED</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={onDone}
                style={({ pressed }) => [styles.doneBtn, { backgroundColor: colors.brand.primary }, pressed && { opacity: 0.87 }]}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                <Text style={styles.doneLabel}>Done</Text>
              </Pressable>
              {onBackToQueue && (
                <Pressable
                  onPress={onBackToQueue}
                  style={({ pressed }) => [styles.queueBtn, { borderColor: colors.surface.border }, pressed && { opacity: 0.75 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Back to review queue"
                >
                  <Text style={[styles.queueLabel, { color: colors.text.secondary }]}>Back to review queue</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

ApprovedConfirmationModal.displayName = 'ApprovedConfirmationModal';

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing[8] },
  dialog: {
    width: '100%',
    borderRadius: 20,
    padding: Spacing[6],
    paddingTop: Spacing[7],
    alignItems: 'center',
  },
  iconCircle: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center' },
  title: { ...Typography.h3, fontFamily: 'Inter-SemiBold', textAlign: 'center', marginTop: Spacing[4] },
  message: { ...Typography.bodyMd, fontFamily: 'Inter-Regular', textAlign: 'center', marginTop: Spacing[2], lineHeight: 21 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing[3] + 1,
    marginTop: Spacing[5],
  },
  summaryTextCol: { flex: 1, gap: 1, minWidth: 0 },
  summaryTitle: { ...Typography.labelLg, fontFamily: 'Inter-SemiBold' },
  summarySubtitle: { ...Typography.captionSm, fontFamily: 'Inter-Regular' },
  statusChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, flexShrink: 0 },
  statusChipText: { ...Typography.labelSm, fontFamily: 'Inter-Bold', letterSpacing: 0.3 },
  actions: { width: '100%', gap: Spacing[3], marginTop: Spacing[6] },
  doneBtn: { height: 50, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  doneLabel: { ...Typography.labelLg, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
  queueBtn: { height: 50, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  queueLabel: { ...Typography.labelLg, fontFamily: 'Inter-SemiBold' },
});
