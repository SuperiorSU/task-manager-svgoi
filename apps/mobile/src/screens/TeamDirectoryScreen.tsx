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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import type { Role } from '@godigitify/types';
import type { TeamMember } from '../data/team.mock';
import { ADMIN_DEPT } from '../data/team.mock';
import {
  teamService,
  type TeamFilter,
  type TeamListResult,
} from '../services/team.service';
import { useColors } from '../constants/colors';
import { Layout, Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { useDebounce } from '../hooks/useDebounce';

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

  // State
  const [filter, setFilter] = useState<TeamFilter>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<TeamListResult>({
    members: [],
    activeCount: 0,
    suspendedCount: 0,
  });

  // Modals
  const [suspendTarget, setSuspendTarget] = useState<TeamMember | null>(null);
  const [resetTarget, setResetTarget] = useState<TeamMember | null>(null);

  // Search
  const debouncedSearch = useDebounce(search, 300);

  // Scoped dept: Admin → own dept, SA → all
  const deptId = role === 'ADMIN' ? ADMIN_DEPT.id : undefined;
  const title = role === 'SUPER_ADMIN' ? 'People' : 'My Team';
  const sectionLabel =
    role === 'ADMIN'
      ? `${ADMIN_DEPT.name} · ${result.activeCount + result.suspendedCount} people`
      : `${result.activeCount + result.suspendedCount} people across departments`;

  // ─── Data loading ──────────────────────────────────────────────────────────

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await teamService.getTeamList(filter, debouncedSearch, deptId);
      setResult(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, debouncedSearch, deptId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleMemberPress = useCallback((member: TeamMember) => {
    router.push(`/(app)/people/${member.id}` as Parameters<typeof router.push>[0]);
  }, [router]);

  const handleSuspendConfirm = useCallback(async (member: TeamMember) => {
    await teamService.suspendMember(member.id);
    setSuspendTarget(null);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    load();
  }, [load]);

  const handleReactivate = useCallback(async (member: TeamMember) => {
    await teamService.reactivateMember(member.id);
    setSuspendTarget(null);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    load();
  }, [load]);

  const handleResetConfirm = useCallback(async (member: TeamMember) => {
    await teamService.resetPassword(member.id);
    setResetTarget(null);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleAddUser = useCallback(() => {
    router.push('/(app)/people/create' as Parameters<typeof router.push>[0]);
  }, [router]);

  // ─── Render ────────────────────────────────────────────────────────────────

  const renderMember = useCallback(({ item }: { item: TeamMember }) => (
    <TeamMemberCard member={item} onPress={handleMemberPress} />
  ), [handleMemberPress]);

  const keyExtractor = useCallback((m: TeamMember) => m.id, []);

  const separator = useCallback(() => <View style={{ height: 8 }} />, []);

  const listFooter = <View style={{ height: Spacing[8] }} />;

  const emptyContent = loading
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
          {!loading && (
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
                {result.activeCount} Active
              </Text>
              <Text style={[s.statusChipDot, { color: colors.surface.borderStrong }]}>·</Text>
              <Text style={[s.statusChipSuspended, { color: '#B45309' }]}>
                {result.suspendedCount} Suspended
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
      {!loading && result.members.length > 0 && (
        <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>
          {sectionLabel}
        </Text>
      )}

      {/* ── Member list ──────────────────────────────────────────────────── */}
      <FlatList
        data={loading ? [] : result.members}
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
