import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  View,
  Text,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import type { RichTask } from '@godigitify/types';
import { useTasks } from '../../../src/hooks/useTasks';
import { useTaskFilterState } from '../../../src/hooks/useTasksMock';
import type { TaskCardItem } from '../../../src/components/task/TaskCard';
import type { TaskOverflowItem } from '../../../src/components/task/TaskOverflowSheet';

import { useColors } from '../../../src/constants/colors';
import { Spacing } from '../../../src/constants/spacing';
import { Typography } from '../../../src/constants/typography';

import { TaskCard } from '../../../src/components/task/TaskCard';
import { TaskFilterBar } from '../../../src/components/task/TaskFilterBar';
import { TaskSearchBar } from '../../../src/components/task/TaskSearchBar';
import { TaskPriorityLegend } from '../../../src/components/task/TaskPriorityLegend';
import { FilterBottomSheet } from '../../../src/components/task/FilterBottomSheet';
import { TaskOverflowSheet, type OverflowAction } from '../../../src/components/task/TaskOverflowSheet';
import { TaskOverdueBanner } from '../../../src/components/task/TaskOverdueBanner';
import { TaskSectionHeader } from '../../../src/components/task/TaskSectionHeader';
import { TaskNoResults } from '../../../src/components/task/TaskNoResults';
import { TaskCardSkeleton } from '../../../src/components/ui/Skeleton';
import { EmptyState } from '../../../src/components/ui/EmptyState';

export default function TasksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const { filters, setStatus, setSearch, applySheet, hasActiveFilters } = useTaskFilterState();
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [overflowTask, setOverflowTask] = useState<TaskOverflowItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const apiFilters = useMemo(() => ({
    ...(filters.status !== 'ALL' && filters.status !== 'OVERDUE' ? { status: filters.status } : {}),
    ...(filters.priorities.length === 1 ? { priority: filters.priorities[0] } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    sortBy: filters.sortBy,
    order: filters.sortOrder,
    limit: 100,
  }), [filters]);

  const { data: listData, isLoading, refetch } = useTasks(apiFilters);

  const allTasks: TaskCardItem[] = useMemo(
    () => (listData?.tasks ?? []).map((t: RichTask) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      department: t.department ?? null,
      assignee: t.assignee,
    })),
    [listData],
  );

  const tasks = useMemo(() => {
    let result = allTasks;
    if (filters.status === 'OVERDUE') {
      result = result.filter((t) =>
        !['COMPLETED', 'CANCELLED'].includes(t.status) &&
        dayjs(t.dueDate).isBefore(dayjs()),
      );
    }
    if (filters.priorities.length > 1) {
      result = result.filter((t) => filters.priorities.includes(t.priority));
    }
    return result;
  }, [allTasks, filters]);

  const todayTasks = useMemo(
    () => tasks.filter((t) => dayjs(t.dueDate).isSame(dayjs(), 'day')),
    [tasks],
  );

  const overdueTasks = useMemo(
    () => tasks.filter((t) =>
      !['COMPLETED', 'CANCELLED'].includes(t.status) &&
      dayjs(t.dueDate).isBefore(dayjs())),
    [tasks],
  );

  const stats = {
    total: listData?.meta?.total ?? 0,
    overdue: overdueTasks.length,
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleTaskPress = useCallback((id: string) => {
    router.push(`/(app)/tasks/${id}` as Parameters<typeof router.push>[0]);
  }, [router]);

  const handleMorePress = useCallback((task: TaskCardItem) => {
    setOverflowTask({ id: task.id, title: task.title, status: task.status });
  }, []);

  const handleOverflowAction = useCallback((action: OverflowAction, task: TaskOverflowItem) => {
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
    ({ item }: { item: TaskCardItem }) => (
      <TaskCard task={item} onPress={handleTaskPress} onMorePress={handleMorePress} />
    ),
    [handleTaskPress, handleMorePress]
  );

  const renderLoading = useCallback(() => (
    <View style={styles.loadingList}>
      {[1, 2, 3, 4].map((i) => <TaskCardSkeleton key={i} />)}
    </View>
  ), []);

  const currentTasks = showSections ? upcomingTasks : tasks;
  const noResults = !isLoading && tasks.length === 0;

  const listHeader = useMemo(() => (
    <View>
      {!isLoading && overdueTasks.length > 0 && filters.status !== 'OVERDUE' && (
        <TaskOverdueBanner count={overdueTasks.length} onPress={() => setStatus('OVERDUE')} />
      )}
      <View style={styles.legendSection}>
        <TaskPriorityLegend />
      </View>
      {showSections && !isLoading && todayTasks.length > 0 && (
        <TaskSectionHeader title="Today's Tasks" count={todayTasks.length} />
      )}
    </View>
  ), [isLoading, overdueTasks, filters.status, showSections, todayTasks, setStatus]);

  const todaySection = useMemo(() => {
    if (!showSections || todayTasks.length === 0 || isLoading) return null;
    return (
      <View>
        {todayTasks.map((task) => (
          <View key={task.id} style={styles.cardWrap}>
            <TaskCard task={task} onPress={handleTaskPress} onMorePress={handleMorePress} />
          </View>
        ))}
        {upcomingTasks.length > 0 && (
          <TaskSectionHeader title="Upcoming Tasks" count={upcomingTasks.length} />
        )}
      </View>
    );
  }, [showSections, todayTasks, isLoading, upcomingTasks, handleTaskPress, handleMorePress]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      {/* ── Custom Header ── */}
      <View style={[styles.header, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>My Tasks</Text>
          <Text style={[styles.headerSub, { color: colors.text.tertiary }]}>
            {isLoading ? 'Loading…' : `${stats.total} task${stats.total !== 1 ? 's' : ''} · ${stats.overdue} overdue`}
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
            {listHeader}
            {todaySection}
          </View>
        }
        ListEmptyComponent={
          isLoading ? renderLoading() : noResults ? (
            filters.search ? (
              <TaskNoResults search={filters.search} />
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
    paddingTop: Spacing[3],
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

