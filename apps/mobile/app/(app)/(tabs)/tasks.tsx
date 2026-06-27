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

import { Colors } from '../../../src/constants/colors';
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
  if (count === 0) return null;
  return (
    <Pressable onPress={onPress} style={banner.row}>
      <View style={banner.iconWrap}>
        <Feather name="alert-triangle" size={16} color={Colors.semantic.error} />
      </View>
      <View style={banner.textBlock}>
        <Text style={banner.title}>
          {count} task{count > 1 ? 's' : ''} overdue
        </Text>
        <Text style={banner.sub}>Tap to review overdue tasks</Text>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.semantic.error} />
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
    backgroundColor: Colors.semantic.errorBg,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  title: { ...Typography.labelMd, fontFamily: 'Inter-SemiBold', color: Colors.semantic.error },
  sub: { ...Typography.caption, fontFamily: 'Inter-Regular', color: '#B91C1C' },
});

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, count }: { title: string; count: number }) => (
  <View style={sec.row}>
    <Text style={sec.title}>{title}</Text>
    <View style={sec.badge}>
      <Text style={sec.badgeText}>{count}</Text>
    </View>
  </View>
);

const sec = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
    backgroundColor: Colors.surface.background,
  },
  title: { ...Typography.labelMd, fontFamily: 'Inter-SemiBold', color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.6, flex: 1 },
  badge: { backgroundColor: Colors.brand.primaryLight, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { ...Typography.labelSm, fontFamily: 'Inter-Bold', color: Colors.brand.primary },
});

// ─── No Results ───────────────────────────────────────────────────────────────
const NoResults = ({ search }: { search: string }) => (
  <View style={noRes.wrap}>
    <Feather name="search" size={36} color={Colors.text.tertiary} />
    <Text style={noRes.title}>No results for "{search}"</Text>
    <Text style={noRes.sub}>Try a different name, department, or task ID</Text>
  </View>
);

const noRes = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing[2], paddingTop: 60, paddingHorizontal: Spacing[8] },
  title: { ...Typography.h4, fontFamily: 'Inter-SemiBold', color: Colors.text.primary, textAlign: 'center' },
  sub: { ...Typography.bodyMd, fontFamily: 'Inter-Regular', color: Colors.text.tertiary, textAlign: 'center' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TasksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

  // Build sections for today vs upcoming when status=ALL
  const showSections = filters.status === 'ALL' && !filters.search;
  const upcomingTasks = useMemo(() => {
    if (!showSections) return tasks;
    return tasks.filter((t) => !todayTasks.some((td) => td.id === t.id));
  }, [tasks, todayTasks, showSections]);

  // ── Render helpers ──
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

  // ── Header (sticky) ──
  const ListHeader = (
    <View>
      {/* Overdue banner */}
      {!isLoading && overdueTasks.length > 0 && filters.status !== 'OVERDUE' && (
        <OverdueBanner count={overdueTasks.length} onPress={() => setStatus('OVERDUE')} />
      )}

      {/* Priority legend */}
      <View style={styles.legendSection}>
        <TaskPriorityLegend />
      </View>

      {/* Today section header (only in grouped view) */}
      {showSections && !isLoading && todayTasks.length > 0 && (
        <SectionHeader title="Today's Tasks" count={todayTasks.length} />
      )}
    </View>
  );

  // ── Today Tasks inlined before main list if showing sections ──
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
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Custom Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Tasks</Text>
          <Text style={styles.headerSub}>
            {isLoading ? 'Loading…' : `${stats.total} total · ${stats.overdue} overdue`}
          </Text>
        </View>
        <Pressable
          onPress={() => setFilterSheetVisible(true)}
          style={({ pressed }) => [styles.filterBtn, hasActiveFilters && styles.filterBtnActive, pressed && { opacity: 0.8 }]}
          accessibilityLabel="Open filters"
        >
          <Feather
            name="sliders"
            size={18}
            color={hasActiveFilters ? Colors.text.inverse : Colors.text.secondary}
          />
          {hasActiveFilters && <View style={styles.filterDot} />}
        </Pressable>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchWrap}>
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
            tintColor={Colors.brand.primary}
            colors={[Colors.brand.primary]}
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

      {/* ── Filter Bottom Sheet ── */}
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

      {/* ── Overflow Action Sheet ── */}
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
  screen: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[3],
    backgroundColor: Colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface.border,
  },
  headerTitle: {
    ...Typography.h2,
    fontFamily: 'Inter-Bold',
    color: Colors.text.primary,
  },
  headerSub: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface.background,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.semantic.error,
    borderWidth: 1,
    borderColor: Colors.surface.card,
  },
  searchWrap: {
    backgroundColor: Colors.surface.card,
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface.border,
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
