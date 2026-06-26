import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { queryKeys } from '../../../src/constants/queryKeys';
import { useColors } from '../../../src/constants/colors';
import { Typography } from '../../../src/constants/typography';
import { Spacing, Layout } from '../../../src/constants/spacing';
import { ScreenHeader } from '../../../src/components/layout/ScreenHeader';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { StatCard } from '../../../src/components/dashboard/StatCard';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useUnreadCount } from '../../../src/hooks/useNotifications';
import { getApiClient } from '@godigitify/api-client';

type DashboardStats = {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
};

type ActivityItem = {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  task: { id: string; title: string };
  actor: { id: string; name: string; avatarUrl?: string | null };
};

const useDashboardStats = () =>
  useQuery({
    queryKey: queryKeys.dashboard.stats('week'),
    queryFn: () => getApiClient().get<DashboardStats>('/dashboard/stats?period=week'),
    select: (res) => res.data,
  });

const useDashboardActivity = () =>
  useQuery({
    queryKey: queryKeys.dashboard.activity(),
    queryFn: () => getApiClient().get<ActivityItem[]>('/dashboard/activity'),
    select: (res) => res.data,
  });

const greeting = () => {
  const h = dayjs().hour();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const C = useColors();
  useUnreadCount();

  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useDashboardStats();
  const { data: activity, isLoading: activityLoading, refetch: refetchActivity } = useDashboardActivity();

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchActivity()]);
    setRefreshing(false);
  };

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <SafeScreen>
      <ScreenHeader
        title={`${greeting()}, ${firstName}`}
        rightAction={{
          icon: 'bell',
          label: 'Notifications',
          onPress: () => router.push('/(app)/notifications'),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.brand.primary}
          />
        }
      >
        {/* Date subtitle */}
        <Text style={[styles.dateText, { color: C.text.secondary }]}>
          {dayjs().format('dddd, D MMMM')}
        </Text>

        {/* Overdue alert banner */}
        {!statsLoading && stats && stats.overdue > 0 && (
          <Pressable
            style={({ pressed }) => [
              styles.overdueAlert,
              {
                backgroundColor: C.status.overdue.bg,
                borderColor: C.semantic.error,
              },
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/(app)/(tabs)/tasks')}
            accessibilityRole="button"
            accessibilityLabel={`${stats.overdue} overdue tasks`}
          >
            <Feather name="alert-triangle" size={16} color={C.status.overdue.text} />
            <Text style={[styles.overdueAlertText, { color: C.status.overdue.text }]}>
              You have {stats.overdue} overdue task{stats.overdue > 1 ? 's' : ''}. Tap to view.
            </Text>
            <Feather name="chevron-right" size={16} color={C.status.overdue.text} />
          </Pressable>
        )}

        {/* Stats 2×2 grid */}
        <View style={styles.statsRow}>
          {statsLoading ? (
            <>
              <Skeleton height={120} borderRadius={Layout.cardRadius} style={{ flex: 1 }} />
              <Skeleton height={120} borderRadius={Layout.cardRadius} style={{ flex: 1 }} />
            </>
          ) : statsError ? (
            <>
              <StatCard value={0} label="My Tasks" icon="list" />
              <StatCard value={0} label="Pending" icon="clock" />
            </>
          ) : (
            <>
              <StatCard value={stats?.total ?? 0} label="My Tasks" icon="list" />
              <StatCard value={stats?.pending ?? 0} label="Pending" icon="clock" />
            </>
          )}
        </View>

        <View style={styles.statsRow}>
          {statsLoading ? (
            <>
              <Skeleton height={120} borderRadius={Layout.cardRadius} style={{ flex: 1 }} />
              <Skeleton height={120} borderRadius={Layout.cardRadius} style={{ flex: 1 }} />
            </>
          ) : statsError ? (
            <>
              <StatCard value={0} label="Completed" icon="check-circle" />
              <StatCard value={0} label="Overdue" icon="alert-circle" />
            </>
          ) : (
            <>
              <StatCard value={stats?.completed ?? 0} label="Completed" icon="check-circle" />
              <StatCard
                value={stats?.overdue ?? 0}
                label="Overdue"
                icon="alert-circle"
                isAlert={!!stats?.overdue && stats.overdue > 0}
              />
            </>
          )}
        </View>

        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, { color: C.text.primary }]}>Recent Activity</Text>

        {activityLoading ? (
          <View style={styles.activityList}>
            <Skeleton height={56} borderRadius={10} />
            <Skeleton height={56} borderRadius={10} />
            <Skeleton height={56} borderRadius={10} />
          </View>
        ) : activity && activity.length > 0 ? (
          <View style={styles.activityList}>
            {activity.slice(0, 8).map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.activityItem,
                  { backgroundColor: C.surface.card },
                  pressed && styles.pressed,
                ]}
                onPress={() => router.push(`/(app)/tasks/${item.task.id}`)}
              >
                <View style={[styles.activityIcon, { backgroundColor: C.brand.primaryLight }]}>
                  <Feather name="activity" size={14} color={C.brand.primary} />
                </View>
                <View style={styles.activityBody}>
                  <Text style={[styles.activityTask, { color: C.text.primary }]} numberOfLines={1}>
                    {item.task.title}
                  </Text>
                  <Text style={[styles.activityDesc, { color: C.text.secondary }]} numberOfLines={1}>
                    {item.description} · {dayjs(item.createdAt).fromNow()}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyActivity}>
            <Feather name="activity" size={32} color={C.text.tertiary} />
            <Text style={[styles.emptyText, { color: C.text.tertiary }]}>No recent activity</Text>
          </View>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing[4], gap: Spacing[4], paddingBottom: Spacing[8] },
  dateText: { ...Typography.bodyMd, fontFamily: 'Inter-Regular', marginTop: -Spacing[2] },
  overdueAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
    borderWidth: 1,
  },
  overdueAlertText: { ...Typography.bodyMd, fontFamily: 'Inter-Medium', flex: 1 },
  statsRow: { flexDirection: 'row', gap: Spacing[3] },
  sectionTitle: { ...Typography.h4, fontFamily: 'Inter-SemiBold', marginTop: Spacing[2] },
  activityList: { gap: Spacing[2] },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    borderRadius: 10,
    padding: Spacing[3],
  },
  activityIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  activityBody: { flex: 1 },
  activityTask: { ...Typography.bodyMd, fontFamily: 'Inter-Medium' },
  activityDesc: { ...Typography.caption, fontFamily: 'Inter-Regular' },
  emptyActivity: { alignItems: 'center', paddingVertical: Spacing[8], gap: Spacing[3] },
  emptyText: { ...Typography.bodyMd, fontFamily: 'Inter-Regular' },
  pressed: { opacity: 0.8 },
});
