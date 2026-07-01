import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { Feather } from '@expo/vector-icons';

import type { Role } from '@godigitify/types';
import { MOCK_DEPARTMENTS, MOCK_TASKS, MOCK_USERS, isTaskDueToday, isTaskOverdue } from '../data/tasks.mock';
import { useAuthStore } from '../stores/auth.store';
import { useColors } from '../constants/colors';
import { Layout, Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { buildGreeting } from '../utils/greeting';
import { useMockUnreadCount } from '../hooks/useDashboard';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { OverdueAlertBanner } from '../components/dashboard/OverdueAlertBanner';
import { StatCard } from '../components/dashboard/StatCard';
import { DashboardSectionHeader } from '../components/dashboard/DashboardSectionHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { TaskStatusBadge } from '../components/task/TaskStatusBadge';
import { TaskPriorityIndicator } from '../components/task/TaskPriorityIndicator';

type Props = {
  role: Extract<Role, 'ADMIN' | 'SUPER_ADMIN'>;
};

const routeGroupByRole = {
  ADMIN: '(admin)',
  SUPER_ADMIN: '(sa)',
} as const;

const roleCopy = {
  ADMIN: {
    scope: 'Department overview',
    teamLabel: 'Team',
    taskLabel: 'Department Tasks',
  },
  SUPER_ADMIN: {
    scope: 'Organisation overview',
    teamLabel: 'People',
    taskLabel: 'All Tasks',
  },
} as const;

export function ManagerDashboardScreen({ role }: Props) {
  const router = useRouter();
  const colors = useColors();
  const user = useAuthStore((s) => s.user);
  const { data: unreadCount = 0 } = useMockUnreadCount();
  const [refreshing, setRefreshing] = useState(false);

  const routeGroup = routeGroupByRole[role];
  const copy = roleCopy[role];

  const pushRoute = (path: string) => {
    router.push(path as Parameters<typeof router.push>[0]);
  };

  const stats = useMemo(() => {
    const totalTasks = MOCK_TASKS.length;
    const completed = MOCK_TASKS.filter((task) => task.status === 'COMPLETED').length;
    const inProgress = MOCK_TASKS.filter((task) => task.status === 'IN_PROGRESS').length;
    const underReview = MOCK_TASKS.filter((task) => task.status === 'UNDER_REVIEW').length;
    const overdue = MOCK_TASKS.filter(isTaskOverdue).length;
    const dueToday = MOCK_TASKS.filter(isTaskDueToday).length;

    return {
      totalTasks,
      completed,
      inProgress,
      underReview,
      overdue,
      dueToday,
      completionRate: totalTasks ? Math.round((completed / totalTasks) * 100) : 0,
      activeUsers: Object.keys(MOCK_USERS).length,
      departments: MOCK_DEPARTMENTS.length,
    };
  }, []);

  const workload = useMemo(() => {
    return Object.values(MOCK_USERS)
      .map((member) => {
        const assigned = MOCK_TASKS.filter((task) => task.assignee.id === member.id);
        const completed = assigned.filter((task) => task.status === 'COMPLETED').length;
        const overdue = assigned.filter(isTaskOverdue).length;
        const progress = assigned.length ? Math.round((completed / assigned.length) * 100) : 0;

        return {
          ...member,
          assigned: assigned.length,
          completed,
          overdue,
          progress,
        };
      })
      .sort((a, b) => b.assigned - a.assigned)
      .slice(0, role === 'SUPER_ADMIN' ? 5 : 4);
  }, [role]);

  const recentTasks = useMemo(() => {
    return [...MOCK_TASKS]
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
      .slice(0, 4);
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? (role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin');
  const dateLabel = dayjs().format('dddd, D MMMM');

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  return (
    <View style={[styles.safe, { backgroundColor: colors.surface.background }]}>
      <DashboardHeader
        greeting={buildGreeting()}
        firstName={firstName}
        userName={user?.name ?? firstName}
        dateLabel={dateLabel}
        unreadCount={unreadCount}
        onNotificationPress={() => pushRoute('/(app)/notifications')}
        onProfilePress={() => pushRoute(`/(app)/${routeGroup}/profile`)}
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
            colors={[colors.brand.primary]}
          />
        }
      >
        <View style={styles.pageIntro}>
          <View>
            <Text style={[styles.pageTitle, { color: colors.text.primary }]}>Dashboard</Text>
            <Text style={[styles.pageSubtitle, { color: colors.text.secondary }]}>{copy.scope}</Text>
          </View>
          <Pressable
            onPress={() => pushRoute('/(app)/tasks/create')}
            style={({ pressed }) => [
              styles.createButton,
              { backgroundColor: colors.brand.primary },
              pressed && { opacity: 0.82 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Create task"
          >
            <Feather name="plus" size={18} color={colors.text.inverse} />
          </Pressable>
        </View>

        {stats.overdue > 0 && (
          <OverdueAlertBanner
            count={stats.overdue}
            onPress={() =>
              pushRoute(`/(app)/${routeGroup}/tasks?filter=OVERDUE`)
            }
          />
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              value={stats.totalTasks}
              label="Total Tasks"
              icon="check-square"
              subtitle={`${stats.dueToday} due today`}
              onPress={() => pushRoute(`/(app)/${routeGroup}/tasks`)}
            />
            <StatCard
              value={stats.overdue}
              label="Overdue"
              icon="alert-circle"
              variant={stats.overdue > 0 ? 'alert' : 'default'}
              subtitle="needs attention"
              onPress={() => pushRoute(`/(app)/${routeGroup}/tasks?filter=OVERDUE`)}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              value={stats.inProgress}
              label="In Progress"
              icon="clock"
              subtitle={`${stats.underReview} under review`}
              onPress={() => pushRoute(`/(app)/${routeGroup}/tasks`)}
            />
            <StatCard
              value={stats.completionRate}
              label="Completion %"
              icon="trending-up"
              variant="success"
              subtitle={`${stats.completed} completed`}
              onPress={() => pushRoute(`/(app)/${routeGroup}/tasks`)}
            />
          </View>
        </View>

        {role === 'SUPER_ADMIN' && (
          <View style={styles.statsRow}>
            <StatCard
              value={stats.activeUsers}
              label="Active Users"
              icon="users"
              onPress={() => pushRoute('/(app)/(sa)/people')}
            />
            <StatCard
              value={stats.departments}
              label="Departments"
              icon="briefcase"
            />
          </View>
        )}

        <View style={styles.section}>
          <DashboardSectionHeader
            title="Team Workload"
            actionLabel={copy.teamLabel}
            onActionPress={() =>
              pushRoute(role === 'SUPER_ADMIN' ? '/(app)/(sa)/people' : '/(app)/(admin)/team')
            }
          />
          {workload.length > 0 ? (
            <View style={styles.list}>
              {workload.map((member) => (
                <View
                  key={member.id}
                  style={[
                    styles.workloadCard,
                    { backgroundColor: colors.surface.card, borderColor: colors.surface.border },
                  ]}
                >
                  <View style={styles.workloadTop}>
                    <View style={styles.memberIdentity}>
                      <View style={[styles.avatar, { backgroundColor: colors.brand.primaryLight }]}>
                        <Text style={[styles.avatarText, { color: colors.brand.primary }]}>
                          {member.initials}
                        </Text>
                      </View>
                      <View style={styles.memberText}>
                        <Text style={[styles.memberName, { color: colors.text.primary }]} numberOfLines={1}>
                          {member.name}
                        </Text>
                        <Text style={[styles.memberMeta, { color: colors.text.secondary }]} numberOfLines={1}>
                          {member.designation}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.workloadCount, { color: colors.text.primary }]}>
                      {member.assigned}
                    </Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: colors.surface.background }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${member.progress}%`, backgroundColor: colors.brand.primary },
                      ]}
                    />
                  </View>
                  <Text style={[styles.workloadFooter, { color: colors.text.tertiary }]}>
                    {member.completed} completed | {member.overdue} overdue
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState icon="users" message="No team workload available" />
          )}
        </View>

        <View style={styles.section}>
          <DashboardSectionHeader
            title="Recent Tasks"
            actionLabel={copy.taskLabel}
            onActionPress={() => pushRoute(`/(app)/${routeGroup}/tasks`)}
          />
          <View style={styles.list}>
            {recentTasks.map((task) => (
              <Pressable
                key={task.id}
                onPress={() => pushRoute(`/(app)/tasks/${task.id}`)}
                style={({ pressed }) => [
                  styles.taskCard,
                  { backgroundColor: colors.surface.card, borderColor: colors.surface.border },
                  pressed && { opacity: 0.82 },
                ]}
              >
                <View style={styles.taskHeader}>
                  <TaskPriorityIndicator priority={task.priority} />
                  <Text style={[styles.taskTitle, { color: colors.text.primary }]} numberOfLines={2}>
                    {task.title}
                  </Text>
                </View>
                <View style={styles.taskFooter}>
                  <TaskStatusBadge status={task.status} />
                  <Text style={[styles.taskMeta, { color: colors.text.tertiary }]} numberOfLines={1}>
                    {task.department.name} | {task.assignee.name}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
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
  pageIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[3],
  },
  pageTitle: {
    ...Typography.h1,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0,
  },
  pageSubtitle: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
    marginTop: 2,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: { gap: Spacing[3] },
  statsRow: { flexDirection: 'row', gap: Spacing[3] },
  section: { gap: Spacing[3] },
  list: { gap: Spacing[2] },
  workloadCard: {
    borderWidth: 1,
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  workloadTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[3],
  },
  memberIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.labelLg,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0,
  },
  memberText: { flex: 1, minWidth: 0 },
  memberName: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  memberMeta: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
    marginTop: 1,
  },
  workloadCount: {
    ...Typography.h3,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  workloadFooter: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
  },
  taskCard: {
    borderWidth: 1,
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
  },
  taskTitle: {
    ...Typography.bodyMd,
    flex: 1,
    minWidth: 0,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  taskMeta: {
    ...Typography.caption,
    flex: 1,
    minWidth: 0,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
  },
  bottomPad: { height: Spacing[4] },
});
