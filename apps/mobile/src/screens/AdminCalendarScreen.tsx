/**
 * AdminCalendarScreen — dept deadlines, by-person filter (§4.8, HTML screen 36).
 *
 * Layout:
 *  - Month nav header + person filter chips (white card)
 *  - Month grid (white, reuses MonthGrid)
 *  - Selected-day task list on #F4F6FA with AdminCalendarTaskCard
 *  - Add Task FAB (creates task pre-filled with selected date)
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import dayjs, { type Dayjs } from 'dayjs';
import * as Haptics from 'expo-haptics';

import type { CalendarTask } from '../data/calendar.mock';
import type { AdminCalendarTask } from '../data/adminCalendar.mock';
import {
  useAdminCalendarTasks,
  useAdminCalendarMembers,
  useAdminCalendarState,
} from '../hooks/useAdminCalendar';
import { useColors } from '../constants/colors';
import { Layout, Spacing } from '../constants/spacing';

import { MonthGrid } from '../components/calendar/MonthGrid';
import { PersonFilterBar } from '../components/calendar/PersonFilterBar';
import { AdminCalendarTaskCard } from '../components/calendar/AdminCalendarTaskCard';
import { CalendarLoadingState } from '../components/calendar/CalendarLoadingState';
import { CalendarEmptyState } from '../components/calendar/CalendarEmptyState';

// ─── Type conversion ──────────────────────────────────────────────────────────

// MonthGrid is typed for CalendarTask[]; admin tasks are structurally compatible
// after mapping the optional fields to neutral defaults.
const toDotTask = (t: AdminCalendarTask): CalendarTask => ({
  id:         t.id,
  title:      t.title,
  status:     t.status,
  priority:   t.priority,
  dueDate:    t.dueDate,
  department: t.assignee.name,
  progress:   0,
});

// ─── Day task list header ─────────────────────────────────────────────────────

type DayHeaderProps = {
  date: Dayjs;
  count: number;
  filterLabel: string;
};

const DayHeader = ({ date, count, filterLabel }: DayHeaderProps) => {
  const colors = useColors();
  const label = `${date.format('ddd, D MMM')} · ${count} due`;

  return (
    <View style={dh.row}>
      <Text style={[dh.label, { color: colors.text.primary }]}>{label}</Text>
      <Text style={[dh.filter, { color: colors.brand.primary }]}>{filterLabel}</Text>
    </View>
  );
};

const dh = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  filter: {
    fontSize: 11.5,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
});

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function TaskSkeleton({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[sk.card, { backgroundColor: colors.surface.card }]}>
      <View style={[sk.stripe, { backgroundColor: colors.surface.background }]} />
      <View style={sk.inner}>
        <View style={[sk.avatar, { backgroundColor: colors.surface.background }]} />
        <View style={sk.text}>
          <View style={[sk.line, { width: '60%', backgroundColor: colors.surface.background }]} />
          <View style={[sk.line, { width: '40%', backgroundColor: colors.surface.background, marginTop: 6 }]} />
        </View>
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  card: { flexDirection: 'row', borderRadius: 12, overflow: 'hidden', marginBottom: 0 },
  stripe: { width: 4 },
  inner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, paddingLeft: 14 },
  avatar: { width: 30, height: 30, borderRadius: 15, flexShrink: 0 },
  text: { flex: 1 },
  line: { height: 11, borderRadius: 6 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AdminCalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Person filter
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(undefined);

  // Calendar state
  const {
    selectedDate,
    selectDate,
    periodAnchor,
    goNext,
    goPrev,
    today,
  } = useAdminCalendarState();

  // Data
  const {
    data: taskMap = new Map<string, AdminCalendarTask[]>(),
    isLoading: tasksLoading,
    refetch: refetchTasks,
    isRefetching,
  } = useAdminCalendarTasks(selectedMemberId);

  const {
    data: members = [],
    isLoading: membersLoading,
  } = useAdminCalendarMembers();

  // Convert admin tasks to CalendarTask for MonthGrid dot rendering
  const dotTaskMap = useMemo(() => {
    const m = new Map<string, CalendarTask[]>();
    taskMap.forEach((tasks, key) => m.set(key, tasks.map(toDotTask)));
    return m;
  }, [taskMap]);

  // Tasks for selected day, sorted by time
  const selectedDateStr = selectedDate.format('YYYY-MM-DD');
  const selectedTasks = useMemo(
    () =>
      (taskMap.get(selectedDateStr) ?? []).sort(
        (a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf(),
      ),
    [taskMap, selectedDateStr],
  );

  // Filter label for the day header
  const filterLabel = useMemo(() => {
    if (!selectedMemberId) return 'Whole team';
    const m = members.find((x) => x.id === selectedMemberId);
    return m ? (m.name.split(' ')[0] ?? m.name) : 'Whole team';
  }, [selectedMemberId, members]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleTaskPress = useCallback(
    (task: AdminCalendarTask) => {
      router.push(`/(app)/tasks/${task.id}` as Parameters<typeof router.push>[0]);
    },
    [router],
  );

  const handleAddTask = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(app)/tasks/create' as Parameters<typeof router.push>[0]);
  }, [router]);

  const handleSelectDate = useCallback(
    (d: Dayjs) => selectDate(d),
    [selectDate],
  );

  const handleMemberSelect = useCallback((id: string | undefined) => {
    setSelectedMemberId(id);
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (membersLoading && tasksLoading) {
    return <CalendarLoadingState />;
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const renderTask = ({ item }: { item: AdminCalendarTask }) => (
    <AdminCalendarTaskCard task={item} onPress={handleTaskPress} />
  );

  const listHeader = (
    <View style={styles.listHeaderWrap}>
      {/* Month grid lives in the header so it scrolls with the task list */}
      <View style={[styles.monthBlock, { backgroundColor: colors.surface.card }]}>
        <MonthGrid
          monthAnchor={periodAnchor}
          today={today}
          selectedDate={selectedDate}
          taskMap={dotTaskMap}
          onSelectDate={handleSelectDate}
        />
      </View>

      {/* Day task list label */}
      <View style={styles.daySection}>
        <DayHeader
          date={selectedDate}
          count={selectedTasks.length}
          filterLabel={filterLabel}
        />
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface.background }]}>

      {/* ── Sticky header (month nav + person filter) ──────────────────────── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 6,
            backgroundColor: colors.surface.card,
            borderBottomColor: colors.surface.border,
          },
        ]}
      >
        {/* Month nav row */}
        <View style={styles.navRow}>
          <Text style={[styles.monthTitle, { color: colors.text.primary }]}>
            {periodAnchor.format('MMMM YYYY')}
          </Text>
          <View style={styles.navBtns}>
            <Pressable
              onPress={goPrev}
              style={({ pressed }) => [
                styles.navBtn,
                { borderColor: colors.surface.border, backgroundColor: colors.surface.card },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityLabel="Previous month"
              accessibilityRole="button"
            >
              <Feather name="chevron-left" size={18} color={colors.text.secondary} />
            </Pressable>
            <Pressable
              onPress={goNext}
              style={({ pressed }) => [
                styles.navBtn,
                { borderColor: colors.surface.border, backgroundColor: colors.surface.card },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityLabel="Next month"
              accessibilityRole="button"
            >
              <Feather name="chevron-right" size={18} color={colors.text.secondary} />
            </Pressable>
          </View>
        </View>

        {/* Person filter chips */}
        <View style={{ marginHorizontal: -Spacing[5] }}>
          <PersonFilterBar
            members={members}
            selectedId={selectedMemberId}
            onSelect={handleMemberSelect}
          />
        </View>
      </View>

      {/* ── Task list (month grid + day tasks) ────────────────────────────── */}
      <FlatList
        data={tasksLoading ? [] : selectedTasks}
        keyExtractor={(t) => t.id}
        renderItem={renderTask}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          tasksLoading ? (
            <View style={[styles.daySection, { gap: 10 }]}>
              {[0, 1, 2].map((i) => (
                <TaskSkeleton key={i} colors={colors} />
              ))}
            </View>
          ) : (
            <CalendarEmptyState date={selectedDateStr} />
          )
        }
        ListFooterComponent={<View style={{ height: insets.bottom + 88 }} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetchTasks}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* ── FAB ───────────────────────────────────────────────────────────── */}
      <Pressable
        onPress={handleAddTask}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.brand.primary,
            bottom: insets.bottom + Layout.tabBarHeight + 16,
          },
          pressed && { opacity: 0.88, transform: [{ scale: 0.96 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add task"
      >
        <Feather name="plus" size={26} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing[5],
    paddingBottom: 0,
    borderBottomWidth: 1,
    shadowColor: '#EEF2F7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 0,
  },
  monthTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.1,
  },
  navBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthBlock: {
    // White block containing the month grid
  },
  list: {
    // paddingHorizontal handled inside sub-components
  },
  listHeaderWrap: {
    // Wrapper for month grid + day header
  },
  daySection: {
    paddingHorizontal: Spacing[5],
    paddingTop: 14,
  },
  fab: {
    position: 'absolute',
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(26,92,248,0.4)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
});
