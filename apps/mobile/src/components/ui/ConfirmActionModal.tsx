import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';

// Generic centered confirm dialog — same visual/interaction pattern as
// SuspendConfirmModal / OrgSuspendConfirmModal / ArchiveDepartmentModal, just
// config-driven so any state-changing action (task approval, status change,
// account reactivation, settings save) can gate itself behind one "are you
// sure?" step without a bespoke modal per action.

type Props = {
  visible: boolean;
  icon: keyof typeof Feather.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  body: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void | Promise<void>;
  onDismiss: () => void;
  cancelLabel?: string;
};

export const ConfirmActionModal = React.memo(
  ({
    visible,
    icon,
    iconBg,
    iconColor,
    title,
    body,
    confirmLabel,
    confirmColor,
    onConfirm,
    onDismiss,
    cancelLabel = 'Cancel',
  }: Props) => {
    const colors = useColors();
    const [loading, setLoading] = useState(false);

    const handleConfirm = useCallback(async () => {
      setLoading(true);
      try {
        await onConfirm();
      } finally {
        setLoading(false);
      }
    }, [onConfirm]);

    return (
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
        <Pressable style={s.scrim} onPress={onDismiss} />
        <View style={s.overlay} pointerEvents="box-none">
          <View style={[s.dialog, { backgroundColor: colors.surface.card }]}>
            <View style={[s.iconCircle, { backgroundColor: iconBg }]}>
              <Feather name={icon} size={28} color={iconColor} />
            </View>

            <Text style={[s.title, { color: colors.text.primary }]}>{title}</Text>
            <Text style={[s.body, { color: colors.text.secondary }]}>{body}</Text>

            <View style={s.actions}>
              <Pressable
                onPress={handleConfirm}
                disabled={loading}
                style={({ pressed }) => [s.confirmBtn, { backgroundColor: confirmColor }, pressed && { opacity: 0.88 }]}
                accessibilityRole="button"
                accessibilityLabel={confirmLabel}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={s.confirmBtnText}>{confirmLabel}</Text>
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
                accessibilityLabel={cancelLabel}
              >
                <Text style={[s.cancelBtnText, { color: colors.text.secondary }]}>{cancelLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
);

ConfirmActionModal.displayName = 'ConfirmActionModal';

const s = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.50)' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
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
  iconCircle: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  title: { fontSize: 19, fontFamily: 'Inter-SemiBold', letterSpacing: 0, textAlign: 'center', marginTop: 16 },
  body: { fontSize: 13.5, fontFamily: 'Inter-Regular', lineHeight: 21, textAlign: 'center', marginTop: 8 },
  actions: { gap: 10, marginTop: 22 },
  confirmBtn: { height: 50, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFFFFF', letterSpacing: 0 },
  cancelBtn: { height: 50, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
});
