import React from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { queryKeys } from '../../../src/constants/queryKeys';
import { Colors } from '../../../src/constants/colors';
import { Typography } from '../../../src/constants/typography';
import { Spacing } from '../../../src/constants/spacing';
import { ScreenHeader } from '../../../src/components/layout/ScreenHeader';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { StatCard } from '../../../src/components/dashboard/StatCard';
import { TaskCard } from '../../../src/components/task/TaskCard';
import { Skeleton, TaskCardSkeleton } from '../../../src/components/ui/Skeleton';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useUnreadCount } from '../../../src/hooks/useNotifications';
import { useRefreshControl } from '../../../src/hooks/useRefreshControl';
import { getApiClient } from '@godigitify/api-client';

const useDashboard = () =>
  useQuery({
    queryKey: queryKeys.dashboard.stats('week'),
    queryFn: () => getApiClient().get('/dashboard/stats?period=week'),
    select: (res) => (res as { data: unknown }).data,
  });

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  useUnreadCount();

  const { data, isLoading, refetch } = useDashboard();
  const { refreshing, onRefresh } = useRefreshControl(refetch);

  const stats = data as {
    totalTasks?: number;
    inProgress?: number;
    overdue?: number;
    completedThisWeek?: number;
    recentActivity?: Array<{ taskId: string; task?: { title?: string }; action?: string; createdAt?: string }>;
    myTasks?: Array<unknown>;
  } | null;

  return (
    <SafeScreen>
      <ScreenHeader
        title={`Hello, ${user?.name?.split(' ')[0] ?? 'there'}`}
        rightAction={{
          icon: 'bell',
          label: 'Notifications',
          onPress: () => router.push('/(app)/notifications'),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={undefined}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats row */}
        <View style={styles.statsRow}>
          {isLoading ? (
            <>
              <Skeleton height={120} borderRadius={12} style={{ flex: 1 }} />
              <Skeleton height={120} borderRadius={12} style={{ flex: 1 }} />
            </>
          ) : (
            <>
              <StatCard
                value={stats?.totalTasks ?? 0}
                label="Total Tasks"
                icon="list"
              />
              <StatCard
                value={stats?.overdue ?? 0}
                label="Overdue"
                icon="alert-circle"
                isAlert
              />
            </>
          )}
        </View>

        <View style={styles.statsRow}>
          {isLoading ? (
            <>
              <Skeleton height={120} borderRadius={12} style={{ flex: 1 }} />
              <Skeleton height={120} borderRadius={12} style={{ flex: 1 }} />
            </>
          ) : (
            <>
              <StatCard
                value={stats?.inProgress ?? 0}
                label="In Progress"
                icon="clock"
              />
              <StatCard
                value={stats?.completedThisWeek ?? 0}
                label="Done This Week"
                icon="check-circle"
              />
            </>
          )}
        </View>

        {/* Recent activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {isLoading ? (
          <View style={styles.taskList}>
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </View>
        ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <View style={styles.taskList}>
            {stats.recentActivity.slice(0, 5).map((item) => (
              <View key={item.taskId} style={styles.activityItem}>
                <Feather name="activity" size={14} color={Colors.brand.primary} />
                <Text style={styles.activityText} numberOfLines={2}>
                  {item.task?.title ?? 'Task'} — {item.action?.replace('_', ' ')}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="activity"
            title="No recent activity"
            subtitle="Your task updates will appear here"
          />
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing[4], gap: Spacing[4], paddingBottom: Spacing[8] },
  statsRow: { flexDirection: 'row', gap: Spacing[3] },
  sectionTitle: { ...Typography.h4, fontFamily: 'Inter-SemiBold', color: Colors.text.primary, marginTop: Spacing[2] },
  taskList: { gap: Spacing[3] },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.surface.card,
    borderRadius: 10,
    padding: Spacing[3],
  },
  activityText: { ...Typography.bodyMd, fontFamily: 'Inter-Regular', color: Colors.text.secondary, flex: 1 },
});
