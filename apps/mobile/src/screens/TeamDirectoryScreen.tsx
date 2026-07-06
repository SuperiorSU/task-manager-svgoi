/**
 * TeamDirectoryScreen — Team roster (screen 33, §4.11).
 *
 * Admin role: scoped to own department, can only view/manage Employees.
 * SA role: org-wide view, sees all users across departments.
 *
 * Features:
 *  - "8 Active · 1 Suspended" header toggle chip
 *  - Debounced search (name / EID / email)
 *  - Filter chips: All · Employees · Admins · Suspended
 *  - Section header: "Physics department · N people"
 *  - User cards with status indicator
 *  - Add User FAB
 *  - Suspend / Reactivate / Reset-password context modals
 *  - Pull-to-refresh
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import type { Role } from '@godigitify/types';
import { useAuthStore } from '../stores/auth.store';
import {
  useUsers,
  useDeactivateUser,
  useReactivateUser,
  useResetUserPassword,
} from '../hooks/usePeople';
import { useColors } from '../constants/colors';
import { Layout, Spacing } from '../constants/spacing';
import { useDebounce } from '../hooks/useDebounce';
import { toTeamMemberView, type TeamMemberView, type TeamFilter } from '../utils/teamMemberView';

import { TeamMemberCard } from '../components/team/TeamMemberCard';
import { TeamFilterBar } from '../components/team/TeamFilterBar';
import { SuspendConfirmModal } from '../components/team/SuspendConfirmModal';
import { ResetPasswordSheet } from '../components/team/ResetPasswordSheet';
import { EmptyState } from '../components/ui/EmptyState';

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function MemberSkeleton({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View
      style={[
        sk.row,
        { backgroundColor: colors.surface.card },
      ]}
    >
      <View style={[sk.avatar, { backgroundColor: colors.surface.background }]} />
      <View style={sk.text}>
        <View style={[sk.line, { width: '55%', backgroundColor: colors.surface.background }]} />
        <View style={[sk.line, { width: '38%', backgroundColor: colors.surface.background, marginTop: 8 }]} />
      </View>
      <View style={[sk.status, { backgroundColor: colors.surface.background }]} />
    </View>
  );
}

const sk = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, flexShrink: 0 },
  text: { flex: 1 },
  line: { height: 13, borderRadius: 6 },
  status: { width: 56, height: 13, borderRadius: 6, flexShrink: 0 },
});

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  role: Extract<Role, 'ADMIN' | 'SUPER_ADMIN'>;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export function TeamDirectoryScreen({ role }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);

  // State
  const [filter, setFilter] = useState<TeamFilter>('ALL');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [suspendTarget, setSuspendTarget] = useState<TeamMemberView | null>(null);
  const [resetTarget, setResetTarget] = useState<TeamMemberView | null>(null);

  // Search
  const debouncedSearch = useDebounce(search, 300);

  // Scoped dept: Admin → own dept (server also enforces this), SA → org-wide
  const deptId = role === 'ADMIN' ? currentUser?.departmentId : undefined;
  const title = role === 'SUPER_ADMIN' ? 'People' : 'My Team';
  const departmentName = currentUser?.department?.name ?? 'Department';

  // This screen is a department roster of employees only (the viewing Admin
  // is the department's own admin/head, never a member of their own team).
  // "All" means no status filter (active + suspended both show) — "Employees"
  // and "Suspended" narrow to one status each. Previously "All" forced
  // isActive:true, making it byte-for-byte identical to "Employees" (the
  // chip did nothing) and hiding suspended members from "All".
  const filters = useMemo(() => ({
    ...(deptId ? { departmentId: deptId } : {}),
    role: 'EMPLOYEE' as const,
    ...(filter === 'SUSPENDED' ? { isActive: false } : filter === 'EMPLOYEES' ? { isActive: true } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    limit: 100,
  }), [deptId, filter, debouncedSearch]);

  // Active/suspended counts always reflect the unfiltered-by-status scope
  const countFilters = useMemo(() => ({
    ...(deptId ? { departmentId: deptId } : {}),
    role: 'EMPLOYEE' as const,
    limit: 100,
  }), [deptId]);

  const { data: listData, isLoading, refetch } = useUsers(filters);
  const { data: activeData } = useUsers({ ...countFilters, isActive: true });
  const { data: suspendedData } = useUsers({ ...countFilters, isActive: false });

  const members: TeamMemberView[] = useMemo(
    () => (listData?.items ?? []).map((u) => toTeamMemberView(u)),
    [listData],
  );
  const activeCount = activeData?.total ?? 0;
  const suspendedCount = suspendedData?.total ?? 0;

  const sectionLabel =
    role === 'ADMIN'
      ? `${departmentName} · ${activeCount + suspendedCount} people`
      : `${activeCount + suspendedCount} people across departments`;

  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();
  const resetPassword = useResetUserPassword();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleMemberPress = useCallback((member: TeamMemberView) => {
    router.push(`/(app)/people/${member.id}` as Parameters<typeof router.push>[0]);
  }, [router]);

  const handleSuspendConfirm = useCallback(async (member: TeamMemberView) => {
    try {
      await deactivateUser.mutateAsync(member.id);
      setSuspendTarget(null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Error toast already shown by useDeactivateUser (useApiMutation) — keep the modal open to retry.
    }
  }, [deactivateUser]);

  const handleReactivate = useCallback(async (member: TeamMemberView) => {
    try {
      await reactivateUser.mutateAsync(member.id);
      setSuspendTarget(null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Error toast already shown by useReactivateUser (useApiMutation) — keep the modal open to retry.
    }
  }, [reactivateUser]);

  const handleResetConfirm = useCallback(async (member: TeamMemberView) => {
    try {
      await resetPassword.mutateAsync(member.id);
      setResetTarget(null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Error toast already shown by useResetUserPassword (useApiMutation) — keep the sheet open to retry.
    }
  }, [resetPassword]);

  const handleAddUser = useCallback(() => {
    router.push('/(app)/people/create' as Parameters<typeof router.push>[0]);
  }, [router]);

  // ─── Render ────────────────────────────────────────────────────────────────

  const renderMember = useCallback(({ item }: { item: TeamMemberView }) => (
    <TeamMemberCard member={item} onPress={handleMemberPress} />
  ), [handleMemberPress]);

  const keyExtractor = useCallback((m: TeamMemberView) => m.id, []);

  const separator = useCallback(() => <View style={{ height: 8 }} />, []);

  const listFooter = <View style={{ height: Spacing[8] }} />;

  const emptyContent = isLoading
    ? (
      <View style={{ gap: 8, paddingTop: 8 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <MemberSkeleton key={i} colors={colors} />
        ))}
      </View>
    )
    : (
      <EmptyState
        icon="users"
        title={
          debouncedSearch
            ? `No results for "${debouncedSearch}"`
            : filter === 'SUSPENDED'
            ? 'No suspended members'
            : 'No team members yet'
        }
        {...(!debouncedSearch && filter === 'ALL'
          ? { subtitle: 'Add your first team member using the button below.' }
          : {})}
      />
    );

  return (
    <View style={[s.screen, { backgroundColor: colors.surface.background }]}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View
        style={[
          s.header,
          {
            backgroundColor: colors.surface.card,
            paddingTop: insets.top + 6,
            borderBottomColor: colors.surface.border,
          },
        ]}
      >
        {/* Title row */}
        <View style={s.titleRow}>
          <Text style={[s.title, { color: colors.text.primary }]}>{title}</Text>

          {/* Active · Suspended chip */}
          {!isLoading && (
            <Pressable
              onPress={() =>
                setFilter((f) => (f === 'SUSPENDED' ? 'ALL' : 'SUSPENDED'))
              }
              style={({ pressed }) => [
                s.statusChip,
                {
                  backgroundColor: '#F8FAFC',
                  borderColor: '#EEF2F7',
                },
                pressed && { opacity: 0.8 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Toggle suspended filter"
            >
              <Text style={[s.statusChipActive, { color: '#16A34A' }]}>
                {activeCount} Active
              </Text>
              <Text style={[s.statusChipDot, { color: colors.surface.borderStrong }]}>·</Text>
              <Text style={[s.statusChipSuspended, { color: '#B45309' }]}>
                {suspendedCount} Suspended
              </Text>
            </Pressable>
          )}
        </View>

        {/* Search */}
        <View
          style={[
            s.searchBar,
            {
              backgroundColor: colors.surface.background,
              borderColor: colors.surface.border,
            },
          ]}
        >
          <Feather name="search" size={17} color={colors.text.tertiary} />
          <TextInput
            style={[s.searchInput, { color: colors.text.primary }]}
            placeholder="Search name or employee ID…"
            placeholderTextColor={colors.text.tertiary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Feather name="x" size={16} color={colors.text.tertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Filter chips ─────────────────────────────────────────────────── */}
      <View style={{ backgroundColor: colors.surface.card, borderBottomWidth: 1, borderBottomColor: colors.surface.border }}>
        <TeamFilterBar active={filter} onChange={setFilter} />
      </View>

      {/* ── Section label ────────────────────────────────────────────────── */}
      {!isLoading && members.length > 0 && (
        <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>
          {sectionLabel}
        </Text>
      )}

      {/* ── Member list ──────────────────────────────────────────────────── */}
      <FlatList
        data={isLoading ? [] : members}
        keyExtractor={keyExtractor}
        renderItem={renderMember}
        ItemSeparatorComponent={separator}
        ListEmptyComponent={emptyContent}
        ListFooterComponent={listFooter}
        contentContainerStyle={[
          s.list,
          { paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* ── Add User FAB ─────────────────────────────────────────────────── */}
      <Pressable
        onPress={handleAddUser}
        style={({ pressed }) => [
          s.fab,
          {
            bottom: insets.bottom + Layout.tabBarHeight + 16,
          },
          pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add user"
      >
        <Feather name="plus" size={22} color="#FFFFFF" />
        <Text style={s.fabText}>Add User</Text>
      </Pressable>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <SuspendConfirmModal
        member={suspendTarget}
        visible={!!suspendTarget && suspendTarget.isActive}
        onConfirm={handleSuspendConfirm}
        onDismiss={() => setSuspendTarget(null)}
      />

      <ResetPasswordSheet
        member={resetTarget}
        visible={!!resetTarget}
        onConfirm={handleResetConfirm}
        onDismiss={() => setResetTarget(null)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing[5],
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing[3],
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.3,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  statusChipActive: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  statusChipDot: {
    fontSize: 12,
  },
  statusChipSuspended: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  searchBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    borderRadius: 11,
    borderWidth: 1,
    marginBottom: 13,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
    ...Platform.select({ android: { padding: 0 } }),
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing[5],
    paddingTop: 14,
    paddingBottom: 4,
  },
  list: {
    paddingHorizontal: Spacing[4],
    paddingTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1A5CF8',
    paddingHorizontal: 20,
    paddingLeft: 16,
    shadowColor: 'rgba(26,92,248,0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  fabText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
});
