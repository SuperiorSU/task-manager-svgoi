import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';

import { useAuthStore } from '../stores/auth.store';
import { useColors } from '../constants/colors';
import { Layout, Spacing } from '../constants/spacing';
import { buildGreeting } from '../utils/greeting';
import { useUnreadCount } from '../hooks/useDashboard';
import {
  useAuditFeed,
  useDepartmentComparison,
  useOrgStats,
  useSystemHealth,
} from '../hooks/useSuperAdminDashboard';
import { SuperAdminHeader } from '../components/dashboard/SuperAdminHeader';
import { OrgStatCard } from '../components/dashboard/OrgStatCard';
import { OrgCompletionRing } from '../components/dashboard/OrgCompletionRing';
import { SystemHealthGrid } from '../components/dashboard/SystemHealthGrid';
import { DepartmentComparisonCard } from '../components/dashboard/DepartmentComparisonCard';
import { AuditFeedCard } from '../components/dashboard/AuditFeedCard';
import { StatsSkeleton } from '../components/dashboard/StatsSkeleton';
import { ListSkeleton } from '../components/dashboard/ListSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useRefetchOnFocus } from '../hooks/useRefetchOnFocus';

export function SuperAdminDashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);

  const { data: unreadCount = 0 } = useUnreadCount();
  const orgStats = useOrgStats();
  const systemHealth = useSystemHealth();
  const deptComparison = useDepartmentComparison();
  const auditFeed = useAuditFeed();

  useRefetchOnFocus(
    useMemo(
      () => [orgStats.refetch, systemHealth.refetch, deptComparison.refetch, auditFeed.refetch],
      [orgStats.refetch, systemHealth.refetch, deptComparison.refetch, auditFeed.refetch]
    )
  );

  const push = (path: string) => router.push(path as Parameters<typeof router.push>[0]);

  const firstName = user?.name?.split(' ')[0] ?? 'Super Admin';
  const dateLabel = dayjs().format('dddd, D MMMM');

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      orgStats.refetch(),
      systemHealth.refetch(),
      deptComparison.refetch(),
      auditFeed.refetch(),
    ]);
    setRefreshing(false);
  };

  const stats = orgStats.data;

  return (
    <View style={[styles.root, { backgroundColor: colors.surface.background }]}>
      <SuperAdminHeader
        greeting={buildGreeting()}
        firstName={firstName}
        userName={user?.name ?? firstName}
        dateLabel={dateLabel}
        scopeLabel="All departments"
        unreadCount={unreadCount}
        onNotificationPress={() => push('/(app)/notifications')}
        onProfilePress={() => push('/(app)/(sa)/profile')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing[10] }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
      >
        {/* ── Org stat grid ─────────────────────────────────────────────── */}
        {orgStats.isLoading || !stats ? (
          <StatsSkeleton />
        ) : (
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <OrgStatCard
                value={stats.totalTasks}
                label="Total Tasks"
                icon="list"
                iconBg="#EFF6FF"
                iconColor="#1A5CF8"
                onPress={() => push('/(app)/(sa)/tasks')}
              />
              <OrgStatCard
                value={stats.departments}
                label="Departments"
                icon="briefcase"
                iconBg="#EEF2FF"
                iconColor="#4F46E5"
                onPress={() => push('/(app)/(sa)/people')}
              />
            </View>
            <View style={styles.statsRow}>
              <OrgStatCard
                value={stats.orgCompleted}
                label="Org Completed"
                icon="check-circle"
                iconBg="#F0FDF4"
                iconColor="#15803D"
                onPress={() => push('/(app)/(sa)/tasks')}
              />
              <OrgStatCard
                value={stats.orgOverdue}
                label="Org Overdue"
                icon="alert-triangle"
                iconBg="#FEE2E2"
                iconColor="#DC2626"
                cardBg={stats.orgOverdue > 0 ? '#FEF2F2' : undefined}
                cardBorder={stats.orgOverdue > 0 ? '#FECACA' : undefined}
                valueColor={stats.orgOverdue > 0 ? '#DC2626' : undefined}
                onPress={() => push('/(app)/(sa)/tasks')}
              />
            </View>
          </View>
        )}

        {/* ── Org completion ring ──────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Org completion
          </Text>
          {orgStats.isLoading || !stats ? (
            <ListSkeleton rows={1} />
          ) : (
            <OrgCompletionRing
              percentage={stats.completionRate}
              completedCount={stats.orgCompleted}
              inFlightCount={stats.inFlight}
              subtitle="This month · all departments"
            />
          )}
        </View>

        {/* ── System health ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>System health</Text>
          {systemHealth.isLoading || !systemHealth.data ? (
            <StatsSkeleton />
          ) : (
            <SystemHealthGrid
              activeUsers={systemHealth.data.activeUsers}
              admins={systemHealth.data.admins}
              departments={systemHealth.data.departments}
            />
          )}
        </View>

        {/* ── Department comparison ────────────────────────────────────── */}
        {deptComparison.isLoading ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Department comparison
            </Text>
            <ListSkeleton rows={5} />
          </View>
        ) : deptComparison.data && deptComparison.data.length > 0 ? (
          <DepartmentComparisonCard entries={deptComparison.data} />
        ) : (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Department comparison
            </Text>
            <EmptyState icon="briefcase" message="No department data available" />
          </View>
        )}

        {/* ── Recent audit events ──────────────────────────────────────── */}
        {auditFeed.isLoading ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Recent audit events
            </Text>
            <ListSkeleton rows={4} />
          </View>
        ) : auditFeed.data && auditFeed.data.length > 0 ? (
          <AuditFeedCard events={auditFeed.data} onSeeLogPress={() => push('/(app)/audit')} />
        ) : (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Recent audit events
            </Text>
            <EmptyState icon="shield" message="No audit events yet" />
          </View>
        )}

        {/* ── FR-72 governance note ────────────────────────────────────── */}
        <View
          style={[styles.governanceNote, { backgroundColor: colors.surface.background, borderColor: colors.surface.border }]}
        >
          <Text style={[styles.governanceText, { color: colors.text.tertiary }]}>
            Super Admin sees org rollups and audit trails, not the contents of individual
            employees&apos; tasks. Task privacy is preserved across every role (FR-72).
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[4],
    gap: Spacing[5],
  },
  statsGrid: { gap: Spacing[3] },
  statsRow: { flexDirection: 'row', gap: Spacing[3] },
  section: { gap: Spacing[3] },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  governanceNote: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing[3] + 2,
  },
  governanceText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
  },
});
