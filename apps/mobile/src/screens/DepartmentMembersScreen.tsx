/**
 * DepartmentMembersScreen — SA "Department members" (HTML screen 56b),
 * reached from Department detail (56a) via the "Members" header pill. Hosts
 * the roster plus every department-management action: Edit department (56c),
 * Reassign head (56d), Add member (reuses screen 53 / CreateOrgUserScreen),
 * and Archive department (56e, modal).
 */

import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import type { OrgDepartmentMemberFilter, OrgDepartmentMember } from '../hooks/useOrgDirectory';
import { useOrgDepartmentDetail, useOrgDepartmentMembers, useArchiveOrgDepartment } from '../hooks/useOrgDirectory';
import { useColors } from '../constants/colors';
import { Spacing } from '../constants/spacing';

import { PeopleFilterChips } from '../components/people/PeopleFilterChips';
import { OrgDepartmentMemberRow } from '../components/people/OrgDepartmentMemberRow';
import { OrgUserManageRow } from '../components/people/OrgUserManageRow';
import { ArchiveDepartmentModal } from '../components/people/ArchiveDepartmentModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

function SectionLabel({ children }: { children: string }) {
  const colors = useColors();
  return <Text style={[sl.text, { color: colors.text.tertiary }]}>{children}</Text>;
}
const sl = StyleSheet.create({
  text: { fontSize: 11, fontFamily: 'Inter-Bold', letterSpacing: 0.4, textTransform: 'uppercase', paddingHorizontal: Spacing[5], paddingTop: 18, paddingBottom: 9 },
});

export function DepartmentMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [filter, setFilter] = useState<OrgDepartmentMemberFilter>('ALL');
  const [archiveVisible, setArchiveVisible] = useState(false);

  const { data: dept } = useOrgDepartmentDetail(id ?? '');
  const { data: membersData, isLoading } = useOrgDepartmentMembers(id ?? '', filter);
  const archiveDepartment = useArchiveOrgDepartment(id ?? '');

  const push = useCallback((path: string) => router.push(path as Parameters<typeof router.push>[0]), [router]);
  const goMemberProfile = useCallback((member: OrgDepartmentMember) => push(`/(app)/people/org/${member.id}`), [push]);
  const goEdit = useCallback(() => push(`/(app)/people/department/${id}/edit`), [push, id]);
  const goReassignHead = useCallback(() => push(`/(app)/people/department/${id}/reassign-head`), [push, id]);
  const goAddMember = useCallback(() => push(`/(app)/people/create-user?departmentId=${id}`), [push, id]);

  const handleArchive = useCallback(async () => {
    try {
      await archiveDepartment.mutateAsync();
      setArchiveVisible(false);
      router.push('/(app)/(sa)/people' as never);
    } catch {
      // Error toast already shown by useArchiveOrgDepartment (useApiMutation).
    }
  }, [archiveDepartment, router]);

  const members = membersData?.members ?? [];

  return (
    <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable onPress={() => router.back()} style={s.headerBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <View style={s.headerInfo}>
          <Text style={[s.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>{dept?.name ?? 'Department'}</Text>
          <Text style={[s.headerSubtitle, { color: colors.text.tertiary }]}>
            {membersData?.total ?? dept?.memberCount ?? 0} {(membersData?.total ?? dept?.memberCount) === 1 ? 'member' : 'members'}
          </Text>
        </View>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrgDepartmentMemberRow member={item} onPress={goMemberProfile} />}
        ItemSeparatorComponent={() => <View style={{ height: Spacing[2] }} />}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + Spacing[6] }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={s.chipsWrap}>
              <PeopleFilterChips active={filter} onChange={setFilter} />
            </View>
            <SectionLabel>Members</SectionLabel>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={s.loadingBody}>
              <Skeleton height={68} borderRadius={13} />
              <Skeleton height={68} borderRadius={13} />
              <Skeleton height={68} borderRadius={13} />
            </View>
          ) : (
            <EmptyState icon="users" title="No members match this filter" subtitle="Try a different filter above." />
          )
        }
        ListFooterComponent={
          <>
            <SectionLabel>Manage department</SectionLabel>
            <View style={[s.card, { backgroundColor: colors.surface.card, marginHorizontal: Spacing[4] }]}>
              <OrgUserManageRow icon="edit-2" label="Edit department" onPress={goEdit} />
              <View style={[s.cardDivider, { backgroundColor: colors.surface.border }]} />
              <OrgUserManageRow icon="user-check" label="Reassign head" onPress={goReassignHead} />
              <View style={[s.cardDivider, { backgroundColor: colors.surface.border }]} />
              <OrgUserManageRow icon="user-plus" label="Add member" accent="#15803D" onPress={goAddMember} />
            </View>

            <View style={[s.card, { backgroundColor: colors.surface.card, marginHorizontal: Spacing[4], marginTop: Spacing[3] }]}>
              <OrgUserManageRow icon="archive" label="Archive department" danger onPress={() => setArchiveVisible(true)} />
            </View>
          </>
        }
      />

      <ArchiveDepartmentModal
        department={dept ? {
          name: dept.name,
          code: dept.code,
          memberCount: dept.memberCount,
          activeTaskCount: dept.taskStats.activeCount,
        } : null}
        visible={archiveVisible}
        onConfirm={handleArchive}
        onDismiss={() => setArchiveVisible(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1 },
  headerBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  headerInfo: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  headerSubtitle: { fontSize: 11, fontFamily: 'Inter-Regular', marginTop: 1 },
  chipsWrap: { paddingTop: 12 },
  loadingBody: { paddingHorizontal: Spacing[4], gap: Spacing[2] },
  list: { paddingHorizontal: Spacing[4] },
  card: { borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  cardDivider: { height: 1 },
});
