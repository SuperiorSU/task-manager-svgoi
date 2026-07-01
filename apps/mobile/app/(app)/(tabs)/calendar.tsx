import React, { useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';

import {
  useCalendarTasks,
  useCalendarState,
  type CalendarTask,
} from '../../../src/hooks/useCalendar';

import { useColors } from '../../../src/constants/colors';
import { Spacing } from '../../../src/constants/spacing';

import { CalendarHeader } from '../../../src/components/calendar/CalendarHeader';
import { CalendarLegend } from '../../../src/components/calendar/CalendarLegend';
import { CalendarDayTaskCard } from '../../../src/components/calendar/CalendarDayTaskCard';
import { MonthGrid } from '../../../src/components/calendar/MonthGrid';
import { WeekStrip } from '../../../src/components/calendar/WeekStrip';
import { WeekTimeGrid } from '../../../src/components/calendar/WeekTimeGrid';
import { DayTimeline } from '../../../src/components/calendar/DayTimeline';
import { CalendarEmptyState } from '../../../src/components/calendar/CalendarEmptyState';
import { TaskListHeader } from '../../../src/components/calendar/TaskListHeader';
import { CalendarLoadingState } from '../../../src/components/calendar/CalendarLoadingState';
import { CalendarFab } from '../../../src/components/calendar/CalendarFab';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const {
    view,
    switchView,
    selectedDate,
    selectDate,
    periodAnchor,
    goNext,
    goPrev,
    today,
    getMondayOf,
  } = useCalendarState();

  const { data: taskMap = new Map<string, CalendarTask[]>(), isLoading, refetch } = useCalendarTasks(periodAnchor, view);

  const selectedDateStr = selectedDate.format('YYYY-MM-DD');

  const selectedTasks = useMemo(
    () =>
      (taskMap.get(selectedDateStr) ?? []).sort(
        (a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf(),
      ),
    [taskMap, selectedDateStr],
  );

  const router = useRouter();

  const handleTaskPress = useCallback((task: CalendarTask) => {
    router.push(`/(app)/tasks/${task.id}`);
  }, [router]);

  const handleSelectDate = useCallback(
    (date: Parameters<typeof selectDate>[0]) => selectDate(date),
    [selectDate],
  );

  const handleAddTask = useCallback(() => {
    router.push('/(app)/tasks/create');
  }, [router]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return <CalendarLoadingState />;
  }

  const renderTask = ({ item }: { item: CalendarTask }) => (
    <CalendarDayTaskCard task={item} onPress={handleTaskPress} />
  );

  // ── Month view ─────────────────────────────────────────────────────────────
  if (view === 'Month') {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
        <CalendarHeader
          view={view}
          periodAnchor={periodAnchor}
          onPrev={goPrev}
          onNext={goNext}
          onViewChange={switchView}
        />
        <FlatList
          data={selectedTasks}
          keyExtractor={(t) => t.id}
          renderItem={renderTask}
          ItemSeparatorComponent={() => <View style={{ height: Spacing[2] }} />}
          contentContainerStyle={[
            styles.taskList,
            { paddingBottom: insets.bottom + Spacing[8] },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={colors.brand.primary}
            />
          }
          ListHeaderComponent={
            <View>
              <MonthGrid
                monthAnchor={periodAnchor}
                today={today}
                selectedDate={selectedDate}
                taskMap={taskMap}
                onSelectDate={handleSelectDate}
              />
              <CalendarLegend />
              <TaskListHeader date={selectedDateStr} count={selectedTasks.length} />
            </View>
          }
          ListEmptyComponent={<CalendarEmptyState date={selectedDateStr} />}
          showsVerticalScrollIndicator={false}
        />
        <CalendarFab onPress={handleAddTask} />
      </View>
    );
  }

  // ── Week view ──────────────────────────────────────────────────────────────
  if (view === 'Week') {
    const weekStart = getMondayOf(periodAnchor);
    return (
      <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
        <CalendarHeader
          view={view}
          periodAnchor={weekStart}
          onPrev={goPrev}
          onNext={goNext}
          onViewChange={switchView}
        />
        <WeekStrip
          weekStart={weekStart}
          today={today}
          selectedDate={selectedDate}
          taskMap={taskMap}
          onSelectDate={handleSelectDate}
        />
        <WeekTimeGrid
          weekStart={weekStart}
          today={today}
          selectedDate={selectedDate}
          taskMap={taskMap}
          onSelectDate={handleSelectDate}
          onTaskPress={handleTaskPress}
        />
        <CalendarFab onPress={handleAddTask} />
      </View>
    );
  }

  // ── Day view ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      <CalendarHeader
        view={view}
        periodAnchor={periodAnchor}
        onPrev={goPrev}
        onNext={goNext}
        onViewChange={switchView}
      />
      <DayTimeline
        date={periodAnchor}
        today={today}
        taskMap={taskMap}
        onTaskPress={handleTaskPress}
      />
      <CalendarFab onPress={handleAddTask} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  taskList: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[8],
  },
});