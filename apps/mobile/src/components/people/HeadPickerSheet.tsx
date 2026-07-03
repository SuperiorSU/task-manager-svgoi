/**
 * HeadPickerSheet — "Department head" single-select (screen 54). Rows show
 * avatar + name + role/dept, unlike SettingsPickerSheet's plain label+dot
 * rows, so it's a dedicated component rather than a forced fit.
 */

import React from 'react';
import { Modal, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import type { OrgUser } from '../../hooks/useOrgDirectory';
import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

type Props = {
  visible: boolean;
  admins: OrgUser[];
  selectedId?: string;
  onSelect: (admin: OrgUser) => void;
  onClose: () => void;
};

export function HeadPickerSheet({ visible, admins, selectedId, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[s.backdrop, { backgroundColor: colors.surface.overlay }]} onPress={onClose}>
        <Pressable style={[s.sheet, { backgroundColor: colors.surface.card, paddingBottom: insets.bottom + Spacing[4] }]}>
          <View style={[s.handle, { backgroundColor: colors.surface.borderStrong }]} />
          <View style={[s.header, { borderBottomColor: colors.surface.border }]}>
            <Text style={[s.title, { color: colors.text.primary }]}>Department head</Text>
            <Pressable onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={22} color={colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={s.scroll}>
            {admins.length === 0 ? (
              <Text style={[s.empty, { color: colors.text.tertiary }]}>No admins available yet</Text>
            ) : (
              admins.map((admin) => {
                const active = admin.id === selectedId;
                const deptLabel = admin.departments.map((d) => d.name).join(', ');
                return (
                  <Pressable
                    key={admin.id}
                    onPress={() => {
                      onSelect(admin);
                      onClose();
                    }}
                    style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                  >
                    <View style={[s.avatar, { backgroundColor: admin.avatarBg }]}>
                      <Text style={[s.avatarText, { color: admin.avatarText }]}>{admin.initials}</Text>
                    </View>
                    <View style={s.info}>
                      <Text style={[s.name, { color: colors.text.primary }]} numberOfLines={1}>{admin.name}</Text>
                      <Text style={[s.sub, { color: colors.text.tertiary }]} numberOfLines={1}>
                        Admin · {deptLabel}
                      </Text>
                    </View>
                    {active && <Feather name="check" size={18} color={colors.brand.primary} />}
                  </Pressable>
                );
              })
            )}
            <View style={s.spacer} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: Spacing[4], maxHeight: '70%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: Spacing[3], marginBottom: Spacing[2] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    marginBottom: Spacing[2],
  },
  title: { fontSize: 16, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  scroll: { maxHeight: 340 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 4 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 12, fontFamily: 'Inter-Bold' },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 13.5, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  sub: { fontSize: 11.5, fontFamily: 'Inter-Regular', marginTop: 1 },
  empty: { fontSize: 13, fontFamily: 'Inter-Regular', textAlign: 'center', paddingVertical: Spacing[6] },
  spacer: { height: Spacing[4] },
});
