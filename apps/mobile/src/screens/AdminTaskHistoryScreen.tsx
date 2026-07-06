/**
 * AdminTaskHistoryScreen — "User task history — filterable" (HTML screen 74),
 * with its filter sheet (HTML screen 75). Reached from a Team Workload
 * Overview row.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, SectionList, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import type { RichTask } from '@godigitify/types';
import type { HistoryDateRange } from '../data/adminWorkload.mock';
import {
  useMemberWorkload,
  useMemberTaskHistory,
  useMemberHistoryFilterState,
  filterMemberTasks,
} from '../hooks/useAdminWorkload';
import { useColors } from '../constants/colors';
import { Spacing } from '../constants/spacing';

import { TaskSearchBar } from '../components/task/TaskSearchBar';
import { HistoryStatusChips } from '../components/task/workload/HistoryStatusChips';
import { MemberTaskHistoryRow } from '../components/task/workload/MemberTaskHistoryRow';
import { MemberHistoryFilterSheet } from '../components/task/workload/MemberHistoryFilterSheet';
import { EmptyState } from '../components/ui/EmptyState';
import { ListSkeleton } from '../components/dashboard/ListSkeleton';

export function AdminTaskHistoryScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: member } = useMemberWorkload(memberId ?? '');
  const profileId = memberId; // real API has one user-id space — the route param is the profile id
  const { filters, setStatusChip, setSearch, applySheet, hasActiveFilters } = useMemberHistoryFilterState();
  const { groups, counts, isLoading, all } = useMemberTaskHistory(memberId ?? '', filters);

  const [sheetVisible, setSheetVisible] = useState(false);

  const push = useCallback((path: string) => router.push(path as Parameters<typeof router.push>[0]), [router]);
  const goTask = useCallback((task: RichTask) => push(`/(app)/tasks/${task.id}`), [push]);
  const goProfile = useCallback(() => {
    if (profileId) push(`/(app)/people/${profileId}`);
  }, [profileId, push]);

  const dateRangeChipLabel = useMemo(() => {
    if (filters.dateRange === 'ALL') return 'All time';
    if (filters.dateRange === 365) return 'This year';
    return `Last ${filters.dateRange} days`;
  }, [filters.dateRange]);

  const activeFilterCount =
    (filters.dateRange !== 90 ? 1 : 0) + (filters.sortOrder !== 'newest' ? 1 : 0);

  const previewCount = useCallback(
    (dateRange: HistoryDateRange) =>
      filterMemberTasks(all, { dateRange, statusChip: filters.statusChip, search: filters.search }).length,
    [all, filters.statusChip, filters.search],
  );

  return (
    <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <Pressable
          onPress={goProfile}
          disabled={!profileId}
          style={s.identityRow}
          accessibilityRole={profileId ? 'button' : undefined}
          accessibilityLabel={profileId ? `View ${member?.name ?? ''}'s profile` : undefined}
        >
          <View style={[s.avatar, { backgroundColor: member?.avatarBg ?? colors.brand.secondary }]}>
            <Text style={[s.avatarText, { color: member?.avatarFg ?? '#FFFFFF' }]}>{member?.initials ?? ''}</Text>
          </View>
          <View style={s.headerInfo}>
            <Text style={[s.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
              {member?.name ?? 'Team member'} · History
            </Text>
            <Text style={[s.headerSubtitle, { color: colors.text.tertiary }]} numberOfLines={1}>
              {member?.designation ?? ''} · {member?.departmentName ?? ''}
            </Text>
          </View>
          {profileId && <Feather name="chevron-right" size={16} color={colors.surface.borderStrong} />}
        </Pressable>
      </View>

      <TaskSearchBar value={filters.search} onChangeText={setSearch} placeholder="Search task title..." />

      {/* ── Active filters row ─────────────────────────────────────────── */}
      <View style={s.activeFiltersRow}>
        <Pressable
          onPress={() => setSheetVisible(true)}
          style={[s.dateChip, { backgroundColor: colors.brand.primaryLight, borderColor: '#DBEAFE' }]}
        >
          <Text style={[s.dateChipText, { color: colors.brand.primaryDark }]}>📅 {dateRangeChipLabel}</Text>
        </Pressable>
        <Pressable
          onPress={() => setSheetVisible(true)}
          style={[s.filtersChip, { backgroundColor: colors.surface.card, borderColor: colors.surface.border }]}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
        >
          <Text style={[s.filtersChipText, { color: colors.text.secondary }]}>Filters</Text>
          {activeFilterCount > 0 && (
            <View style={[s.filtersBadge, { backgroundColor: colors.brand.primary }]}>
              <Text style={s.filtersBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <HistoryStatusChips active={filters.statusChip} counts={counts} onChange={setStatusChip} />

      {isLoading ? (
        <View style={s.loadingBody}>
          <ListSkeleton rows={5} />
        </View>
      ) : (
        <SectionList
          sections={groups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MemberTaskHistoryRow task={item} onPress={goTask} />}
          renderSectionHeader={({ section }) => (
            <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>{section.title.toUpperCase()}</Text>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 9 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 18 }} />}
          ListEmptyComponent={
            <EmptyState
              icon="search"
              title="No tasks match your filters"
              subtitle={
                hasActiveFilters || filters.statusChip !== 'ALL' || filters.search
                  ? 'Try widening the date range or clearing filters.'
                  : 'No task history in this window yet.'
              }
            />
          }
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + Spacing[6] }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <MemberHistoryFilterSheet
        visible={sheetVisible}
        current={{ dateRange: filters.dateRange, sortOrder: filters.sortOrder }}
        previewCount={previewCount}
        onApply={applySheet}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 8, paddingBottom: 12 },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  identityRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, minWidth: 0 },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11, fontFamily: 'Inter-Bold' },
  headerInfo: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 15, fontFamily: 'Inter-SemiBold' },
  headerSubtitle: { fontSize: 11, fontFamily: 'Inter-Regular' },
  activeFiltersRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  dateChip: { height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dateChipText: { fontSize: 12, fontFamily: 'Inter-SemiBold' },
  filtersChip: {
    height: 32,
    paddingHorizontal: 13,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
  },
  filtersChipText: { fontSize: 12, fontFamily: 'Inter-SemiBold' },
  filtersBadge: { minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  filtersBadgeText: { fontSize: 9, fontFamily: 'Inter-Bold', color: '#FFFFFF' },
  loadingBody: { padding: Spacing[4] },
  list: { paddingHorizontal: Spacing[4], paddingTop: Spacing[3] },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter-Bold', letterSpacing: 0.4, marginBottom: 9 },
});
