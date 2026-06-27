import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import type { MockTask } from '../../../src/data/tasks.mock';
import {
  useMockTaskList,
  useMockTaskStats,
  useTaskFilterState,
} from '../../../src/hooks/useTasksMock';

import { useColors } from '../../../src/constants/colors';
import { Spacing, Layout } from '../../../src/constants/spacing';
import { Typography } from '../../../src/constants/typography';

import { TaskCard } from '../../../src/components/task/TaskCard';
import { TaskFilterBar } from '../../../src/components/task/TaskFilterBar';
import { TaskSearchBar } from '../../../src/components/task/TaskSearchBar';
import { TaskPriorityLegend } from '../../../src/components/task/TaskPriorityLegend';
import { FilterBottomSheet } from '../../../src/components/task/FilterBottomSheet';
import { TaskOverflowSheet, type OverflowAction } from '../../../src/components/task/TaskOverflowSheet';
import { TaskCardSkeleton } from '../../../src/components/ui/Skeleton';
import { EmptyState } from '../../../src/components/ui/EmptyState';

// ─── Overdue Banner ───────────────────────────────────────────────────────────

const OverdueBanner = ({ count, onPress }: { count: number; onPress: () => void }) => {
  const colors = useColors();
  if (count === 0) return null;
  return (
    <Pressable
      onPress={onPress}
      style={[banner.row, { backgroundColor: colors.semantic.errorBg, borderColor: colors.status.overdue.solid }]}
    >
      <View style={banner.iconWrap}>
        <Feather name="alert-triangle" size={16} color={colors.semantic.error} />
      </View>
      <View style={banner.textBlock}>
        <Text style={[banner.title, { color: colors.semantic.error }]}>
          {count} task{count > 1 ? 's' : ''} overdue
        </Text>
        <Text style={[banner.sub, { color: colors.status.overdue.text }]}>Tap to review overdue tasks</Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.semantic.error} />
    </Pressable>
  );
};

const banner = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[3],
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  title: { ...Typography.labelMd, fontFamily: 'Inter-SemiBold' },
  sub: { ...Typography.caption, fontFamily: 'Inter-Regular' },
});

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = ({ title, count }: { title: string; count: number }) => {
  const colors = useColors();
  return (
    <View style={[sec.row, { backgroundColor: colors.surface.background }]}>
      <Text style={[sec.title, { color: colors.text.secondary }]}>{title}</Text>
      <View style={[sec.badge, { backgroundColor: colors.brand.primaryLight }]}>
        <Text style={[sec.badgeText, { color: colors.brand.primary }]}>{count}</Text>
      </View>
    </View>
  );
};

const sec = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  title: { ...Typography.labelMd, fontFamily: 'Inter-SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, flex: 1 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { ...Typography.labelSm, fontFamily: 'Inter-Bold' },
});

// ─── No Results ───────────────────────────────────────────────────────────────

const NoResults = ({ search }: { search: string }) => {
  const colors = useColors();
  return (
    <View style={noRes.wrap}>
      <Feather name="search" size={36} color={colors.text.tertiary} />
      <Text style={[noRes.title, { color: colors.text.primary }]}>No results for "{search}"</Text>
      <Text style={[noRes.sub, { color: colors.text.tertiary }]}>Try a different name, department, or task ID</Text>
    </View>
  );
};

