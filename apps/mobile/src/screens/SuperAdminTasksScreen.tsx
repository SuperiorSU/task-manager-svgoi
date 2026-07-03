/**
 * SuperAdminTasksScreen — Tasks tab (HTML screens 57/58/60: "SA Tasks
 * Overview / Departments / Escalations"). One screen, an internal 3-way
 * segmented control — same shape as AdminTasksScreen owning its own
 * scope/filter UI rather than a shared FlatList screen.
 *
 * Per FR-72 this whole screen is aggregate-only: volume, status rollups,
 * on-time rates and SLA/escalation health — never individual task titles.
 * The one governance path (SA's own "Assign to Admin & Track" tasks) is
 * reached via the "Assigned by me" entry card and the Assign FAB, both of
 * which push into a separate, non-aggregate flow (see
 * project_super_admin_tasks memory for the full architecture rationale).
 */

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../constants/colors';
import { Layout, Spacing } from '../constants/spacing';
import { useRefreshControl } from '../hooks/useRefreshControl';
import {
  useOrgTaskOverview,
  useDeptHealthList,
  useEscalations,
  useGovernanceTaskGroups,
} from '../hooks/useSuperAdminTasks';

import { TasksSegmentedControl, type TaskOversightSegment } from '../components/task/oversight/TasksSegmentedControl';
import { PrivacyNoteBanner } from '../components/task/oversight/PrivacyNoteBanner';
import { TaskKpiCard } from '../components/task/oversight/TaskKpiCard';
import { StatusDistributionBar } from '../components/task/oversight/StatusDistributionBar';
import { DepartmentHealthCard } from '../components/task/oversight/DepartmentHealthCard';
import { EscalationCard } from '../components/task/oversight/EscalationCard';
import { StatsSkeleton } from '../components/dashboard/StatsSkeleton';
import { ListSkeleton } from '../components/dashboard/ListSkeleton';
import { EmptyState } from '../components/ui/EmptyState';

