/**
 * SuperAdminCalendarScreen — org-wide deadline oversight, Month/Agenda toggle
 * (HTML screens 64-65). FR-72: department deadlines show as aggregate counts
 * (dots + "N deadlines"), never task titles; the SA's own governance tasks
 * appear in full via GovernanceCalendarCard. Tapping a department rollup or
 * a day cell opens the day breakdown (screen 66).
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import dayjs, { type Dayjs } from 'dayjs';

import {
  useSuperAdminCalendarDepartments,
  useSuperAdminCalendarEntries,
  useSuperAdminCalendarState,
} from '../hooks/useSuperAdminCalendar';
import type { CalendarDayEntry } from '../services/superAdminCalendar.service';
import { useColors } from '../constants/colors';
import { Spacing } from '../constants/spacing';

import { SuperAdminMonthGrid } from '../components/calendar/SuperAdminMonthGrid';
import { DeptFilterChips } from '../components/calendar/DeptFilterChips';
import { DeptDeadlineRow } from '../components/calendar/DeptDeadlineRow';
import { GovernanceCalendarCard } from '../components/calendar/GovernanceCalendarCard';
import { CalendarLoadingState } from '../components/calendar/CalendarLoadingState';
import { EmptyState } from '../components/ui/EmptyState';

const AGENDA_SPAN_DAYS = 10;

const entryTotal = (entries: CalendarDayEntry[]) =>
  entries.reduce((sum, e) => sum + (e.kind === 'dept' ? e.count : 1), 0);

export function SuperAdminCalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selectedDeptId, setSelectedDeptId] = useState<string | undefined>(undefined);

  const { view, setView, selectedDate, selectDate, periodAnchor, goNext, goPrev, today } =
    useSuperAdminCalendarState();

  const { data: departments = [], isLoading: deptsLoading } = useSuperAdminCalendarDepartments();
  const {
    data: entryMap = new Map<string, CalendarDayEntry[]>(),
    isLoading: entriesLoading,
    refetch,
    isRefetching,
  } = useSuperAdminCalendarEntries(selectedDeptId);

  // Header subtitle: total deadlines + governance tasks in the visible month
  const monthSummary = useMemo(() => {
    let deadlineCount = 0;
    entryMap.forEach((entries, dateStr) => {
      if (!dayjs(dateStr).isSame(periodAnchor, 'month')) return;
      deadlineCount += entryTotal(entries);
    });
    return { deadlineCount, departmentCount: departments.length };
  }, [entryMap, periodAnchor, departments.length]);

  const selectedDateStr = selectedDate.format('YYYY-MM-DD');
  const selectedEntries = entryMap.get(selectedDateStr) ?? [];

  const agendaDays = useMemo(() => {
    const days: { date: Dayjs; entries: CalendarDayEntry[] }[] = [];
    for (let i = 0; i < AGENDA_SPAN_DAYS; i++) {
      const date = today.add(i, 'day');
      const entries = entryMap.get(date.format('YYYY-MM-DD')) ?? [];
      if (entries.length) days.push({ date, entries });
    }
    return days;
  }, [entryMap, today]);

  const goToBreakdown = useCallback(
    (dateStr: string) => {
      router.push(`/(app)/sa-calendar/${dateStr}` as Parameters<typeof router.push>[0]);
    },
    [router],
  );

  const handleGovernancePress = useCallback(
    (taskId: string) => {
      router.push(`/(app)/sa-tasks/assigned-by-me/${taskId}` as Parameters<typeof router.push>[0]);
    },
    [router],
  );

  const handleSelectDate = useCallback((dt: Dayjs) => selectDate(dt), [selectDate]);

  const isLoading = deptsLoading || entriesLoading;
  if (isLoading) return <CalendarLoadingState />;

  const renderMonthContent = () => (
    <View>
      <View style={[styles.monthBlock, { backgroundColor: colors.surface.card }]}>
        <SuperAdminMonthGrid
          monthAnchor={periodAnchor}
          today={today}
          selectedDate={selectedDate}
          entryMap={entryMap}
          onSelectDate={handleSelectDate}
        />
      </View>

      <View style={styles.daySection}>
        <View style={styles.dayHeaderRow}>
          <Text style={[styles.dayHeaderLabel, { color: colors.text.primary }]}>
            {selectedDate.format('ddd, D MMM')} · {entryTotal(selectedEntries)} deadlines
          </Text>
          {selectedEntries.length > 0 && (
            <Pressable onPress={() => goToBreakdown(selectedDateStr)}>
              <Text style={[styles.breakdownLink, { color: colors.brand.primary }]}>Breakdown</Text>
            </Pressable>
          )}
        </View>

        {selectedEntries.length === 0 ? (
          <EmptyState icon="calendar" title="No deadlines" subtitle={selectedDate.format('dddd, MMMM D')} />
        ) : (
          <View style={{ gap: 10 }}>
            {selectedEntries.map((entry) =>
              entry.kind === 'dept' ? (
                <DeptDeadlineRow
                  key={entry.departmentId}
                  color={entry.color}
                  name={entry.departmentName}
                  count={entry.count}
                  onPress={() => goToBreakdown(selectedDateStr)}
                />
              ) : (
                <GovernanceCalendarCard
                  key={entry.task.id}
                  task={entry.task}
                  subtitle={`You assigned · ${entry.task.assignee.name} · ${dayjs(entry.task.dueDate).format('h:mm A')}`}
                  showYoursBadge
                  onPress={() => handleGovernancePress(entry.task.id)}
                />
              ),
            )}
          </View>
        )}
      </View>
    </View>
  );

  const renderAgendaContent = () => (
    <View style={styles.daySection}>
      {agendaDays.length === 0 ? (
        <EmptyState icon="calendar" title="No deadlines" subtitle={`Next ${AGENDA_SPAN_DAYS} days`} />
      ) : (
        agendaDays.map(({ date, entries }) => {
          const dateStr = date.format('YYYY-MM-DD');
          const isFocusDay = date.isSame(today, 'day');
          const total = entryTotal(entries);
          return (
            <View key={dateStr} style={styles.agendaGroup}>
              <View style={styles.agendaDayHeader}>
                <View style={styles.agendaDateBlock}>
                  <Text style={[styles.agendaDow, { color: isFocusDay ? colors.brand.secondary : colors.text.tertiary }]}>
                    {date.format('ddd').toUpperCase()}
                  </Text>
                  <Text style={[styles.agendaDate, { color: isFocusDay ? colors.brand.secondary : colors.text.primary }]}>
                    {date.date()}
                  </Text>
                </View>
                <View style={[styles.agendaDivider, { backgroundColor: colors.surface.border }]} />
                <Text style={[styles.agendaCount, { color: colors.text.tertiary }]}>
                  {total} deadline{total === 1 ? '' : 's'}
                </Text>
              </View>

              <View style={styles.agendaEntries}>
                {entries.map((entry) =>
                  entry.kind === 'dept' ? (
                    <DeptDeadlineRow
                      key={entry.departmentId}
                      color={entry.color}
                      name={entry.departmentName}
                      count={entry.count}
                      onPress={() => goToBreakdown(dateStr)}
                    />
                  ) : (
                    <GovernanceCalendarCard
                      key={entry.task.id}
                      task={entry.task}
                      subtitle={`Yours · ${entry.task.assignee.name} · ${dayjs(entry.task.dueDate).format('h:mm A')}`}
                      onPress={() => handleGovernancePress(entry.task.id)}
                    />
                  ),
                )}
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 6, backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border },
        ]}
      >
        <View style={styles.navRow}>
          <View style={styles.titleBlock}>
            <Text style={[styles.monthTitle, { color: colors.text.primary }]}>
              {view === 'Month' ? periodAnchor.format('MMMM YYYY') : 'Upcoming'}
            </Text>
            <Text style={[styles.monthSubtitle, { color: colors.text.tertiary }]}>
              {view === 'Month'
                ? `${monthSummary.deadlineCount} deadlines · ${monthSummary.departmentCount} departments`
                : `Next ${AGENDA_SPAN_DAYS} days · org-wide`}
            </Text>
          </View>
          {view === 'Month' && (
            <View style={styles.navBtns}>
              <Pressable
                onPress={goPrev}
                style={({ pressed }) => [styles.navBtn, { borderColor: colors.surface.border }, pressed && { opacity: 0.7 }]}
                accessibilityLabel="Previous month"
                accessibilityRole="button"
              >
                <Feather name="chevron-left" size={18} color={colors.text.secondary} />
              </Pressable>
              <Pressable
                onPress={goNext}
                style={({ pressed }) => [styles.navBtn, { borderColor: colors.surface.border }, pressed && { opacity: 0.7 }]}
                accessibilityLabel="Next month"
                accessibilityRole="button"
              >
                <Feather name="chevron-right" size={18} color={colors.text.secondary} />
              </Pressable>
            </View>
          )}
        </View>

        {/* Month/Agenda segmented control */}
        <View style={[styles.segment, { backgroundColor: colors.surface.background }]}>
          <Pressable
            onPress={() => setView('Month')}
            style={[styles.segmentBtn, view === 'Month' && { backgroundColor: colors.brand.secondary }]}
          >
            <Text
              style={[
                styles.segmentLabel,
                {
                  color: view === 'Month' ? '#FFFFFF' : colors.text.secondary,
                  fontFamily: view === 'Month' ? 'Inter-SemiBold' : 'Inter-Medium',
                },
              ]}
            >
              Month
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setView('Agenda')}
            style={[styles.segmentBtn, view === 'Agenda' && { backgroundColor: colors.brand.secondary }]}
          >
            <Text
              style={[
                styles.segmentLabel,
                {
                  color: view === 'Agenda' ? '#FFFFFF' : colors.text.secondary,
                  fontFamily: view === 'Agenda' ? 'Inter-SemiBold' : 'Inter-Medium',
                },
              ]}
            >
              Agenda
            </Text>
          </Pressable>
        </View>

        {/* Department filter chips, bled to header edges */}
        <View style={{ marginHorizontal: -Spacing[5] }}>
          <DeptFilterChips departments={departments} selectedId={selectedDeptId} onSelect={setSelectedDeptId} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
      >
        {view === 'Month' ? renderMonthContent() : renderAgendaContent()}
        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: Spacing[5],
    borderBottomWidth: 1,
    shadowColor: '#EEF2F7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleBlock: { flexShrink: 1 },
  monthTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.1,
  },
  monthSubtitle: {
    fontSize: 11.5,
    fontFamily: 'Inter-Regular',
    marginTop: 1,
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
  segment: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 11,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  segmentLabel: {
    fontSize: 12.5,
    letterSpacing: 0,
  },
  monthBlock: {},
  daySection: {
    paddingHorizontal: Spacing[5],
    paddingTop: 14,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  dayHeaderLabel: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  breakdownLink: {
    fontSize: 11.5,
    fontFamily: 'Inter-SemiBold',
  },
  agendaGroup: { marginBottom: 18 },
  agendaDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  agendaDateBlock: {
    alignItems: 'center',
    flexShrink: 0,
    width: 30,
  },
  agendaDow: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },
  agendaDate: {
    fontSize: 17,
    fontFamily: 'Inter-Bold',
    lineHeight: 20,
  },
  agendaDivider: {
    flex: 1,
    height: 1,
  },
  agendaCount: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  agendaEntries: {
    gap: 9,
    marginTop: 9,
  },
});
