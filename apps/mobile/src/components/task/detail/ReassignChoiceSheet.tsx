import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../../constants/colors';
import { Spacing } from '../../../constants/spacing';

type Props = {
  visible: boolean;
  /** Current assignee's name — used to make each outcome concrete. */
  assigneeName: string;
  /** Human-readable current status, e.g. "In progress". */
  statusLabel: string;
  onMove: () => void;
  onDuplicate: () => void;
  onClose: () => void;
};

/**
 * Shown only when a task is already mid-flight (accepted / in progress / under
 * review) and an Admin taps Reassign. A PENDING task has no work to preserve,
 * so it skips this and goes straight to the picker.
 *
 * The choice exists because "reassign" is two different intents:
 *  - Move      → one owner changes; progress resets (FR-17: the new assignee
 *                must accept). Single assignee only — 8_overview.md §11.
 *  - Duplicate → the current assignee keeps their work; independent copies go
 *                to one or more other people (FR-23, the documented
 *                multi-assignee mitigation).
 */
export const ReassignChoiceSheet = ({
  visible,
  assigneeName,
  statusLabel,
  onMove,
  onDuplicate,
  onClose,
}: Props) => {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable
          style={[s.sheet, { backgroundColor: colors.surface.card, paddingBottom: insets.bottom + Spacing[4] }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[s.handle, { backgroundColor: colors.surface.border }]} />
          <Text style={[s.title, { color: colors.text.primary }]}>Reassign this task</Text>
          <Text style={[s.subtitle, { color: colors.text.tertiary }]}>
            {assigneeName} is on it ({statusLabel}). Choose how to hand it off.
          </Text>

          <Option
            icon="user-check"
            iconBg={colors.brand.primaryLight}
            iconColor={colors.brand.primary}
            title="Move to someone else"
            body="Status resets to Pending for the new assignee to accept. Uploaded proof stays attached."
            onPress={onMove}
            colors={colors}
          />

          <Option
            icon="copy"
            iconBg={colors.semantic.successBg}
            iconColor={colors.semantic.success}
            title="Duplicate instead"
            body={`${assigneeName} keeps this task. You get an editable copy to assign to others.`}
            onPress={onDuplicate}
            colors={colors}
          />

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [s.cancelBtn, { borderColor: colors.surface.border }, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={[s.cancelText, { color: colors.text.secondary }]}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

function Option({
  icon, iconBg, iconColor, title, body, onPress, colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  body: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.option,
        { borderColor: colors.surface.border, backgroundColor: colors.surface.background },
        pressed && { opacity: 0.85 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[s.optionIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={18} color={iconColor} />
      </View>
      <View style={s.optionText}>
        <Text style={[s.optionTitle, { color: colors.text.primary }]}>{title}</Text>
        <Text style={[s.optionBody, { color: colors.text.tertiary }]}>{body}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.text.tertiary} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.5)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 10 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  title: { fontSize: 17, fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  subtitle: { fontSize: 12.5, fontFamily: 'Inter-Regular', textAlign: 'center', marginTop: 4, marginBottom: 18 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  optionIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optionText: { flex: 1, minWidth: 0, gap: 3 },
  optionTitle: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  optionBody: { fontSize: 11.5, fontFamily: 'Inter-Regular', lineHeight: 16 },
  cancelBtn: { height: 50, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  cancelText: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
});
