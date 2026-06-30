import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { useColors } from '../../../src/constants/colors';
import { Typography } from '../../../src/constants/typography';
import { Spacing, Layout } from '../../../src/constants/spacing';

import { useAuthStore } from '../../../src/stores/auth.store';

import {
  useEmployeeStats,
  useUpcomingTasks,
  useRecentActivity,
  useMockUnreadCount,
  useDashboardRefresh,
} from '../../../src/hooks/useDashboard';

import { DashboardHeader } from '../../../src/components/dashboard/DashboardHeader';
import { OverdueAlertBanner } from '../../../src/components/dashboard/OverdueAlertBanner';
import { DashboardSectionHeader } from '../../../src/components/dashboard/DashboardSectionHeader';
import { StatCard } from '../../../src/components/dashboard/StatCard';
import { UpcomingTaskItem } from '../../../src/components/dashboard/UpcomingTaskItem';
import { DashboardActivityItem } from '../../../src/components/dashboard/DashboardActivityItem';
import { Skeleton } from '../../../src/components/ui/Skeleton';

function buildGreeting(): string {
  const h = dayjs().hour();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const StatsSkeleton = () => (
  <View style={styles.statsGrid}>
    <View style={styles.statsRow}>
      <Skeleton height={130} borderRadius={Layout.cardRadius} style={styles.statFlex} />
      <Skeleton height={130} borderRadius={Layout.cardRadius} style={styles.statFlex} />
    </View>
    <View style={styles.statsRow}>
      <Skeleton height={130} borderRadius={Layout.cardRadius} style={styles.statFlex} />
      <Skeleton height={130} borderRadius={Layout.cardRadius} style={styles.statFlex} />
    </View>
  </View>
);

const ListSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <View style={styles.skeletonList}>
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} height={72} borderRadius={12} />
    ))}
  </View>
);

const EmptyState = ({
  icon,
  message,
}: {
  icon: keyof typeof Feather.glyphMap;
  message: string;
}) => {
  const colors = useColors();
  return (
    <View style={[
      styles.emptyWrap,
      { backgroundColor: colors.surface.card, borderColor: colors.surface.border },
    ]}>
      <View style={[styles.emptyIconBg, { backgroundColor: colors.surface.background }]}>
        <Feather name={icon} size={28} color={colors.text.tertiary} />
      </View>
      <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>{message}</Text>
    </View>
  );
};

export default function EmployeeDashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const user = useAuthStore((s) => s.user);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useEmployeeStats();
  const { data: upcoming, isLoading: upcomingLoading, refetch: refetchUpcoming } = useUpcomingTasks();
  const { data: activity, isLoading: activityLoading, refetch: refetchActivity } = useRecentActivity();
  const { data: unreadCount = 0 } = useMockUnreadCount();

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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surface.background }]} edges={['top']}>
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
                value={stats?.myTasks ?? 0}
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
    </SafeAreaView>
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
  statFlex: { flex: 1 },
  skeletonList: { gap: Spacing[2], marginTop: Spacing[3] },
  section: { gap: Spacing[3] },
  list: { gap: Spacing[2] },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: Spacing[6],
    gap: Spacing[3],
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingHorizontal: Spacing[6],
  },
  bottomPad: { height: Spacing[4] },
});