const noRes = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing[2], paddingTop: 60, paddingHorizontal: Spacing[8] },
  title: { ...Typography.h4, fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  sub: { ...Typography.bodyMd, fontFamily: 'Inter-Regular', textAlign: 'center' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TasksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const { filters, setStatus, setSearch, applySheet, hasActiveFilters } = useTaskFilterState();
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [overflowTask, setOverflowTask] = useState<MockTask | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { tasks, todayTasks, overdueTasks, isLoading } = useMockTaskList(filters);
  const { data: statsData } = useMockTaskStats();
  const stats = statsData ?? { total: 0, pending: 0, inProgress: 0, completed: 0, underReview: 0, overdue: 0 };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  const handleTaskPress = useCallback((id: string) => {
    router.push(`/(app)/tasks/${id}` as Parameters<typeof router.push>[0]);
  }, [router]);

  const handleMorePress = useCallback((task: MockTask) => {
    setOverflowTask(task);
  }, []);

  const handleOverflowAction = useCallback((action: OverflowAction, task: MockTask) => {
    if (action === 'view') {
      router.push(`/(app)/tasks/${task.id}` as Parameters<typeof router.push>[0]);
    }
  }, [router]);

  const showSections = filters.status === 'ALL' && !filters.search;
  const upcomingTasks = useMemo(() => {
    if (!showSections) return tasks;
    return tasks.filter((t) => !todayTasks.some((td) => td.id === t.id));
  }, [tasks, todayTasks, showSections]);

  const renderTask = useCallback(
    ({ item }: { item: MockTask }) => (
      <TaskCard task={item} onPress={handleTaskPress} onMorePress={handleMorePress} />
    ),
    [handleTaskPress, handleMorePress]
  );

  const renderLoading = () => (
    <View style={styles.loadingList}>
      {[1, 2, 3, 4].map((i) => <TaskCardSkeleton key={i} />)}
    </View>
  );

  const ListHeader = (
    <View>
      {!isLoading && overdueTasks.length > 0 && filters.status !== 'OVERDUE' && (
        <OverdueBanner count={overdueTasks.length} onPress={() => setStatus('OVERDUE')} />
      )}
      <View style={styles.legendSection}>
        <TaskPriorityLegend />
      </View>
      {showSections && !isLoading && todayTasks.length > 0 && (
        <SectionHeader title="Today's Tasks" count={todayTasks.length} />
      )}
    </View>
  );

  const todaySection = showSections && todayTasks.length > 0 && !isLoading ? (
    <View>
      {todayTasks.map((task) => (
        <View key={task.id} style={styles.cardWrap}>
          <TaskCard task={task} onPress={handleTaskPress} onMorePress={handleMorePress} />
        </View>
      ))}
      {upcomingTasks.length > 0 && (
        <SectionHeader title="Upcoming Tasks" count={upcomingTasks.length} />
      )}
    </View>
  ) : null;

  const currentTasks = showSections ? upcomingTasks : tasks;
  const noResults = !isLoading && tasks.length === 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      {/* ── Custom Header ── */}
      <View style={[styles.header, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>My Tasks</Text>
          <Text style={[styles.headerSub, { color: colors.text.tertiary }]}>
            {isLoading ? 'Loading…' : `${stats.total} total · ${stats.overdue} overdue`}
          </Text>
        </View>
        <Pressable
          onPress={() => setFilterSheetVisible(true)}
          style={({ pressed }) => [
            styles.filterBtn,
            { backgroundColor: colors.surface.background, borderColor: colors.surface.border },
            hasActiveFilters && { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary },
            pressed && { opacity: 0.8 },
          ]}
          accessibilityLabel="Open filters"
        >
          <Feather
            name="sliders"
            size={18}
            color={hasActiveFilters ? colors.text.inverse : colors.text.secondary}
          />
          {hasActiveFilters && (
            <View style={[styles.filterDot, { backgroundColor: colors.semantic.error, borderColor: colors.surface.card }]} />
          )}
        </Pressable>
      </View>

      {/* ── Search Bar ── */}
      <View style={[styles.searchWrap, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <TaskSearchBar value={filters.search} onChangeText={setSearch} />
      </View>

      {/* ── Status Filter Chips ── */}
      <TaskFilterBar active={filters.status} onChange={setStatus} />

      {/* ── Main List ── */}
      <FlatList
        data={isLoading ? [] : currentTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing[8] }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing[3] }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
        ListHeaderComponent={
          <View>
            {ListHeader}
            {todaySection}
          </View>
        }
        ListEmptyComponent={
          isLoading ? renderLoading() : noResults ? (
            filters.search ? (
              <NoResults search={filters.search} />
            ) : (
              <EmptyState
                icon="check-square"
                title="All caught up!"
                subtitle={
                  hasActiveFilters
                    ? 'No tasks match your current filters'
                    : 'Tasks assigned to you will appear here'
                }
              />
            )
          ) : null
        }
        renderItem={renderTask}
      />

      <FilterBottomSheet
        visible={filterSheetVisible}
        current={{
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          priorities: filters.priorities,
          departmentId: filters.departmentId,
        }}
        onApply={(sheet) => applySheet(sheet)}
        onClose={() => setFilterSheetVisible(false)}
      />

      <TaskOverflowSheet
        visible={overflowTask !== null}
        task={overflowTask}
        onAction={handleOverflowAction}
        onClose={() => setOverflowTask(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...Typography.h2,
    fontFamily: 'Inter-Bold',
  },
  headerSub: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
  },
  searchWrap: {
    borderBottomWidth: 1,
  },
  legendSection: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
  },
  list: {
    paddingBottom: Spacing[8],
  },
  loadingList: {
    gap: Spacing[3],
    padding: Spacing[4],
  },
  cardWrap: {
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[3],
  },
});
