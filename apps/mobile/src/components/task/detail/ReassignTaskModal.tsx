import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { usersApi } from '@godigitify/api-client';
import type { User } from '@godigitify/types';

import { useColors } from '../../../constants/colors';
import { Spacing } from '../../../constants/spacing';
import { useDebounce } from '../../../hooks/useDebounce';
import { getInitials } from '../../../utils/initial';

type Props = {
  visible: boolean;
  taskId: string;
  taskTitle: string;
  currentAssigneeId: string;
  /** Own department — used as the default candidate filter for ADMIN. Omit for SUPER_ADMIN (org-wide search). */
  viewerDeptId?: string;
  loading: boolean;
  onConfirm: (assigneeId: string, reason: string) => void;
  onClose: () => void;
};

export const ReassignTaskModal = ({
  visible,
  taskTitle,
  currentAssigneeId,
  viewerDeptId,
  loading,
  onConfirm,
  onClose,
}: Props) => {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [allDepartments, setAllDepartments] = useState(!viewerDeptId);
  const [selected, setSelected] = useState<User | null>(null);
  const [reason, setReason] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['reassign-candidates', debouncedSearch, allDepartments ? null : viewerDeptId],
    queryFn: () =>
      usersApi
        .getList({
          isActive: true,
          limit: 20,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
          ...(!allDepartments && viewerDeptId ? { departmentId: viewerDeptId } : {}),
        })
        .then((r) => r.data.items.filter((u) => u.role !== 'SUPER_ADMIN' && u.id !== currentAssigneeId)),
    enabled: visible,
  });

  const reset = () => {
    setSearch('');
    setSelected(null);
    setReason('');
    setAllDepartments(!viewerDeptId);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected.id, reason.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={handleClose}>
        <Pressable
          style={[s.sheet, { backgroundColor: colors.surface.card, paddingBottom: insets.bottom + Spacing[4] }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[s.handle, { backgroundColor: colors.surface.border }]} />
          <Text style={[s.title, { color: colors.text.primary }]}>Reassign task</Text>
          <Text style={[s.subtitle, { color: colors.text.tertiary }]} numberOfLines={1}>
            "{taskTitle}"
          </Text>

          <View style={[s.searchBox, { borderColor: colors.surface.border, backgroundColor: colors.surface.background }]}>
            <Feather name="search" size={15} color={colors.text.tertiary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name…"
              placeholderTextColor={colors.text.tertiary}
              style={[s.searchInput, { color: colors.text.primary }]}
              autoCorrect={false}
            />
          </View>

          {viewerDeptId && (
            <Pressable
              onPress={() => setAllDepartments((v) => !v)}
              style={[
                s.deptToggle,
                {
                  backgroundColor: allDepartments ? colors.brand.primaryLight : colors.surface.background,
                  borderColor: allDepartments ? colors.brand.primary : colors.surface.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: allDepartments }}
            >
              <Feather name="globe" size={13} color={allDepartments ? colors.brand.primary : colors.text.secondary} />
              <Text style={[s.deptToggleText, { color: allDepartments ? colors.brand.primary : colors.text.secondary }]}>
                All departments
              </Text>
            </Pressable>
          )}

          <View style={s.listWrap}>
            {isLoading ? (
              <ActivityIndicator color={colors.brand.primary} style={{ paddingVertical: Spacing[6] }} />
            ) : (
              <FlatList
                data={candidates}
                keyExtractor={(u) => u.id}
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
                ListEmptyComponent={
                  <Text style={[s.emptyText, { color: colors.text.tertiary }]}>No matching users found.</Text>
                }
                renderItem={({ item }) => {
                  const isSelected = selected?.id === item.id;
                  return (
                    <Pressable
                      onPress={() => setSelected(item)}
                      style={[
                        s.candidateRow,
                        {
                          backgroundColor: isSelected ? colors.brand.primaryLight : colors.surface.background,
                          borderColor: isSelected ? colors.brand.primary : colors.surface.border,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View style={[s.avatar, { backgroundColor: colors.surface.card }]}>
                        <Text style={[s.avatarText, { color: colors.text.secondary }]}>{getInitials(item.name)}</Text>
                      </View>
                      <View style={s.candidateInfo}>
                        <Text style={[s.candidateName, { color: colors.text.primary }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={[s.candidateMeta, { color: colors.text.tertiary }]} numberOfLines={1}>
                          {item.role === 'ADMIN' ? 'Admin' : 'Employee'}
                          {item.department?.name ? ` · ${item.department.name}` : ''}
                        </Text>
                      </View>
                      {isSelected && <Feather name="check-circle" size={18} color={colors.brand.primary} />}
                    </Pressable>
                  );
                }}
                style={s.list}
              />
            )}
          </View>

          {selected && (
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Reason (optional)"
              placeholderTextColor={colors.text.tertiary}
              style={[s.reasonInput, { borderColor: colors.surface.border, color: colors.text.primary }]}
              maxLength={500}
            />
          )}

          <Pressable
            onPress={handleConfirm}
            disabled={!selected || loading}
            style={[
              s.confirmBtn,
              { backgroundColor: colors.brand.primary },
              (!selected || loading) && { opacity: 0.5 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Reassign"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={s.confirmBtnText}>{selected ? `Reassign to ${selected.name}` : 'Select a person'}</Text>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.5)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 10, maxHeight: '85%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  title: { fontSize: 17, fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  subtitle: { fontSize: 12.5, fontFamily: 'Inter-Regular', textAlign: 'center', marginTop: 2, marginBottom: 14 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter-Regular' },
  deptToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
  },
  deptToggleText: { fontSize: 12, fontFamily: 'Inter-Medium' },
  listWrap: { marginTop: 12, minHeight: 120 },
  list: { maxHeight: 260 },
  emptyText: { fontSize: 13, fontFamily: 'Inter-Regular', textAlign: 'center', paddingVertical: Spacing[6] },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontFamily: 'Inter-Bold' },
  candidateInfo: { flex: 1, minWidth: 0 },
  candidateName: { fontSize: 13.5, fontFamily: 'Inter-SemiBold' },
  candidateMeta: { fontSize: 11.5, fontFamily: 'Inter-Regular', marginTop: 1 },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13.5,
    fontFamily: 'Inter-Regular',
    marginTop: 12,
  },
  confirmBtn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  confirmBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
});
