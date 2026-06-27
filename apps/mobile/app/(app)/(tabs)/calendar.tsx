import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import type { CalendarTask } from '../../../src/data/calendar.mock';
import {
  useCalendarTasks,
  useCalendarState,
} from '../../../src/hooks/useCalendar';

import { Colors } from '../../../src/constants/colors';
import { Typography } from '../../../src/constants/typography';
import { Spacing, Layout } from '../../../src/constants/spacing';

import { CalendarHeader } from '../../../src/components/calendar/CalendarHeader';
import { CalendarLegend } from '../../../src/components/calendar/CalendarLegend';
import { CalendarDayTaskCard } from '../../../src/components/calendar/CalendarDayTaskCard';
import { MonthGrid } from '../../../src/components/calendar/MonthGrid';
import { WeekStrip } from '../../../src/components/calendar/WeekStrip';
import { WeekTimeGrid } from '../../../src/components/calendar/WeekTimeGrid';
import { DayTimeline } from '../../../src/components/calendar/DayTimeline';
import { Skeleton } from '../../../src/components/ui/Skeleton';

// ─── Empty State ──────────────────────────────────────────────────────────────

const CalendarEmptyState = ({ date }: { date: string }) => (
  <View style={empty.wrap}>
    <View style={empty.iconWrap}>
      <Feather name="calendar" size={32} color={Colors.text.tertiary} />
    </View>
    <Text style={empty.title}>No tasks on this day</Text>
    <Text style={empty.sub}>{dayjs(date).format('dddd, MMMM D')}</Text>
  </View>
);

const empty = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[10],
    paddingHorizontal: Spacing[8],
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  title: {
    ...Typography.h4,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  sub: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});

// ─── Task list section header ─────────────────────────────────────────────────

const TaskListHeader = ({ date, count }: { date: string; count: number }) => (
  <View style={listHead.row}>
    <Text style={listHead.text}>
      {dayjs(date).format('dddd, D MMMM')}
    </Text>
    <View style={listHead.badge}>
      <Text style={listHead.badgeText}>
        {count} task{count !== 1 ? 's' : ''}
      </Text>
    </View>
  </View>
);

const listHead = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  text: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.secondary,
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.brand.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    ...Typography.labelSm,
    fontFamily: 'Inter-SemiBold',
    color: Colors.brand.primary,
  },
});

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const CalendarSkeleton = () => (
  <View style={sk.wrap}>
    <Skeleton height={180} borderRadius={0} />
    <View style={sk.rows}>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} height={72} borderRadius={Layout.cardRadius} />
      ))}
    </View>
  </View>
);

const sk = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.surface.background },
  rows: { gap: Spacing[3], padding: Spacing[4] },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();

  const { data: taskMap = new Map<string, CalendarTask[]>(), isLoading, refetch } = useCalendarTasks();

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

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.skHeader}>
          <Skeleton height={22} width={160} borderRadius={6} />
          <View style={styles.skToggle}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={32} width={72} borderRadius={8} />
            ))}
          </View>
        </View>
        <CalendarSkeleton />
      </View>
    );
  }

  // ── Reusable task FlatList (month + day selected-day list) ─────────────────
  const renderTask = ({ item }: { item: CalendarTask }) => (
    <CalendarDayTaskCard task={item} onPress={handleTaskPress} />
  );

  // ── Month view ─────────────────────────────────────────────────────────────
  if (view === 'Month') {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
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
              tintColor={Colors.brand.primary}
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
      </View>
    );
  }

  // ── Week view ──────────────────────────────────────────────────────────────
  if (view === 'Week') {
    const weekStart = getMondayOf(periodAnchor);
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
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
      </View>
    );
  }

  // ── Day view ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface.background,
    ...Platform.select({
      ios: {},
      android: {},
    }),
  },
  skHeader: {
    backgroundColor: Colors.surface.card,
    padding: Spacing[5],
    gap: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface.border,
  },
  skToggle: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  taskList: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[8],
  },
});
