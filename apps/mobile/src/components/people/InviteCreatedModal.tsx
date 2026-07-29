import React from 'react';
import { Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

type Props = {
  visible: boolean;
  memberName: string;
  /** Deep link the new member opens to set their password. */
  inviteLink: string;
  onClose: () => void;
};

/**
 * Shown right after an employee/admin is created. The account has NO usable
 * password until the member opens this setup link and sets one, so the whole
 * point of this sheet is to let the creating admin actually deliver that link
 * (there is no email transport wired — sharing is the delivery mechanism).
 */
export const InviteCreatedModal = ({ visible, memberName, inviteLink, onClose }: Props) => {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message:
          `You've been added to SVGOI Tasks. Open this link to set your password and sign in ` +
          `(expires in 7 days):\n\n${inviteLink}`,
      });
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={[s.sheet, { backgroundColor: colors.surface.card, paddingBottom: insets.bottom + Spacing[4] }]}>
          <View style={[s.handle, { backgroundColor: colors.surface.border }]} />

          <View style={[s.iconCircle, { backgroundColor: colors.semantic.successBg }]}>
            <Feather name="check" size={26} color={colors.semantic.success} />
          </View>

          <Text style={[s.title, { color: colors.text.primary }]}>Invite ready for {memberName}</Text>
          <Text style={[s.subtitle, { color: colors.text.tertiary }]}>
            Their account has no password yet. Share this setup link so they can create one and sign in — it
            expires in 7 days.
          </Text>

          <View style={[s.linkBox, { backgroundColor: colors.surface.background, borderColor: colors.surface.border }]}>
            <Feather name="link" size={14} color={colors.text.tertiary} />
            <Text style={[s.linkText, { color: colors.text.secondary }]} numberOfLines={2} selectable>
              {inviteLink}
            </Text>
          </View>

          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [s.shareBtn, { backgroundColor: colors.brand.primary }, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="Share setup link"
          >
            <Feather name="share-2" size={17} color="#FFFFFF" />
            <Text style={s.shareText}>Share setup link</Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [s.doneBtn, { borderColor: colors.surface.border }, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={[s.doneText, { color: colors.text.secondary }]}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.5)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 10, alignItems: 'center' },
  handle: { width: 36, height: 4, borderRadius: 2, marginBottom: 18 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 17, fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  subtitle: { fontSize: 12.5, fontFamily: 'Inter-Regular', textAlign: 'center', marginTop: 6, marginBottom: 18, lineHeight: 18, paddingHorizontal: 6 },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  linkText: { flex: 1, fontSize: 12, fontFamily: 'Inter-Regular' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    height: 50,
    borderRadius: 12,
  },
  shareText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
  doneBtn: { alignSelf: 'stretch', height: 48, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  doneText: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
});
