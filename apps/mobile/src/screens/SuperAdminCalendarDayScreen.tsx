/**
 * SuperAdminCalendarDayScreen — day breakdown for a single date (HTML screen
 * 66). Reached from the month/agenda views' department rollups. Per-day
 * department deadline counts (FR-72 aggregate) are joined with the org-wide
 * department health snapshot for admin name + overdue status; the SA's own
 * governance tasks due that day appear in full.
 */

import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import type { DeptHealth } from '@godigitify/types';

import {
  useSuperAdminCalendarEntries,
  useSuperAdminDeptHealth,
  type CalendarDayEntry,
} from '../hooks/useSuperAdminCalendar';
import { useColors } from '../constants/colors';
import { Spacing } from '../constants/spacing';

import { PrivacyNoteBanner } from '../components/task/oversight/PrivacyNoteBanner';
import { DeptHealthRow } from '../components/calendar/DeptHealthRow';
import { GovernanceCalendarCard } from '../components/calendar/GovernanceCalendarCard';
import { CalendarLoadingState } from '../components/calendar/CalendarLoadingState';
import { EmptyState } from '../components/ui/EmptyState';

const statusNoteFor = (overdueCount: number, riskLevel: DeptHealth['riskLevel']): string => {
  if (overdueCount > 0) return `${overdueCount} overdue`;
  return riskLevel === 'HEALTHY' ? 'on track' : 'at risk';
};

export function SuperAdminCalendarDayScreen() {
  const params = useLocalSearchParams<{ date: string }>();
  const dateStr = Array.isArray(params.date) ? params.date[0] : params.date;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const dateObj = useMemo(() => dayjs(dateStr), [dateStr]);

  const {
    data: entryMap = new Map<string, CalendarDayEntry[]>(),
    isLoading: entriesLoading,
    refetch,
    isRefetching,
  } = useSuperAdminCalendarEntries();
  const { data: deptHealth = [], isLoading: healthLoading } = useSuperAdminDeptHealth();

  const entries = entryMap.get(dateStr ?? '') ?? [];

  const deptRows = useMemo(() => {
    const healthById = new Map(deptHealth.map((h) => [h.departmentId, h]));
    return entries
      .filter((e): e is Extract<CalendarDayEntry, { kind: 'dept' }> => e.kind === 'dept')
      .map((e) => {
        const health = healthById.get(e.departmentId);
        return {
          departmentId: e.departmentId,
          name: e.departmentName,
          color: e.color,
          count: e.count,
          subtitle: health ? `${health.adminName} · ${statusNoteFor(health.overdueCount, health.riskLevel)}` : '—',
        };
      });
  }, [entries, deptHealth]);

  const governanceTasks = entries.filter(
    (e): e is Extract<CalendarDayEntry, { kind: 'governance' }> => e.kind === 'governance',
  );

  const totalDeadlines = deptRows.reduce((sum, r) => sum + r.count, 0) + governanceTasks.length;
  const isLoading = entriesLoading || healthLoading;

  if (isLoading) return <CalendarLoadingState />;

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            {dateObj.format('ddd, D MMMM YYYY')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.tertiary }]}>
            {totalDeadlines} deadline{totalDeadlines === 1 ? '' : 's'} across {deptRows.length} department
            {deptRows.length === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
        <PrivacyNoteBanner text="Department deadlines show as counts (FR-72). Only tasks you assigned appear with titles." />

        {deptRows.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>By department</Text>
            <View style={[styles.card, { backgroundColor: colors.surface.card }]}>
              {deptRows.map((row, i) => (
                <DeptHealthRow
                  key={row.departmentId}
                  color={row.color}
                  name={row.name}
                  subtitle={row.subtitle}
                  count={row.count}
                  isLast={i === deptRows.length - 1}
                />
              ))}
            </View>
          </>
        )}

        {governanceTasks.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.text.tertiary, marginTop: Spacing[5] }]}>
              Your assigned tasks
            </Text>
            <View style={{ gap: 10 }}>
              {governanceTasks.map((entry) => (
                <GovernanceCalendarCard
                  key={entry.task.id}
                  task={entry.task}
                  subtitle={`${entry.task.assignee.name} · ${entry.task.department.name} · due ${dayjs(entry.task.dueDate).format('h:mm A')}`}
                  onPress={() =>
                    router.push(`/(app)/sa-tasks/assigned-by-me/${entry.task.id}` as Parameters<typeof router.push>[0])
                  }
                />
              ))}
            </View>
          </>
        )}

        {deptRows.length === 0 && governanceTasks.length === 0 && (
          <EmptyState icon="calendar" title="No deadlines" subtitle={dateObj.format('dddd, MMMM D')} />
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1, minWidth: 0 },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    marginTop: 1,
  },
  scrollContent: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: Spacing[4],
    marginBottom: 9,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
});
