/**
 * ArchiveDepartmentModal — centered dialog, SA "Archive department" (HTML
 * screen 56e). Mirrors OrgSuspendConfirmModal's dialog shape but single-mode
 * (archive only — no restore UI in this pass, see plan) with the design's
 * specific dept-summary row + advisory (non-blocking) active-tasks warning.
 */

import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';

type Department = {
  name: string;
  code: string;
  memberCount: number;
  activeTaskCount: number;
};

type Props = {
  department: Department | null;
  visible: boolean;
  onConfirm: () => Promise<void>;
  onDismiss: () => void;
};

export const ArchiveDepartmentModal = React.memo(({ department, visible, onConfirm, onDismiss }: Props) => {
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

  if (!department) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      <Pressable style={s.scrim} onPress={onDismiss} />
      <View style={s.overlay} pointerEvents="box-none">
        <View style={[s.dialog, { backgroundColor: colors.surface.card }]}>
          <View style={[s.iconCircle, { backgroundColor: '#FEF2F2' }]}>
            <Feather name="archive" size={28} color="#DC2626" />
          </View>

          <Text style={[s.title, { color: colors.text.primary }]}>Archive {department.name}?</Text>

          <Text style={[s.body, { color: '#64748B' }]}>
            The department will be{' '}
            <Text style={{ fontFamily: 'Inter-SemiBold', color: '#DC2626' }}>hidden and locked</Text>. No new tasks
            can be created. Members and history are preserved and it can be restored later.
          </Text>

          <View style={[s.summaryRow, { backgroundColor: '#F8FAFC', borderColor: '#EEF2F7' }]}>
            <View style={[s.summaryIcon, { backgroundColor: '#CCFBF1' }]}>
              <Feather name="briefcase" size={16} color="#0D9488" />
            </View>
            <View style={s.summaryInfo}>
              <Text style={[s.summaryTitle, { color: colors.text.primary }]}>
                {department.name} · {department.code}
              </Text>
              <Text style={[s.summaryMeta, { color: colors.text.tertiary }]}>
                {department.memberCount} members · {department.activeTaskCount} active tasks
              </Text>
            </View>
          </View>

          {department.activeTaskCount > 0 && (
            <View style={[s.warningRow, { backgroundColor: '#FFFBEB', borderColor: '#FDE9C8' }]}>
              <Feather name="alert-triangle" size={15} color="#B45309" />
              <Text style={[s.warningText, { color: '#92400E' }]}>
                {department.activeTaskCount} active task{department.activeTaskCount === 1 ? '' : 's'} will be
                frozen. Reassign or close them first if needed.
              </Text>
            </View>
          )}

          <View style={s.actions}>
            <Pressable
              onPress={handleConfirm}
              disabled={loading}
              style={({ pressed }) => [s.confirmBtn, { backgroundColor: '#DC2626' }, pressed && { opacity: 0.88 }]}
              accessibilityRole="button"
              accessibilityLabel="Archive department"
            >
              {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={s.confirmBtnText}>Archive department</Text>}
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

ArchiveDepartmentModal.displayName = 'ArchiveDepartmentModal';

const s = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.50)' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  dialog: { width: '100%', borderRadius: 20, padding: 24, paddingTop: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 40, elevation: 24 },
  iconCircle: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  title: { fontSize: 19, fontFamily: 'Inter-SemiBold', letterSpacing: 0, textAlign: 'center', marginTop: 16 },
  body: { fontSize: 13.5, fontFamily: 'Inter-Regular', lineHeight: 21, textAlign: 'center', marginTop: 8 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 18, borderRadius: 12, borderWidth: 1, padding: 12, paddingHorizontal: 14 },
  summaryIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  summaryInfo: { flex: 1, minWidth: 0 },
  summaryTitle: { fontSize: 13, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  summaryMeta: { fontSize: 11.5, fontFamily: 'Inter-Regular', letterSpacing: 0, marginTop: 1 },
  warningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 12, borderRadius: 12, borderWidth: 1, padding: 12, paddingHorizontal: 13 },
  warningText: { flex: 1, fontSize: 12, fontFamily: 'Inter-Regular', lineHeight: 17 },
  actions: { gap: 10, marginTop: 20 },
  confirmBtn: { height: 50, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFFFFF', letterSpacing: 0 },
  cancelBtn: { height: 50, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
});
