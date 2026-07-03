/**
 * OrgChangeRoleSheet — bottom sheet, SA "User detail" Manage → Change role.
 * Two selectable role rows (Admin/Employee) + explicit Confirm — role change
 * affects permissions org-wide (§8_overview.md §2 role hierarchy) so it gets
 * a confirm step rather than HeadPickerSheet's select-and-close pattern.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { OrgUser, OrgRole } from '../../hooks/useOrgDirectory';
import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

type Props = {
  user: OrgUser | null;
  visible: boolean;
  onConfirm: (user: OrgUser, role: OrgRole) => Promise<void>;
  onDismiss: () => void;
};

const ROLE_OPTIONS: { value: OrgRole; label: string; description: string; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { value: 'ADMIN', label: 'Admin', description: 'Manages a department — creates users, assigns tasks', icon: 'shield' },
  { value: 'EMPLOYEE', label: 'Employee', description: 'Operational staff — own tasks only', icon: 'user' },
];

export const OrgChangeRoleSheet = React.memo(({ user, visible, onConfirm, onDismiss }: Props) => {
  const colors = useColors();
  const [selected, setSelected] = useState<OrgRole | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) setSelected(user.role);
  }, [visible, user]);

  const handleConfirm = useCallback(async () => {
    if (!user || !selected) return;
    setLoading(true);
    try {
      await onConfirm(user, selected);
    } finally {
      setLoading(false);
    }
  }, [user, selected, onConfirm]);

  if (!user) return null;
  const unchanged = selected === user.role;

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onDismiss}>
      <Pressable style={s.scrim} onPress={onDismiss} />
      <View style={s.sheetWrap} pointerEvents="box-none">
        <View style={[s.sheet, { backgroundColor: colors.surface.card }]}>
          <View style={[s.handle, { backgroundColor: colors.surface.border }]} />

          <View style={s.headerRow}>
            <View style={[s.iconCircle, { backgroundColor: colors.brand.primaryLight }]}>
              <Feather name="shield" size={22} color={colors.brand.primary} />
            </View>
            <View style={s.headerText}>
              <Text style={[s.sheetTitle, { color: colors.text.primary }]}>Change role</Text>
              <Text style={[s.sheetSub, { color: '#64748B' }]}>{user.name}</Text>
            </View>
          </View>

          <View style={s.options}>
            {ROLE_OPTIONS.map((opt) => {
              const active = selected === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setSelected(opt.value)}
                  style={[
                    s.optionRow,
                    { borderColor: active ? colors.brand.primary : colors.surface.border, backgroundColor: active ? colors.brand.primaryLight : colors.surface.card },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                >
                  <View style={[s.optionIcon, { backgroundColor: active ? '#FFFFFF' : colors.surface.background }]}>
                    <Feather name={opt.icon} size={16} color={active ? colors.brand.primary : colors.text.secondary} />
                  </View>
                  <View style={s.optionInfo}>
                    <Text style={[s.optionLabel, { color: colors.text.primary }]}>{opt.label}</Text>
                    <Text style={[s.optionDesc, { color: colors.text.tertiary }]}>{opt.description}</Text>
                  </View>
                  {active && <Feather name="check-circle" size={18} color={colors.brand.primary} />}
                </Pressable>
              );
            })}
          </View>

          <View style={s.actions}>
            <Pressable
              onPress={handleConfirm}
              disabled={loading || unchanged}
              style={({ pressed }) => [
                s.confirmBtn,
                { backgroundColor: colors.brand.primary },
                (pressed || unchanged) && { opacity: unchanged ? 0.5 : 0.88 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Confirm role change"
            >
              {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={s.confirmBtnText}>Confirm change</Text>}
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

OrgChangeRoleSheet.displayName = 'OrgChangeRoleSheet';

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
  iconCircle: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerText: { flex: 1 },
  sheetTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  sheetSub: { fontSize: 12.5, fontFamily: 'Inter-Regular', marginTop: 2 },
  options: { gap: 10, marginTop: 20 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 13, borderWidth: 1.5, padding: 13, paddingHorizontal: 14 },
  optionIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optionInfo: { flex: 1, minWidth: 0 },
  optionLabel: { fontSize: 14, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  optionDesc: { fontSize: 11.5, fontFamily: 'Inter-Regular', marginTop: 2 },
  actions: { gap: 10, marginTop: 22 },
  confirmBtn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFFFFF', letterSpacing: 0 },
  cancelBtn: { height: 50, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
});
