/**
 * OrgSuspendConfirmModal — centered dialog, SA "User detail" Manage →
 * Suspend/Reactivate account. Mirrors components/team/SuspendConfirmModal.tsx
 * (screen 38) but typed to OrgUser and handles both directions via `mode` —
 * suspend and reactivate are mirror actions on the same dialog shape, so one
 * generalized component avoids a near-duplicate file.
 */

import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { OrgUser } from '../../hooks/useOrgDirectory';
import { useColors } from '../../constants/colors';

type Mode = 'SUSPEND' | 'REACTIVATE';

type Props = {
  user: OrgUser | null;
  mode: Mode;
  visible: boolean;
  onConfirm: (user: OrgUser) => Promise<void>;
  onDismiss: () => void;
};

const COPY: Record<Mode, { icon: React.ComponentProps<typeof Feather>['name']; iconBg: string; iconColor: string; body: React.ReactNode; btnBg: string; btnLabel: string }> = {
  SUSPEND: {
    icon: 'user-x',
    iconBg: '#FFFBEB',
    iconColor: '#B45309',
    body: (
      <>
        They'll be <Text style={{ fontFamily: 'Inter-SemiBold', color: '#B45309' }}>logged out immediately</Text> and
        lose app access until reactivated. Their task history is preserved.
      </>
    ),
    btnBg: '#D97706',
    btnLabel: 'Suspend account',
  },
  REACTIVATE: {
    icon: 'user-check',
    iconBg: '#F0FDF4',
    iconColor: '#15803D',
    body: (
      <>
        They'll <Text style={{ fontFamily: 'Inter-SemiBold', color: '#15803D' }}>regain app access</Text> immediately
        and can sign in with their existing credentials.
      </>
    ),
    btnBg: '#16A34A',
    btnLabel: 'Reactivate account',
  },
};

export const OrgSuspendConfirmModal = React.memo(({ user, mode, visible, onConfirm, onDismiss }: Props) => {
  const colors = useColors();
  const [loading, setLoading] = useState(false);
  const copy = COPY[mode];

  const handleConfirm = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      await onConfirm(user);
    } finally {
      setLoading(false);
    }
  }, [user, onConfirm]);

  if (!user) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      <Pressable style={s.scrim} onPress={onDismiss} />
      <View style={s.overlay} pointerEvents="box-none">
        <View style={[s.dialog, { backgroundColor: colors.surface.card }]}>
          <View style={[s.iconCircle, { backgroundColor: copy.iconBg }]}>
            <Feather name={copy.icon} size={28} color={copy.iconColor} />
          </View>

          <Text style={[s.title, { color: colors.text.primary }]}>
            {mode === 'SUSPEND' ? 'Suspend' : 'Reactivate'} {user.name}?
          </Text>

          <Text style={[s.body, { color: '#64748B' }]}>{copy.body}</Text>

          <View style={[s.userRow, { backgroundColor: '#F8FAFC', borderColor: '#EEF2F7' }]}>
            <View style={[s.userAvatar, { backgroundColor: user.avatarBg }]}>
              <Text style={[s.userAvatarText, { color: user.avatarText }]}>{user.initials}</Text>
            </View>
            <View style={s.userInfo}>
              <Text style={[s.userName, { color: colors.text.primary }]}>{user.name}</Text>
              <Text style={[s.userMeta, { color: colors.text.tertiary }]}>
                {user.designation} · {user.staffId}
              </Text>
            </View>
          </View>

          <View style={s.actions}>
            <Pressable
              onPress={handleConfirm}
              disabled={loading}
              style={({ pressed }) => [s.confirmBtn, { backgroundColor: copy.btnBg }, pressed && { opacity: 0.88 }]}
              accessibilityRole="button"
              accessibilityLabel={copy.btnLabel}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={s.confirmBtnText}>{copy.btnLabel}</Text>}
            </Pressable>

            <Pressable
              onPress={onDismiss}
              disabled={loading}
              style={({ pressed }) => [s.cancelBtn, { borderColor: colors.surface.border, backgroundColor: colors.surface.card }, pressed && { opacity: 0.8 }]}
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

OrgSuspendConfirmModal.displayName = 'OrgSuspendConfirmModal';

const s = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.50)' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  dialog: { width: '100%', borderRadius: 20, padding: 24, paddingTop: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 40, elevation: 24 },
  iconCircle: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  title: { fontSize: 19, fontFamily: 'Inter-SemiBold', letterSpacing: 0, textAlign: 'center', marginTop: 16 },
  body: { fontSize: 13.5, fontFamily: 'Inter-Regular', lineHeight: 21, textAlign: 'center', marginTop: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 18, borderRadius: 12, borderWidth: 1, padding: 12, paddingHorizontal: 14 },
  userAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  userAvatarText: { fontSize: 12, fontFamily: 'Inter-Bold', letterSpacing: 0 },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 13, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  userMeta: { fontSize: 11.5, fontFamily: 'Inter-Regular', letterSpacing: 0, marginTop: 1 },
  actions: { gap: 10, marginTop: 22 },
  confirmBtn: { height: 50, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFFFFF', letterSpacing: 0 },
  cancelBtn: { height: 50, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
});
