/**
 * ReassignDepartmentHeadScreen — SA "Reassign head" (HTML screen 56d),
 * reached from Department members (56b) or Edit department's head row (56c).
 * Single-select radio list scoped to this department's members; no separate
 * confirm modal — the info banner is the standing warning, matching the design.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import type { OrgDepartmentMember } from '../hooks/useOrgDirectory';
import { useOrgDepartmentDetail, useOrgDepartmentMembers, useReassignDepartmentHead } from '../hooks/useOrgDirectory';
import { useColors } from '../constants/colors';
import { Spacing, Layout } from '../constants/spacing';
import { Skeleton } from '../components/ui/Skeleton';

export function ReassignDepartmentHeadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: dept } = useOrgDepartmentDetail(id ?? '');
  const { data: membersData, isLoading } = useOrgDepartmentMembers(id ?? '', 'ALL');
  const reassignHead = useReassignDepartmentHead(id ?? '');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const currentHeadId = dept?.headId ?? null;
  const effectiveSelectedId = selectedId ?? currentHeadId;

  const goBack = useCallback(() => router.back(), [router]);

  const handleReassign = useCallback(async () => {
    if (!effectiveSelectedId || effectiveSelectedId === currentHeadId) {
      goBack();
      return;
    }
    try {
      await reassignHead.mutateAsync(effectiveSelectedId);
      goBack();
    } catch {
      // Error toast already shown by useReassignDepartmentHead (useApiMutation).
    }
  }, [effectiveSelectedId, currentHeadId, reassignHead, goBack]);

  const members = membersData?.members.filter((m) => m.status === 'ACTIVE') ?? [];

  const renderItem = useCallback(
    ({ item }: { item: OrgDepartmentMember }) => {
      const isSelected = item.id === effectiveSelectedId;
      const isCurrent = item.id === currentHeadId;
      return (
        <Pressable
          onPress={() => setSelectedId(item.id)}
          style={[
            row.card,
            {
              backgroundColor: colors.surface.card,
              borderColor: isSelected ? colors.brand.primary : 'transparent',
              borderWidth: isSelected ? 1.5 : 0,
            },
          ]}
          accessibilityRole="radio"
          accessibilityState={{ checked: isSelected }}
        >
          <View style={[row.avatar, { backgroundColor: item.avatarBg }]}>
            <Text style={[row.avatarText, { color: item.avatarText }]}>{item.initials}</Text>
          </View>
          <View style={row.info}>
            <View style={row.nameRow}>
              <Text style={[row.name, { color: colors.text.primary }]} numberOfLines={1}>{item.name}</Text>
              {isCurrent && (
                <View style={[row.currentBadge, { backgroundColor: colors.brand.primaryLight }]}>
                  <Text style={[row.currentBadgeText, { color: colors.brand.primary }]}>CURRENT</Text>
                </View>
              )}
            </View>
            <Text style={[row.meta, { color: colors.text.tertiary }]}>
              {item.role === 'ADMIN' ? 'Administrator' : 'Employee'} · {item.staffId}
            </Text>
          </View>
          {isSelected ? (
            <View style={[row.radioSelected, { backgroundColor: colors.brand.primary }]}>
              <Feather name="check" size={13} color="#FFFFFF" />
            </View>
          ) : (
            <View style={[row.radio, { borderColor: colors.surface.borderStrong }]} />
          )}
        </Pressable>
      );
    },
    [effectiveSelectedId, currentHeadId, colors]
  );

  return (
    <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
      <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable onPress={goBack} style={s.headerBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <View style={s.headerInfo}>
          <Text style={[s.headerTitle, { color: colors.text.primary }]}>Reassign head</Text>
          <Text style={[s.headerSubtitle, { color: colors.text.tertiary }]}>{dept?.name ?? ''}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={s.loadingBody}>
          <Skeleton height={60} borderRadius={12} />
          <Skeleton height={68} borderRadius={13} />
          <Skeleton height={68} borderRadius={13} />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: Spacing[2] }} />}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <View style={[s.banner, { backgroundColor: colors.brand.primaryLight, borderColor: '#DBEAFE' }]}>
                <Feather name="info" size={16} color={colors.brand.primary} />
                <Text style={[s.bannerText, { color: colors.brand.primaryDark }]}>
                  New head gets admin rights for this department. Current head reverts to employee.
                </Text>
              </View>
              <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Select new head</Text>
            </>
          }
        />
      )}

      <View style={[s.footer, { paddingBottom: insets.bottom + 12, backgroundColor: colors.surface.card, borderTopColor: colors.surface.border }]}>
        <Pressable
          onPress={goBack}
          disabled={reassignHead.isPending}
          style={({ pressed }) => [s.cancelBtn, { borderColor: colors.surface.border, backgroundColor: colors.surface.card }, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={[s.cancelBtnText, { color: colors.text.secondary }]}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleReassign}
          disabled={reassignHead.isPending}
          style={({ pressed }) => [s.confirmBtn, { backgroundColor: colors.brand.primary }, pressed && { opacity: 0.88 }, reassignHead.isPending && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Reassign head"
        >
          {reassignHead.isPending ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={s.confirmBtnText}>Reassign head</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1 },
  headerBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  headerInfo: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  headerSubtitle: { fontSize: 11.5, fontFamily: 'Inter-Regular', marginTop: 1 },
  loadingBody: { padding: Spacing[4], gap: Spacing[3] },
  list: { padding: Spacing[4] },
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, borderWidth: 1, padding: 13 },
  bannerText: { flex: 1, fontSize: 12.5, fontFamily: 'Inter-Regular', lineHeight: 18 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter-Bold', letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 18, marginBottom: 9 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: Spacing[4], paddingTop: 12, borderTopWidth: 1 },
  cancelBtn: { flex: 1, height: 50, borderRadius: Layout.buttonRadius, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  confirmBtn: { flex: 1.4, height: 50, borderRadius: Layout.buttonRadius, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFFFFF', letterSpacing: 0 },
});

const row = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 13, padding: 13, paddingHorizontal: 14 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 13, fontFamily: 'Inter-Bold' },
  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { fontSize: 14, fontFamily: 'Inter-SemiBold', flexShrink: 1 },
  currentBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, flexShrink: 0 },
  currentBadgeText: { fontSize: 9, fontFamily: 'Inter-Bold', letterSpacing: 0.3 },
  meta: { fontSize: 11.5, fontFamily: 'Inter-Regular', marginTop: 3 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, flexShrink: 0 },
  radioSelected: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
