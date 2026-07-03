/**
 * OrgResetPasswordSheet — bottom sheet, SA "User detail" Manage → Reset
 * password. Mirrors components/team/ResetPasswordSheet.tsx's design exactly
 * (screen 39) but typed to OrgUser — forked rather than shared since
 * OrgUser's shape (avatarBg/avatarText, staffId) differs from TeamMember's
 * (avatarColor, employeeId), same tradeoff as useGovernanceReviewActions.
 */

import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { OrgUser } from '../../data/orgDirectory.mock';
import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

type Props = {
  user: OrgUser | null;
  visible: boolean;
  onConfirm: (user: OrgUser) => Promise<void>;
  onDismiss: () => void;
};

export const OrgResetPasswordSheet = React.memo(({ user, visible, onConfirm, onDismiss }: Props) => {
  const colors = useColors();
  const [loading, setLoading] = useState(false);

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
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onDismiss}>
      <Pressable style={s.scrim} onPress={onDismiss} />
      <View style={s.sheetWrap} pointerEvents="box-none">
        <View style={[s.sheet, { backgroundColor: colors.surface.card }]}>
          <View style={[s.handle, { backgroundColor: colors.surface.border }]} />

          <View style={s.headerRow}>
            <View style={[s.lockCircle, { backgroundColor: colors.brand.primaryLight }]}>
              <Feather name="lock" size={22} color={colors.brand.primary} />
            </View>
            <View style={s.headerText}>
              <Text style={[s.sheetTitle, { color: colors.text.primary }]}>Reset password</Text>
              <Text style={[s.sheetSub, { color: '#64748B' }]}>Sends a secure reset link by email</Text>
            </View>
          </View>

          <View style={[s.userRow, { backgroundColor: '#F8FAFC', borderColor: '#EEF2F7' }]}>
            <View style={[s.userAvatar, { backgroundColor: user.avatarBg }]}>
              <Text style={[s.userAvatarText, { color: user.avatarText }]}>{user.initials}</Text>
            </View>
            <View style={s.userInfo}>
              <Text style={[s.userName, { color: colors.text.primary }]}>{user.name}</Text>
              <Text style={[s.userEmail, { color: colors.text.tertiary }]}>{user.email}</Text>
            </View>
          </View>

          <View style={s.bullets}>
            <BulletItem colors={colors}>
              A 15-minute reset link is emailed to {user.name.split(' ')[0]}.
            </BulletItem>
            <BulletItem colors={colors}>All their active sessions are signed out.</BulletItem>
          </View>

          <View style={s.actions}>
            <Pressable
              onPress={handleConfirm}
              disabled={loading}
              style={({ pressed }) => [s.sendBtn, { backgroundColor: colors.brand.primary }, pressed && { opacity: 0.88 }]}
              accessibilityRole="button"
              accessibilityLabel="Send reset link"
            >
              {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={s.sendBtnText}>Send reset link</Text>}
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

OrgResetPasswordSheet.displayName = 'OrgResetPasswordSheet';

function BulletItem({ children, colors }: { children: React.ReactNode; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={s.bullet}>
      <View style={[s.bulletCircle, { backgroundColor: colors.brand.primaryLight }]}>
        <Feather name="check" size={13} color={colors.brand.primary} strokeWidth={2.6} />
      </View>
      <Text style={[s.bulletText, { color: colors.text.secondary }]}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.45)' },
  sheetWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: Spacing[5],
    paddingBottom: 26,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lockCircle: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerText: { flex: 1 },
  sheetTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  sheetSub: { fontSize: 12.5, fontFamily: 'Inter-Regular', marginTop: 2 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 18, borderRadius: 12, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 15 },
  userAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  userAvatarText: { fontSize: 12, fontFamily: 'Inter-Bold', letterSpacing: 0 },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 13, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  userEmail: { fontSize: 11.5, fontFamily: 'Inter-Regular', letterSpacing: 0, marginTop: 1 },
  bullets: { gap: 12, marginTop: 16 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  bulletCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  bulletText: { fontSize: 13, fontFamily: 'Inter-Regular', lineHeight: 19, flex: 1 },
  actions: { gap: 10, marginTop: 22 },
  sendBtn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFFFFF', letterSpacing: 0 },
  cancelBtn: { height: 50, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
});
