import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';

import { useColors } from '../../../src/constants/colors';
import { Spacing, Layout } from '../../../src/constants/spacing';

import { useAuthStore } from '../../../src/stores/auth.store';

import {
  useEmployeeStats,
  useUpcomingTasks,
  useRecentActivity,
  useUnreadCount,
  useDashboardRefresh,
} from '../../../src/hooks/useDashboard';

import { DashboardHeader } from '../../../src/components/dashboard/DashboardHeader';
import { OverdueAlertBanner } from '../../../src/components/dashboard/OverdueAlertBanner';
import { DashboardSectionHeader } from '../../../src/components/dashboard/DashboardSectionHeader';
import { StatCard } from '../../../src/components/dashboard/StatCard';
import { UpcomingTaskItem } from '../../../src/components/dashboard/UpcomingTaskItem';
import { DashboardActivityItem } from '../../../src/components/dashboard/DashboardActivityItem';
import { StatsSkeleton } from '../../../src/components/dashboard/StatsSkeleton';
import { ListSkeleton } from '../../../src/components/dashboard/ListSkeleton';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { buildGreeting } from '../../../src/utils/greeting';

export default function EmployeeDashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const user = useAuthStore((s) => s.user);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useEmployeeStats();
  const { data: upcoming, isLoading: upcomingLoading, refetch: refetchUpcoming } = useUpcomingTasks();
  const { data: activity, isLoading: activityLoading, refetch: refetchActivity } = useRecentActivity();
  const { data: unreadCount = 0 } = useUnreadCount();

  const refetchers = useMemo(
    () => [refetchStats, refetchUpcoming, refetchActivity],
    [refetchStats, refetchUpcoming, refetchActivity]
  );
  const { refreshing, onRefresh } = useDashboardRefresh(refetchers);

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const greeting = buildGreeting();
  const dateLabel = dayjs().format('dddd, D MMMM');
  const overdueCount = stats?.overdue ?? 0;

  return (
    <View style={[styles.safe, { backgroundColor: colors.surface.background }]}>
      <DashboardHeader
        greeting={greeting}
        firstName={firstName}
        userName={user?.name ?? firstName}
        dateLabel={dateLabel}
        unreadCount={unreadCount}
        onNotificationPress={() => router.push('/(app)/notifications')}
        onProfilePress={() => router.push('/(app)/(tabs)/profile')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary}
          />
        }
      >
        {!statsLoading && overdueCount > 0 && (
          <OverdueAlertBanner
            count={overdueCount}
            onPress={() =>
              router.push({
                pathname: '/(app)/(tabs)/tasks',
                params: { filter: 'OVERDUE' },
              })
            }
          />
        )}

        {statsLoading ? (
          <StatsSkeleton />
        ) : (
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <StatCard
                value={stats?.totalTasks ?? 0}
                label="My Tasks"
                icon="list"
                variant="default"
                onPress={() => router.push('/(app)/(tabs)/tasks')}
              />
              <StatCard
                value={stats?.dueToday ?? 0}
                label="Due Today"
                icon="calendar"
                variant={stats?.dueToday && stats.dueToday > 0 ? 'alert' : 'default'}
                onPress={() => router.push('/(app)/(tabs)/tasks')}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                value={stats?.completed ?? 0}
                label="Completed"
                icon="check-circle"
                variant="success"
                onPress={() => router.push('/(app)/(tabs)/tasks')}
              />
              <StatCard
                value={overdueCount}
                label="Overdue"
                icon="alert-circle"
                variant={overdueCount > 0 ? 'alert' : 'default'}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/(tabs)/tasks',
                    params: { filter: 'OVERDUE' },
                  })
                }
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <DashboardSectionHeader
            title="Upcoming"
            actionLabel="See all"
            onActionPress={() => router.push('/(app)/(tabs)/tasks')}
          />
          {upcomingLoading ? (
            <ListSkeleton rows={3} />
          ) : upcoming && upcoming.length > 0 ? (
            <View style={styles.list}>
              {upcoming.slice(0, 5).map((task) => (
                <UpcomingTaskItem key={task.id} task={task} />
              ))}
            </View>
          ) : (
            <EmptyState icon="calendar" message="No upcoming tasks in the next 7 days" />
          )}
        </View>

        <View style={styles.section}>
          <DashboardSectionHeader
            title="Recent Activity"
            actionLabel="See all"
            onActionPress={() => router.push('/(app)/(tabs)/tasks')}
          />
          {activityLoading ? (
            <ListSkeleton rows={3} />
          ) : activity && activity.length > 0 ? (
            <View style={styles.list}>
              {activity.slice(0, 5).map((item) => (
                <DashboardActivityItem key={item.id} item={item} />
              ))}
            </View>
          ) : (
            <EmptyState icon="activity" message="No recent activity on your tasks" />
          )}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[4],
    gap: Spacing[5],
  },
  statsGrid: { gap: Spacing[3] },
  statsRow: { flexDirection: 'row', gap: Spacing[3] },
  section: { gap: Spacing[3] },
  list: { gap: Spacing[2] },
  bottomPad: { height: Spacing[4] },
});