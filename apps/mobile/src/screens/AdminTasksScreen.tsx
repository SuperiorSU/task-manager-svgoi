import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  View,
  Text,
  Pressable,
  StyleSheet,
  RefreshControl,
  SectionList,
  TextInput,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';

import type { RichTask } from '@godigitify/types';
import { useAuthStore } from '../stores/auth.store';
import { useTasks } from '../hooks/useTasks';
import { useColors } from '../constants/colors';
import { Layout, Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { AdminTaskCard } from '../components/task/AdminTaskCard';
import { EmptyState } from '../components/ui/EmptyState';

type AdminTaskScope = 'managed' | 'assigned';
type AdminTaskFilter = 'ALL' | 'TO_REVIEW' | 'CROSS_DEPT' | 'OVERDUE';

type AdminTaskStats = {
  total: number;
  toReview: number;
  crossDept: number;
  overdue: number;
  assignedToMe: number;
};

const isOverdue = (t: RichTask) =>
  !['COMPLETED', 'CANCELLED'].includes(t.status) && dayjs(t.dueDate).isBefore(dayjs());

// ─── Filter chip config ───────────────────────────────────────────────────────

type FilterChip = {
  id: AdminTaskFilter;
  label: string;
  icon?: React.ComponentProps<typeof Feather>['name'];
  badgeKey?: keyof AdminTaskStats;
};

const FILTER_CHIPS: FilterChip[] = [
  { id: 'ALL', label: 'All dept' },
  { id: 'TO_REVIEW', label: 'To review', badgeKey: 'toReview' },
  { id: 'CROSS_DEPT', label: 'Cross-dept', icon: 'corner-up-right' },
  { id: 'OVERDUE', label: 'Overdue' },
];

// ─── Section list item type ───────────────────────────────────────────────────

type SectionItem = { id: string; task: RichTask };
type Section = { key: string; label: string; count: number; accentColor: string; data: SectionItem[] };

function groupTasks(tasks: RichTask[]): Section[] {
  const reviewTasks = tasks.filter((t) => t.status === 'UNDER_REVIEW');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const pendingTasks = tasks.filter((t) => t.status === 'PENDING' || t.status === 'ACCEPTED');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const cancelledTasks = tasks.filter((t) => t.status === 'CANCELLED');

  const toItems = (list: RichTask[]): SectionItem[] => list.map((t) => ({ id: t.id, task: t }));

  const sections: Section[] = [];
  if (reviewTasks.length > 0) sections.push({ key: 'review', label: 'Needs your review', count: reviewTasks.length, accentColor: '#7C3AED', data: toItems(reviewTasks) });
  if (inProgressTasks.length > 0) sections.push({ key: 'in_progress', label: 'In progress', count: inProgressTasks.length, accentColor: '#94A3B8', data: toItems(inProgressTasks) });
  if (pendingTasks.length > 0) sections.push({ key: 'pending', label: 'Pending', count: pendingTasks.length, accentColor: '#94A3B8', data: toItems(pendingTasks) });
  if (completedTasks.length > 0) sections.push({ key: 'completed', label: 'Completed', count: completedTasks.length, accentColor: '#22C55E', data: toItems(completedTasks) });
  if (cancelledTasks.length > 0) sections.push({ key: 'cancelled', label: 'Cancelled', count: cancelledTasks.length, accentColor: '#94A3B8', data: toItems(cancelledTasks) });
  return sections;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AdminTasksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const currentUser = useAuthStore((s) => s.user);
  const adminId = currentUser?.id ?? '';
  const adminDeptId = currentUser?.departmentId ?? '';

  const [scope, setScope] = useState<AdminTaskScope>('managed');
  const [filter, setFilter] = useState<AdminTaskFilter>('ALL');
  const [search, setSearch] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const searchRef = useRef<TextInput>(null);
  const searchAnim = useRef(new Animated.Value(0)).current;

  // ── Data loading ──────────────────────────────────────────────────────────
  // Server scopes ADMIN queries to: own dept + self-created cross-dept + assigned-to-me.

  const {
    data: listData,
    isLoading: loading,
    refetch,
  } = useTasks({
    limit: 100,
    sortBy: 'createdAt',
    order: 'desc',
    ...(search ? { search } : {}),
  });

  const allTasks: RichTask[] = listData ?? [];

  // "I manage" = tasks in my own dept, or tasks I created for another dept.
  // "Assigned to me" = tasks someone else assigned to me personally.
  const managedTasks = useMemo(
    () => allTasks.filter((t) => t.departmentId === adminDeptId || t.creatorId === adminId),
    [allTasks, adminDeptId, adminId],
  );
  const assignedToMeTasks = useMemo(
    () => allTasks.filter((t) => t.assigneeId === adminId && t.creatorId !== adminId),
    [allTasks, adminId],
  );

  const stats: AdminTaskStats = useMemo(() => ({
    total: managedTasks.length,
    toReview: managedTasks.filter((t) => t.status === 'UNDER_REVIEW').length,
    crossDept: managedTasks.filter((t) => t.creatorId === adminId && t.departmentId !== adminDeptId).length,
    overdue: managedTasks.filter(isOverdue).length,
    assignedToMe: assignedToMeTasks.length,
  }), [managedTasks, assignedToMeTasks, adminId, adminDeptId]);

  const scopedTasks = scope === 'managed' ? managedTasks : assignedToMeTasks;

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'TO_REVIEW': return scopedTasks.filter((t) => t.status === 'UNDER_REVIEW');
      case 'CROSS_DEPT': return scopedTasks.filter((t) => t.creatorId === adminId && t.departmentId !== adminDeptId);
      case 'OVERDUE': return scopedTasks.filter(isOverdue);
      default: return scopedTasks;
    }
  }, [scopedTasks, filter, adminId, adminDeptId]);

  const groups = useMemo(() => groupTasks(filteredTasks), [filteredTasks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // ── Search toggle ─────────────────────────────────────────────────────────

  const toggleSearch = useCallback(() => {
    const opening = !searchVisible;
    setSearchVisible(opening);
    Animated.timing(searchAnim, {
      toValue: opening ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      if (opening) searchRef.current?.focus();
      else setSearch('');
    });
  }, [searchAnim, searchVisible]);

  const searchHeight = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 48],
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  const push = useCallback(
    (path: string) => router.push(path as Parameters<typeof router.push>[0]),
    [router],
  );

  const handleTaskPress = useCallback(
    (id: string) => push(`/(app)/tasks/${id}`),
    [push],
  );

  const handleCreateTask = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    push('/(app)/tasks/create');
  }, [push]);

  // ── Scope toggle ──────────────────────────────────────────────────────────

  const handleScopeChange = useCallback(
    async (s: AdminTaskScope) => {
      await Haptics.selectionAsync();
      setScope(s);
    },
    [],
  );

  // ── Filter chip press ─────────────────────────────────────────────────────

  const handleFilterPress = useCallback(
    async (f: AdminTaskFilter) => {
      await Haptics.selectionAsync();
      setFilter(f);
    },
    [],
  );

  // ── Section data ──────────────────────────────────────────────────────────

  const sections = groups;

  const totalShowing = useMemo(
    () => groups.reduce((sum, g) => sum + g.count, 0),
    [groups],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => (
      <View style={s.groupHeader}>
        <Text
          style={[
            s.groupLabel,
            { color: section.accentColor === '#7C3AED' ? '#6D28D9' : '#94A3B8' },
            section.key === 'review' && s.groupLabelReview,
          ]}
        >
          {section.label.toUpperCase()}
        </Text>
        <View
          style={[
            s.groupBadge,
            {
              backgroundColor:
                section.key === 'review' ? '#7C3AED' : '#EEF2F7',
            },
          ]}
        >
          <Text
            style={[
              s.groupBadgeText,
              {
                color: section.key === 'review' ? '#FFFFFF' : '#64748B',
              },
            ]}
          >
            {section.count}
          </Text>
        </View>
      </View>
    ),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: SectionItem }) => (
      <AdminTaskCard
        task={item.task}
        isCrossDept={item.task.creatorId === adminId && item.task.departmentId !== adminDeptId}
        onPress={handleTaskPress}
      />
    ),
    [handleTaskPress, adminId, adminDeptId],
  );

  const keyExtractor = useCallback((item: SectionItem) => item.id, []);

  const ListEmptyComponent = useMemo(
    () =>
      loading ? null : (
        <EmptyState
          icon="check-square"
          title={filter === 'TO_REVIEW' ? 'No tasks awaiting review' : 'No tasks found'}
          subtitle={
            filter === 'TO_REVIEW'
              ? 'All submissions have been reviewed'
              : search
              ? `No tasks matching "${search}"`
              : 'Create a task to start tracking department work'
          }
        />
      ),
    [filter, loading, search],
  );

  return (
    <View
      style={[
        s.screen,
        { paddingTop: insets.top, backgroundColor: colors.surface.background },
      ]}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View
        style={[
          s.header,
          {
            backgroundColor: colors.surface.card,
            borderBottomColor: colors.surface.border,
          },
        ]}
      >
        {/* Title row */}
        <View style={s.titleRow}>
          <Text style={[s.titleText, { color: colors.text.primary }]}>Tasks</Text>
          <Pressable
            onPress={toggleSearch}
            style={({ pressed }) => [
              s.iconBtn,
              {
                backgroundColor: searchVisible
                  ? colors.brand.primaryLight
                  : colors.surface.background,
                borderColor: colors.surface.border,
              },
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Search tasks"
          >
            <Feather
              name={searchVisible ? 'x' : 'search'}
              size={18}
              color={searchVisible ? colors.brand.primary : colors.text.secondary}
            />
          </Pressable>
        </View>

        {/* Search input (animated) */}
        <Animated.View style={[s.searchWrap, { height: searchHeight, overflow: 'hidden' }]}>
          <View
            style={[
              s.searchBox,
              {
                backgroundColor: colors.surface.background,
                borderColor: colors.surface.border,
              },
            ]}
          >
            <Feather name="search" size={15} color={colors.text.tertiary} />
            <TextInput
              ref={searchRef}
              value={search}
              onChangeText={setSearch}
              placeholder="Search tasks, assignees…"
              placeholderTextColor={colors.text.tertiary}
              style={[s.searchInput, { color: colors.text.primary }]}
              returnKeyType="search"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Feather name="x-circle" size={15} color={colors.text.tertiary} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Scope segment */}
        <View
          style={[s.segment, { backgroundColor: colors.surface.background }]}
        >
          <ScopeButton
            label="I manage"
            count={stats.total}
            active={scope === 'managed'}
            onPress={() => handleScopeChange('managed')}
          />
          <ScopeButton
            label="Assigned to me"
            count={stats.assignedToMe}
            active={scope === 'assigned'}
            onPress={() => handleScopeChange('assigned')}
          />
        </View>

        {/* Admin filter chips */}
        <FlatList
          horizontal
          data={FILTER_CHIPS}
          keyExtractor={(c) => c.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsContainer}
          renderItem={({ item }) => {
            const isActive = filter === item.id;
            const badge =
              item.badgeKey ? stats[item.badgeKey] : undefined;

            return (
              <Pressable
                onPress={() => handleFilterPress(item.id)}
                style={({ pressed }) => [
                  s.chip,
                  {
                    backgroundColor: isActive
                      ? colors.brand.primary
                      : colors.surface.card,
                    borderColor: isActive
                      ? colors.brand.primary
                      : colors.surface.border,
                  },
                  pressed && { opacity: 0.78 },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                {item.icon && (
                  <Feather
                    name={item.icon}
                    size={12}
                    color={isActive ? '#FFFFFF' : colors.text.secondary}
                  />
                )}
                <Text
                  style={[
                    s.chipText,
                    { color: isActive ? '#FFFFFF' : colors.text.secondary },
                  ]}
                >
                  {item.label}
                </Text>
                {badge !== undefined && badge > 0 && (
                  <View
                    style={[
                      s.chipBadge,
                      {
                        backgroundColor: isActive
                          ? 'rgba(255,255,255,0.25)'
                          : item.id === 'TO_REVIEW'
                          ? '#7C3AED'
                          : colors.brand.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.chipBadgeText,
                        { color: '#FFFFFF' },
                      ]}
                    >
                      {badge}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      </View>

      {/* ── Task list ─────────────────────────────────────────────────────── */}
      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing[2] }} />}
        SectionSeparatorComponent={() => <View style={{ height: Spacing[4] }} />}
        contentContainerStyle={[
          s.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
        ListHeaderComponent={
          totalShowing > 0 ? (
            <Text style={[s.countLabel, { color: colors.text.tertiary }]}>
              {totalShowing} task{totalShowing !== 1 ? 's' : ''} · {scope === 'managed' ? 'I manage' : 'Assigned to me'}
            </Text>
          ) : null
        }
        ListEmptyComponent={ListEmptyComponent}
      />

      {/* ── FAB ───────────────────────────────────────────────────────────── */}
      <Pressable
        onPress={handleCreateTask}
        style={({ pressed }) => [
          s.fab,
          {
            right: Spacing[4],
            bottom: insets.bottom + 90,
            backgroundColor: colors.brand.primary,
          },
          pressed && { opacity: 0.86, transform: [{ scale: 0.97 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Create task"
      >
        <Feather name="plus" size={26} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

// ─── Scope button ─────────────────────────────────────────────────────────────

function ScopeButton({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.scopeBtn,
        active && { backgroundColor: colors.surface.card },
        pressed && { opacity: 0.82 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        style={[
          s.scopeText,
          { color: active ? colors.text.primary : colors.text.secondary },
        ]}
      >
        {label}
      </Text>
      {count > 0 && (
        <View
          style={[
            s.scopeCount,
            {
              backgroundColor: active
                ? colors.brand.primary
                : colors.surface.border,
            },
          ]}
        >
          <Text
            style={[
              s.scopeCountText,
              {
                color: active ? '#FFFFFF' : colors.text.secondary,
              },
            ]}
          >
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1 },

  // Header
  header: {
    borderBottomWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2 },
      android: { elevation: 2 },
    }),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
  },
  titleText: {
    fontSize: 22,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchWrap: {
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[2],
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: Spacing[3],
    height: 40,
    gap: Spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
    paddingVertical: 0,
  },

  // Scope segment
  segment: {
    flexDirection: 'row',
    marginHorizontal: Spacing[5],
    marginBottom: Spacing[2],
    padding: 3,
    borderRadius: 11,
    gap: 3,
  },
  scopeBtn: {
    flex: 1,
    minHeight: 34,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1],
  },
  scopeText: {
    fontSize: 12.5,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  scopeCount: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeCountText: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0,
  },

  // Filter chips
  chipsContainer: {
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[3],
    gap: Spacing[2],
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    paddingHorizontal: 15,
    borderRadius: 17,
    borderWidth: 1,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  chipBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0,
  },

  // Task list
  listContent: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[4],
    gap: 0,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: Spacing[3],
  },
  groupLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.4,
  },
  groupLabelReview: {
    color: '#6D28D9',
  },
  groupBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0,
  },
  countLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
    marginBottom: Spacing[4],
  },

  // FAB
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A5CF8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
});
