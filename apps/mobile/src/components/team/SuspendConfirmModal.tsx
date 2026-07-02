/**
 * SuspendConfirmModal — centered dialog (screen 38).
 *
 * Amber warning circle icon · "Suspend [Name]?"
 * "logged out immediately" warning · user summary row
 * [Suspend account] (amber) · [Cancel]
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { TeamMemberView } from '../../utils/teamMemberView';
import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  member: TeamMemberView | null;
  visible: boolean;
  onConfirm: (member: TeamMemberView) => Promise<void>;
  onDismiss: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const SuspendConfirmModal = React.memo(({ member, visible, onConfirm, onDismiss }: Props) => {
  const colors = useColors();
  const [loading, setLoading] = useState(false);

  const handleConfirm = useCallback(async () => {
    if (!member) return;
    setLoading(true);
    try {
      await onConfirm(member);
    } finally {
      setLoading(false);
    }
  }, [member, onConfirm]);

  if (!member) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      {/* Scrim */}
      <Pressable style={s.scrim} onPress={onDismiss} />

      {/* Dialog */}
      <View style={s.overlay} pointerEvents="box-none">
        <View style={[s.dialog, { backgroundColor: colors.surface.card }]}>
          {/* Warning icon circle */}
          <View style={[s.iconCircle, { backgroundColor: '#FFFBEB' }]}>
            <Feather name="user-x" size={28} color="#B45309" />
          </View>

          <Text style={[s.title, { color: colors.text.primary }]}>
            Suspend {member.name}?
          </Text>

          <Text style={[s.body, { color: '#64748B' }]}>
            They'll be{' '}
            <Text style={{ fontFamily: 'Inter-SemiBold', color: '#B45309' }}>
              logged out immediately
            </Text>{' '}
            and lose app access until reactivated. Their task history is preserved.
          </Text>

          {/* User summary row */}
          <View style={[s.userRow, { backgroundColor: '#F8FAFC', borderColor: '#EEF2F7' }]}>
            <View style={[s.userAvatar, { backgroundColor: member.avatarColor }]}>
              <Text style={s.userAvatarText}>{member.initials}</Text>
            </View>
            <View style={s.userInfo}>
              <Text style={[s.userName, { color: colors.text.primary }]}>{member.name}</Text>
              <Text style={[s.userMeta, { color: colors.text.tertiary }]}>
                {member.designation} · {member.employeeId}
              </Text>
            </View>
            {member.taskStats.assigned > 0 && (
              <Text style={[s.activeTasks, { color: colors.text.tertiary }]}>
                {member.taskStats.assigned} active tasks
              </Text>
            )}
          </View>

          {/* Actions */}
          <View style={s.actions}>
            <Pressable
              onPress={handleConfirm}
              disabled={loading}
              style={({ pressed }) => [
                s.suspendBtn,
                pressed && { opacity: 0.88 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Suspend account"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={s.suspendBtnText}>Suspend account</Text>
              )}
            </Pressable>

            <Pressable
              onPress={onDismiss}
              disabled={loading}
              style={({ pressed }) => [
                s.cancelBtn,
                { borderColor: colors.surface.border, backgroundColor: colors.surface.card },
                pressed && { opacity: 0.8 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={[s.cancelBtnText, { color: colors.text.secondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

SuspendConfirmModal.displayName = 'SuspendConfirmModal';

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.50)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  dialog: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    paddingTop: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 24,
  },
  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontSize: 19,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
    textAlign: 'center',
    marginTop: 16,
  },
  body: {
    fontSize: 13.5,
    fontFamily: 'Inter-Regular',
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 18,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    paddingHorizontal: 14,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatarText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  userMeta: {
    fontSize: 11.5,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
    marginTop: 1,
  },
  activeTasks: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    flexShrink: 0,
  },
  actions: {
    gap: 10,
    marginTop: 22,
  },
  suspendBtn: {
    height: 50,
    backgroundColor: '#D97706',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suspendBtnText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  cancelBtn: {
    height: 50,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
});
