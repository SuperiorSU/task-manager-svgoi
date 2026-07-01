/**
 * RevisionReasonSheet — bottom sheet for sending a task submission back for
 * revision: quick-reason chips, a feedback textarea, and a notify note.
 * Matches the HTML reference "Request Revision" screen.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ProgressNote } from './ProgressNote';
import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';
import { REVISION_NOTE_MAX_LENGTH } from '../../constants/reviewReasons';

type Props = {
  visible: boolean;
  assigneeName: string;
  reasons: string[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (note: string) => void;
};

export const RevisionReasonSheet = React.memo(
  ({ visible, assigneeName, reasons, loading, onClose, onSubmit }: Props) => {
    const colors = useColors();
    const [note, setNote] = useState('');

    useEffect(() => {
      if (visible) setNote('');
    }, [visible]);

    const toggleReason = useCallback(async (reason: string) => {
      await Haptics.selectionAsync();
      setNote((prev) => {
        if (prev.includes(reason)) return prev;
        return prev.trim() ? `${prev.trim()} ${reason}. ` : `${reason}. `;
      });
    }, []);

    const handleSubmit = useCallback(() => {
      onSubmit(note.trim());
    }, [note, onSubmit]);

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.overlay, { backgroundColor: colors.surface.overlay }]}
        >
          <View style={[styles.sheet, { backgroundColor: colors.surface.card }]}>
            <View style={[styles.handle, { backgroundColor: colors.surface.border }]} />

            <View style={styles.headerRow}>
              <View style={[styles.iconWrap, { backgroundColor: colors.status.inProgress.bg }]}>
                <Feather name="rotate-ccw" size={22} color={colors.status.inProgress.text} />
              </View>
              <View style={styles.headerTextCol}>
                <Text style={[styles.title, { color: colors.text.primary }]}>Request revision</Text>
                <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                  Sends back to {assigneeName} · returns to In Progress
                </Text>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>Reason</Text>
            <View style={styles.chipsRow}>
              {reasons.map((reason) => {
                const selected = note.includes(reason);
                return (
                  <Pressable
                    key={reason}
                    onPress={() => toggleReason(reason)}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: selected ? colors.status.inProgress.bg : colors.surface.card,
                        borderColor: selected ? '#FCD34D' : colors.surface.border,
                      },
                      pressed && { opacity: 0.78 },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.chipText, { color: selected ? colors.status.inProgress.text : colors.text.secondary }]}>
                      {reason}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, { color: colors.text.tertiary, marginTop: Spacing[5] }]}>
              Feedback to {assigneeName.split(' ')[0]}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface.background, borderColor: colors.brand.primary, color: colors.text.primary }]}
              placeholder="Explain what needs to change before this can be approved…"
              placeholderTextColor={colors.text.tertiary}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={REVISION_NOTE_MAX_LENGTH}
            />
            <Text style={[styles.charCount, { color: colors.text.tertiary }]}>
              {note.length} / {REVISION_NOTE_MAX_LENGTH}
            </Text>

            <ProgressNote
              icon="bell"
              iconColor={colors.priority.critical.text}
              backgroundColor={colors.priority.critical.bg}
              text={`${assigneeName.split(' ')[0]} will be notified immediately`}
              textColor={colors.priority.critical.text}
            />

            <View style={styles.actions}>
              <Pressable
                onPress={handleSubmit}
                disabled={loading || !note.trim()}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: colors.status.inProgress.solid },
                  pressed && { opacity: 0.87 },
                  (loading || !note.trim()) && styles.disabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Send back for revision"
              >
                <Feather name="corner-up-left" size={17} color="#FFFFFF" />
                <Text style={styles.submitLabel}>{loading ? 'Sending…' : 'Send back for revision'}</Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  { borderColor: colors.surface.border },
                  pressed && { opacity: 0.75 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={[styles.cancelLabel, { color: colors.text.secondary }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  },
);

RevisionReasonSheet.displayName = 'RevisionReasonSheet';

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: Spacing[5],
    paddingTop: Spacing[3],
    gap: Spacing[3],
  },
  handle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: Spacing[2] },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerTextCol: { flex: 1, gap: 2 },
  title: { ...Typography.h3, fontFamily: 'Inter-SemiBold' },
  subtitle: { ...Typography.bodySm, fontFamily: 'Inter-Regular' },
  sectionLabel: {
    ...Typography.labelSm,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { ...Typography.bodySm, fontFamily: 'Inter-SemiBold' },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: Spacing[3],
    minHeight: 96,
    textAlignVertical: 'top',
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
  },
  charCount: { ...Typography.captionSm, fontFamily: 'Inter-Regular', textAlign: 'right', marginTop: -Spacing[2] },
  actions: { gap: Spacing[3], marginTop: Spacing[2], paddingBottom: Spacing[2] },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing[2],
  },
  submitLabel: { ...Typography.labelLg, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
  disabled: { opacity: 0.6 },
  cancelBtn: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: { ...Typography.labelLg, fontFamily: 'Inter-SemiBold' },
});