export function SuperAdminTasksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [segment, setSegment] = useState<TaskOversightSegment>('overview');

  const overviewQuery = useOrgTaskOverview();
  const departmentsQuery = useDeptHealthList();
  const escalationsQuery = useEscalations();
  const governanceQuery = useGovernanceTaskGroups();

  const activeQuery =
    segment === 'overview' ? overviewQuery : segment === 'departments' ? departmentsQuery : escalationsQuery;
  const { refreshing, onRefresh } = useRefreshControl(async () => {
    await Promise.all([overviewQuery.refetch(), departmentsQuery.refetch(), escalationsQuery.refetch(), governanceQuery.refetch()]);
  });

  const governanceTotal = governanceQuery.data?.reduce((sum, g) => sum + g.count, 0) ?? 0;
  const needsApprovalCount = governanceQuery.data?.find((g) => g.id === 'needs_approval')?.count ?? 0;

  const push = useCallback((path: string) => router.push(path as Parameters<typeof router.push>[0]), [router]);

  const goAssign = useCallback(() => push('/(app)/sa-tasks/assign'), [push]);
  const goAssignedByMe = useCallback(() => push('/(app)/sa-tasks/assigned-by-me'), [push]);
  const goDeptDetail = useCallback((deptId: string) => push(`/(app)/sa-tasks/dept/${deptId}`), [push]);

  const handleNotify = useCallback(() => {
    // Notification dispatch is out of scope for this pass — the escalation
    // card's "not yet actioned" flag drives the visible state; wiring a real
    // push notification requires the notifications backend.
  }, []);

  const handleViewAudit = useCallback(
    (deptId: string) => {
      push('/(app)/audit');
      void deptId;
    },
    [push]
  );

  return (
    <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
      <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card }]}>
        <View style={s.headerRow}>
          <View>
            <Text style={[s.title, { color: colors.text.primary }]}>Tasks</Text>
            <Text style={[s.subtitle, { color: colors.text.tertiary }]}>
              Org-wide oversight · {overviewQuery.data?.departmentCount ?? departmentsQuery.data?.length ?? 5} departments
            </Text>
          </View>
          <View style={[s.iconBtn, { borderColor: colors.surface.border }]}>
            <Feather name="sliders" size={18} color={colors.text.secondary} />
          </View>
        </View>

        <View style={s.segmentedWrap}>
          <TasksSegmentedControl value={segment} onChange={setSegment} escalationCount={escalationsQuery.data?.length ?? 0} />
        </View>
      </View>

      <ScrollView
        style={s.body}
        contentContainerStyle={[s.bodyContent, { paddingBottom: insets.bottom + Layout.tabBarHeight + 110 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} colors={[colors.brand.primary]} />
        }
      >
        {segment === 'overview' && (
          <View style={s.section}>
            <PrivacyNoteBanner text="Aggregate view — task contents stay private (FR-72). You see counts & health, not titles." />

            <Pressable
              onPress={goAssignedByMe}
              style={({ pressed }) => [s.entryCard, { backgroundColor: colors.surface.card }, pressed && s.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Assigned by me"
            >
              <View style={[s.entryIcon, { backgroundColor: '#EEF2FB' }]}>
                <Feather name="check-circle" size={20} color={colors.brand.secondary} />
              </View>
              <View style={s.entryInfo}>
                <Text style={[s.entryTitle, { color: colors.text.primary }]}>Assigned by me</Text>
                <Text style={[s.entrySubtitle, { color: colors.text.tertiary }]}>
                  {governanceTotal} governance {governanceTotal === 1 ? 'task' : 'tasks'} to admins
                </Text>
              </View>
              {needsApprovalCount > 0 && (
                <View style={s.entryBadge}>
                  <Text style={s.entryBadgeText}>{needsApprovalCount} to review</Text>
                </View>
              )}
              <Feather name="chevron-right" size={18} color={colors.surface.borderStrong} />
            </Pressable>

            {overviewQuery.isLoading ? (
              <StatsSkeleton />
            ) : overviewQuery.data ? (
              <>
                <View style={s.kpiGrid}>
                  <View style={s.kpiRow}>
                    <TaskKpiCard value={String(overviewQuery.data.activeCount)} label="Active tasks" />
                    <TaskKpiCard
                      value={String(overviewQuery.data.overdueCount)}
                      label="Overdue"
                      valueColor={colors.semantic.error}
                      trend={{ label: `${overviewQuery.data.overduePercent}%`, direction: 'down', tone: 'negative' }}
                    />
                  </View>
                  <View style={s.kpiRow}>
                    <TaskKpiCard
                      value={String(overviewQuery.data.completedThisWeek)}
                      label="Completed this week"
                      trend={{ label: '12%', direction: 'up', tone: 'positive' }}
                    />
                    <TaskKpiCard
                      value={`${overviewQuery.data.onTimeRate}%`}
                      label="On-time rate"
                      valueColor={colors.semantic.success}
                    />
                  </View>
                </View>

                <View style={[s.card, { backgroundColor: colors.surface.card }]}>
                  <View style={s.cardHeaderRow}>
                    <Text style={[s.cardTitle, { color: colors.text.secondary }]}>Status distribution</Text>
                    <Text style={[s.cardMeta, { color: colors.text.tertiary }]}>
                      {overviewQuery.data.activeCount} active
                    </Text>
                  </View>
                  <StatusDistributionBar distribution={overviewQuery.data.statusDistribution} total={overviewQuery.data.activeCount} />
                </View>
              </>
            ) : null}
          </View>
        )}

        {segment === 'departments' && (
          <View style={s.section}>
            <View style={s.sortRow}>
              <Text style={[s.sortLabel, { color: colors.text.tertiary }]}>SORTED BY RISK</Text>
              <View style={s.sortMeta}>
                <Feather name="bar-chart-2" size={14} color={colors.text.secondary} />
                <Text style={[s.sortMetaText, { color: colors.text.secondary }]}>On-time %</Text>
              </View>
            </View>

            {departmentsQuery.isLoading ? (
              <ListSkeleton rows={5} />
            ) : departmentsQuery.data && departmentsQuery.data.length > 0 ? (
              <View style={s.deptList}>
                {departmentsQuery.data.map((dept) => (
                  <DepartmentHealthCard key={dept.departmentId} dept={dept} onPress={goDeptDetail} />
                ))}
              </View>
            ) : (
              <EmptyState icon="briefcase" title="No departments yet" />
            )}
          </View>
        )}

        {segment === 'escalations' && (
          <View style={s.section}>
            {escalationsQuery.isLoading ? (
              <ListSkeleton rows={3} />
            ) : escalationsQuery.data && escalationsQuery.data.length > 0 ? (
              <>
                <View style={[s.escBanner]}>
                  <View style={s.escBannerIcon}>
                    <Feather name="alert-triangle" size={20} color={colors.semantic.error} />
                  </View>
                  <View style={s.escBannerInfo}>
                    <Text style={s.escBannerTitle}>
                      {escalationsQuery.data.length} SLA {escalationsQuery.data.length === 1 ? 'breach needs' : 'breaches need'} attention
                    </Text>
                    <Text style={s.escBannerSubtitle}>Auto-flagged from org-wide rollups · FR-72 safe</Text>
                  </View>
                </View>

                <Text style={[s.sortLabel, { color: colors.text.tertiary, marginTop: Spacing[1] }]}>ACTIVE ESCALATIONS</Text>

                <View style={s.deptList}>
                  {escalationsQuery.data.map((escalation) => (
                    <EscalationCard
                      key={escalation.id}
                      escalation={escalation}
                      onNotify={handleNotify}
                      onViewAudit={() => handleViewAudit(escalation.departmentId)}
                    />
                  ))}
                </View>
              </>
            ) : (
              <EmptyState icon="check-circle" title="No active escalations" subtitle="Everything is within SLA right now." />
            )}
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={goAssign}
        style={({ pressed }) => [
          s.fab,
          { bottom: insets.bottom + Layout.tabBarHeight + 16, backgroundColor: colors.brand.secondary },
          pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Assign task to an admin"
      >
        <Feather name="plus" size={19} color="#FFFFFF" />
        <Text style={s.fabText}>Assign</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: Spacing[5], paddingBottom: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontFamily: 'Inter-SemiBold', letterSpacing: -0.2 },
  subtitle: { fontSize: 12, fontFamily: 'Inter-Regular', marginTop: 1 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedWrap: { marginTop: 12, marginBottom: 14 },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: Spacing[4], paddingTop: Spacing[3] + 2 },
  section: { gap: Spacing[3] },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 13,
    padding: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 1,
  },
  pressed: { opacity: 0.85 },
  entryIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  entryInfo: { flex: 1, minWidth: 0 },
  entryTitle: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  entrySubtitle: { fontSize: 11.5, fontFamily: 'Inter-Regular', marginTop: 1 },
  entryBadge: { backgroundColor: '#F5F3FF', borderRadius: 11, paddingHorizontal: 9, paddingVertical: 4 },
  entryBadgeText: { fontSize: 11, fontFamily: 'Inter-Bold', color: '#6D28D9' },
  kpiGrid: { gap: 11 },
  kpiRow: { flexDirection: 'row', gap: 11 },
  card: {
    borderRadius: 14,
    padding: 17,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  cardTitle: { fontSize: 13.5, fontFamily: 'Inter-SemiBold' },
  cardMeta: { fontSize: 11, fontFamily: 'Inter-Regular' },
  cardMetaBold: { fontSize: 11, fontFamily: 'Inter-SemiBold' },
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 4 },
  sortLabel: { fontSize: 11, fontFamily: 'Inter-Bold', letterSpacing: 0.4 },
  sortMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sortMetaText: { fontSize: 12, fontFamily: 'Inter-SemiBold' },
  deptList: { gap: 10 },
  escBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 13,
  },
  escBannerIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  escBannerInfo: { flex: 1 },
  escBannerTitle: { fontSize: 13.5, fontFamily: 'Inter-SemiBold', color: '#991B1B' },
  escBannerSubtitle: { fontSize: 11.5, fontFamily: 'Inter-Regular', color: '#B45309', marginTop: 1 },
  fab: {
    position: 'absolute',
    right: 16,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    shadowColor: 'rgba(13,34,112,0.35)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 8,
  },
  fabText: { fontSize: 13.5, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
});
