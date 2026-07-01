import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Feather } from '@expo/vector-icons';

import { MOCK_TASKS, MOCK_USERS, isTaskOverdue } from '../data/tasks.mock';
import { useAuthStore } from '../stores/auth.store';
import { useColors } from '../constants/colors';
import { Layout, Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { buildGreeting } from '../utils/greeting';
import { useUnreadCount } from '../hooks/useDashboard';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { OverdueAlertBanner } from '../components/dashboard/OverdueAlertBanner';
import { TaskStatusBadge } from '../components/task/TaskStatusBadge';

dayjs.extend(relativeTime);

const ADMIN_DEPT = { id: 'dept_01', name: 'Physics' };
const ADMIN_CREATOR_ID = MOCK_USERS.akumar.id;

// ─── Donut Ring ────────────────────────────────────────────────────────────────
// Circular "fill level" gauge — no SVG dependency, no border-rotation geometry.
// (The previous pure-View implementation used a uniformly single-colored border
// on all four sides for its "fill" ring, so clipping + rotating it was a visual
// no-op — a circle is rotationally symmetric, so it always rendered fully
// colored regardless of the actual percentage.)
//
// This version clips a bottom-anchored fill rectangle to a circle, i.e. a
// circular thermometer: the ring fills upward from 6 o'clock as the
// percentage increases. Every value here is a plain height percentage —
// no trigonometry, so there's no rotation math that can be silently wrong.

function DonutRing({
  percentage,
  size = 96,
  strokeWidth = 11,
  fillColor = '#1A5CF8',
  trackColor = '#E2E8F0',
  bgColor = '#FFFFFF',
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  fillColor?: string;
  trackColor?: string;
  bgColor?: string;
}) {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const half = size / 2;
  const innerSize = size - strokeWidth * 2;
  const innerRadius = innerSize / 2;

  return (
    <View style={{ width: size, height: size }}>
      {/* Outer disc, clipped to a circle: track color background + fill
          rectangle rising from the bottom by `clamped`% of the height */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: half,
          overflow: 'hidden',
          backgroundColor: trackColor,
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: `${clamped}%`,
            backgroundColor: fillColor,
          }}
        />
      </View>

      {/* White donut hole + center text */}
      <View
        style={{
          position: 'absolute',
          top: strokeWidth,
          left: strokeWidth,
          width: innerSize,
          height: innerSize,
          borderRadius: innerRadius,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 17,
            fontFamily: 'Inter-Bold',
            color: '#1E293B',
            lineHeight: 20,
          }}
        >
          {percentage}%
        </Text>
      </View>
    </View>
  );
}

// ─── Priority stripe colours ───────────────────────────────────────────────────

const PRIORITY_STRIPE: Record<string, string> = {
  CRITICAL: '#7C3AED',
  HIGH: '#EF4444',
  MEDIUM: '#F59E0B',
  LOW: '#22C55E',
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function AdminDashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { data: unreadCount = 0 } = useUnreadCount();
  const [refreshing, setRefreshing] = useState(false);

  const push = (path: string) =>
    router.push(path as Parameters<typeof router.push>[0]);

  // ── Derived data ───────────────────────────────────────────────────────────

  const deptTasks = useMemo(
    () => MOCK_TASKS.filter((t) => t.department.id === ADMIN_DEPT.id),
    [],
  );

  const assignedOutTasks = useMemo(
    () =>
      MOCK_TASKS.filter(
        (t) => t.creator.id === ADMIN_CREATOR_ID && t.department.id !== ADMIN_DEPT.id,
      ),
    [],
  );

  // Tasks awaiting review: created by admin, status UNDER_REVIEW, in admin's dept
  const reviewQueue = useMemo(
    () =>
      deptTasks
        .filter(
          (t) => t.creator.id === ADMIN_CREATOR_ID && t.status === 'UNDER_REVIEW',
        )
        .slice(0, 5),
    [deptTasks],
  );

  const stats = useMemo(() => {
    const teamPending = deptTasks.filter((t) =>
      ['PENDING', 'ACCEPTED'].includes(t.status),
    ).length;
    const teamDone = deptTasks.filter((t) => t.status === 'COMPLETED').length;
    const teamOverdue = deptTasks.filter(isTaskOverdue).length;
    const inFlight = deptTasks.filter((t) =>
      ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(t.status),
    ).length;
    const outPending = assignedOutTasks.filter(
      (t) => t.status !== 'COMPLETED',
    ).length;
    const completionRate = deptTasks.length
      ? Math.round((teamDone / deptTasks.length) * 100)
      : 0;

    return {
      deptTasks: deptTasks.length,
      teamPending,
      teamDone,
      teamOverdue,
      inFlight,
      assignedOut: assignedOutTasks.length,
      outPending,
      completionRate,
    };
  }, [assignedOutTasks, deptTasks]);

  // Workload — top 5 members with at least one dept task
  const workload = useMemo(
    () =>
      Object.values(MOCK_USERS)
        .map((m) => {
          const assigned = deptTasks.filter((t) => t.assignee.id === m.id);
          const active = assigned.filter(
            (t) => !['COMPLETED', 'CANCELLED'].includes(t.status),
          );
          const completed = assigned.filter((t) => t.status === 'COMPLETED').length;
          const progress = assigned.length
            ? Math.round((completed / assigned.length) * 100)
            : 0;
          return { ...m, activeCount: active.length, total: assigned.length, progress };
        })
        .filter((m) => m.total > 0)
        .sort((a, b) => b.activeCount - a.activeCount)
        .slice(0, 5),
    [deptTasks],
  );

  const firstName = user?.name?.split(' ')[0] ?? 'Admin';
  const dateLabel = dayjs().format('dddd, D MMMM');

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    setRefreshing(false);
  };

  // ── Avatar colours (deterministic by initials) ────────────────────────────

  const AVATAR_PALETTES = [
    { bg: '#EEF2FF', fg: '#4338CA' },
    { bg: '#FDF2F8', fg: '#9D174D' },
    { bg: '#F0FDF4', fg: '#15803D' },
    { bg: '#FFFBEB', fg: '#B45309' },
    { bg: '#F1F5F9', fg: '#475569' },
    { bg: '#FEF2F2', fg: '#B91C1C' },
  ];
  const palette = (initials: string) =>
    AVATAR_PALETTES[initials.charCodeAt(0) % AVATAR_PALETTES.length]!;

  return (
    <View style={[s.root, { backgroundColor: colors.surface.background }]}>
      <DashboardHeader
        greeting={buildGreeting()}
        firstName={firstName}
        userName={user?.name ?? firstName}
        dateLabel={dateLabel}
        unreadCount={unreadCount}
        onNotificationPress={() => push('/(app)/notifications')}
        onProfilePress={() => push('/(app)/(admin)/profile')}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing[10] }]}
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
        {/* ── Page intro ─────────────────────────────────────────────────── */}
        <View style={s.pageIntro}>
          <View style={s.pageTitleBlock}>
            <Text style={[s.pageTitle, { color: colors.text.primary }]}>
              Dashboard
            </Text>
            <View style={s.deptRow}>
              <Text style={[s.pageSubtitle, { color: colors.text.secondary }]}>
                {ADMIN_DEPT.name} department
              </Text>
              <View style={[s.deptChip, { backgroundColor: '#EEF2FF' }]}>
                <Text style={[s.deptChipText, { color: '#4338CA' }]}>
                  {ADMIN_DEPT.name} Dept
                </Text>
              </View>
            </View>
          </View>
          <Pressable
            onPress={() => push('/(app)/tasks/create')}
            style={({ pressed }) => [
              s.createPill,
              { backgroundColor: colors.brand.primary },
              pressed && { opacity: 0.82 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Create task"
          >
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text style={s.createPillText}>Create</Text>
          </Pressable>
        </View>

        {/* ── Overdue banner ─────────────────────────────────────────────── */}
        {stats.teamOverdue > 0 && (
          <OverdueAlertBanner
            count={stats.teamOverdue}
            onPress={() => push('/(app)/(admin)/tasks')}
          />
        )}

        {/* ── 2×2 Stat grid ──────────────────────────────────────────────── */}
        <View style={s.statsGrid}>
          <View style={s.statsRow}>
            <StatCard
              value={stats.deptTasks}
              label="Dept Tasks"
              icon="briefcase"
              iconBg="#EEF2FF"
              iconColor="#4338CA"
              onPress={() => push('/(app)/(admin)/tasks')}
              colors={colors}
            />
            <StatCard
              value={stats.teamPending}
              label="Team Pending"
              icon="clock"
              iconBg="#FFFBEB"
              iconColor="#B45309"
              onPress={() => push('/(app)/(admin)/tasks')}
              colors={colors}
            />
          </View>
          <View style={s.statsRow}>
            <StatCard
              value={stats.teamDone}
              label="Team Done"
              icon="check-circle"
              iconBg="#F0FDF4"
              iconColor="#15803D"
              onPress={() => push('/(app)/(admin)/tasks')}
              colors={colors}
            />
            <StatCard
              value={stats.teamOverdue}
              label="Team Overdue"
              icon="alert-circle"
              iconBg={stats.teamOverdue > 0 ? '#FEF2F2' : '#F1F5F9'}
              iconColor={stats.teamOverdue > 0 ? '#B91C1C' : '#64748B'}
              cardBg={stats.teamOverdue > 0 ? '#FEF2F2' : undefined}
              cardBorder={stats.teamOverdue > 0 ? '#FECACA' : undefined}
              onPress={() => push('/(app)/(admin)/tasks')}
              colors={colors}
            />
          </View>
        </View>

        {/* ── Cross-dept strip ───────────────────────────────────────────── */}
        {stats.assignedOut > 0 && (
          <Pressable
            onPress={() => push('/(app)/(admin)/tasks')}
            style={({ pressed }) => [
              s.crossDeptStrip,
              {
                backgroundColor: colors.surface.card,
                borderColor: colors.surface.border,
              },
              pressed && { opacity: 0.82 },
            ]}
          >
            <View style={[s.crossDeptIcon, { backgroundColor: '#EEF2FF' }]}>
              <Feather name="send" size={16} color="#4338CA" />
            </View>
            <Text
              style={[s.crossDeptLabel, { color: colors.text.secondary }]}
              numberOfLines={1}
            >
              Assigned out to other depts
            </Text>
            <View style={s.crossDeptStats}>
              <View style={s.crossDeptStat}>
                <Text style={[s.crossDeptNum, { color: colors.text.primary }]}>
                  {stats.assignedOut}
                </Text>
                <Text style={[s.crossDeptMeta, { color: colors.text.tertiary }]}>
                  Out
                </Text>
              </View>
              <View style={[s.crossDeptDivider, { backgroundColor: colors.surface.border }]} />
              <View style={s.crossDeptStat}>
                <Text style={[s.crossDeptNum, { color: '#F59E0B' }]}>
                  {stats.outPending}
                </Text>
                <Text style={[s.crossDeptMeta, { color: colors.text.tertiary }]}>
                  Pending
                </Text>
              </View>
            </View>
          </Pressable>
        )}

        {/* ── Completion ring ────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader
            title="Department Completion"
            actionLabel="Tasks"
            onAction={() => push('/(app)/(admin)/tasks')}
            colors={colors}
          />
          <View
            style={[
              s.completionCard,
              {
                backgroundColor: colors.surface.card,
                borderColor: colors.surface.border,
              },
            ]}
          >
            <DonutRing
              percentage={stats.completionRate}
              bgColor={colors.surface.card}
            />
            <View style={s.completionRight}>
              <Text
                style={[s.completionTitle, { color: colors.text.primary }]}
                numberOfLines={2}
              >
                Department completion rate
              </Text>
              <Text style={[s.completionSub, { color: colors.text.tertiary }]}>
                This month · {ADMIN_DEPT.name}
              </Text>
              <View style={s.completionLegend}>
                <View style={s.legendRow}>
                  <View style={[s.legendDot, { backgroundColor: '#1A5CF8' }]} />
                  <Text style={[s.legendText, { color: colors.text.secondary }]}>
                    Completed {stats.teamDone}
                  </Text>
                </View>
                <View style={s.legendRow}>
                  <View style={[s.legendDot, { backgroundColor: '#E2E8F0' }]} />
                  <Text style={[s.legendText, { color: colors.text.secondary }]}>
                    In flight {stats.inFlight}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Awaiting your review ───────────────────────────────────────── */}
        {reviewQueue.length > 0 && (
          <View style={s.section}>
            <SectionHeader
              title="Awaiting your review"
              badge={reviewQueue.length}
              actionLabel="See all"
              onAction={() => push('/(app)/(admin)/tasks')}
              colors={colors}
            />
            <View style={s.list}>
              {reviewQueue.map((task) => {
                const pal = palette(task.assignee.initials);
                return (
                  <Pressable
                    key={task.id}
                    onPress={() => push(`/(app)/tasks/${task.id}`)}
                    style={({ pressed }) => [
                      s.reviewCard,
                      {
                        backgroundColor: colors.surface.card,
                        borderColor: colors.surface.border,
                      },
                      pressed && { opacity: 0.82 },
                    ]}
                  >
                    {/* Priority stripe */}
                    <View
                      style={[
                        s.priorityStripe,
                        {
                          backgroundColor:
                            PRIORITY_STRIPE[task.priority] ?? '#94A3B8',
                        },
                      ]}
                    />
                    <View style={s.reviewBody}>
                      <View style={s.reviewTop}>
                        <Text
                          style={[s.reviewTitle, { color: colors.text.primary }]}
                          numberOfLines={1}
                        >
                          {task.title}
                        </Text>
                        <TaskStatusBadge
                          status={task.status}
                          isOverdue={isTaskOverdue(task)}
                        />
                      </View>
                      <View style={s.reviewMeta}>
                        <View
                          style={[
                            s.assigneeAvatar,
                            { backgroundColor: pal.bg },
                          ]}
                        >
                          <Text style={[s.assigneeInitials, { color: pal.fg }]}>
                            {task.assignee.initials}
                          </Text>
                        </View>
                        <Text
                          style={[s.assigneeName, { color: colors.text.secondary }]}
                        >
                          {task.assignee.name}
                        </Text>
                        {task.attachments.length > 0 && (
                          <View style={s.fileChip}>
                            <Feather
                              name="paperclip"
                              size={10}
                              color={colors.text.tertiary}
                            />
                            <Text
                              style={[
                                s.fileCount,
                                { color: colors.text.tertiary },
                              ]}
                            >
                              {task.attachments.length}
                            </Text>
                          </View>
                        )}
                        <Text
                          style={[
                            s.reviewTime,
                            { color: colors.text.tertiary, marginLeft: 'auto' },
                          ]}
                        >
                          {dayjs(
                            task.activity[task.activity.length - 1]?.createdAt ??
                              task.createdAt,
                          ).fromNow()}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Workload distribution (single card with rows) ──────────────── */}
        {workload.length > 0 && (
          <View style={s.section}>
            <SectionHeader
              title="Workload distribution"
              actionLabel="See all"
              onAction={() => push('/(app)/(admin)/team')}
              colors={colors}
            />
            <Pressable
              onPress={() => push('/(app)/(admin)/team')}
              style={({ pressed }) => [
                s.workloadCard,
                {
                  backgroundColor: colors.surface.card,
                  borderColor: colors.surface.border,
                },
                pressed && { opacity: 0.96 },
              ]}
            >
              {workload.map((member, idx) => {
                const pal = palette(member.initials);
                return (
                  <View
                    key={member.id}
                    style={[
                      s.workloadRow,
                      idx < workload.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.surface.border,
                        paddingBottom: Spacing[3],
                        marginBottom: Spacing[3],
                      },
                    ]}
                  >
                    <View
                      style={[s.workloadAvatar, { backgroundColor: pal.bg }]}
                    >
                      <Text style={[s.workloadInitials, { color: pal.fg }]}>
                        {member.initials}
                      </Text>
                    </View>
                    <View style={s.workloadInfo}>
                      <View style={s.workloadTopRow}>
                        <Text
                          style={[s.memberName, { color: colors.text.primary }]}
                          numberOfLines={1}
                        >
                          {member.name}
                        </Text>
                        <Text
                          style={[
                            s.activeCount,
                            { color: colors.text.tertiary },
                          ]}
                        >
                          {member.activeCount} active
                        </Text>
                      </View>
                      <View
                        style={[
                          s.progressTrack,
                          { backgroundColor: colors.surface.background },
                        ]}
                      >
                        <View
                          style={[
                            s.progressFill,
                            {
                              width: `${member.progress}%`,
                              backgroundColor: colors.brand.primary,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </Pressable>
          </View>
        )}

        {/* ── Assigned to other depts ────────────────────────────────────── */}
        {assignedOutTasks.length > 0 && (
          <View style={s.section}>
            <SectionHeader
              title="Assigned to other depts"
              badge={assignedOutTasks.length}
              actionLabel="See all"
              onAction={() => push('/(app)/(admin)/tasks')}
              colors={colors}
            />
            <View style={s.list}>
              {assignedOutTasks.slice(0, 3).map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => push(`/(app)/tasks/${task.id}`)}
                  style={({ pressed }) => [
                    s.crossTaskCard,
                    {
                      backgroundColor: colors.surface.card,
                      borderColor: colors.surface.border,
                    },
                    pressed && { opacity: 0.82 },
                  ]}
                >
                  <View
                    style={[
                      s.priorityStripe,
                      {
                        backgroundColor:
                          PRIORITY_STRIPE[task.priority] ?? '#94A3B8',
                      },
                    ]}
                  />
                  <View style={s.crossTaskBody}>
                    <View style={s.crossTaskTop}>
                      <Text
                        style={[s.crossTaskTitle, { color: colors.text.primary }]}
                        numberOfLines={1}
                      >
                        {task.title}
                      </Text>
                      <TaskStatusBadge
                        status={task.status}
                        isOverdue={isTaskOverdue(task)}
                      />
                    </View>
                    <View style={s.crossTaskMeta}>
                      <View
                        style={[
                          s.deptBadge,
                          { backgroundColor: '#EEF2FF' },
                        ]}
                      >
                        <Feather name="corner-up-right" size={10} color="#4338CA" />
                        <Text style={[s.deptBadgeText, { color: '#4338CA' }]}>
                          {task.department.name}
                        </Text>
                      </View>
                      <Text
                        style={[s.crossAssignee, { color: colors.text.secondary }]}
                      >
                        {task.assignee.name}
                      </Text>
                      <Text
                        style={[
                          s.crossDue,
                          { color: colors.text.tertiary, marginLeft: 'auto' },
                        ]}
                      >
                        Due {dayjs(task.dueDate).format('ddd D')}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <Pressable
        onPress={() => push('/(app)/tasks/create')}
        style={({ pressed }) => [
          s.fab,
          {
            right: Spacing[4],
            bottom: insets.bottom + Spacing[5],
            backgroundColor: colors.brand.primary,
          },
          pressed && { opacity: 0.86 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Create task"
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  badge,
  actionLabel,
  onAction,
  colors,
}: {
  title: string;
  badge?: number;
  actionLabel?: string;
  onAction?: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionTitleRow}>
        <Text style={[s.sectionTitle, { color: colors.text.primary }]}>
          {title}
        </Text>
        {badge !== undefined && (
          <View style={[s.badge, { backgroundColor: '#EEF2FF' }]}>
            <Text style={[s.badgeText, { color: '#4338CA' }]}>{badge}</Text>
          </View>
        )}
      </View>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={s.seeAll}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Inline stat card ──────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  icon,
  iconBg,
  iconColor,
  cardBg,
  cardBorder,
  onPress,
  colors,
}: {
  value: number;
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  iconBg: string;
  iconColor: string;
  cardBg?: string | undefined;
  cardBorder?: string | undefined;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.statCard,
        {
          backgroundColor: cardBg ?? colors.surface.card,
          borderColor: cardBorder ?? colors.surface.border,
        },
        pressed && { opacity: 0.82 },
      ]}
      accessibilityRole="button"
    >
      <View style={[s.statIconBox, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[s.statValue, { color: colors.text.primary }]}>{value}</Text>
      <Text style={[s.statLabel, { color: colors.text.secondary }]}>{label}</Text>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[4],
    gap: Spacing[5],
  },

  // Page intro
  pageIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[3],
  },
  pageTitleBlock: { flex: 1, minWidth: 0 },
  pageTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0,
  },
  deptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginTop: 3,
    flexWrap: 'wrap',
  },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
  },
  deptChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  deptChipText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  createPill: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  createPillText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
    color: '#FFFFFF',
  },

  // Stat grid
  statsGrid: { gap: Spacing[3] },
  statsRow: { flexDirection: 'row', gap: Spacing[3] },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing[4],
    gap: Spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 25,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0,
    lineHeight: 30,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
  },

  // Cross-dept strip
  crossDeptStrip: {
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  crossDeptIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossDeptLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
  },
  crossDeptStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  crossDeptStat: { alignItems: 'center' },
  crossDeptNum: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0,
  },
  crossDeptMeta: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
  },
  crossDeptDivider: { width: 1, height: 28 },

  // Completion ring card
  section: { gap: Spacing[3] },
  completionCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  completionRight: { flex: 1, minWidth: 0, gap: 6 },
  completionTitle: {
    fontSize: 13.5,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  completionSub: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
  },
  completionLegend: { gap: 4, marginTop: 2 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11.5, fontFamily: 'Inter-Regular', letterSpacing: 0 },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0,
  },
  seeAll: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#1A5CF8',
    letterSpacing: 0,
  },

  // Review queue
  list: { gap: Spacing[2] },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  priorityStripe: { width: 4, flexShrink: 0 },
  reviewBody: { flex: 1, padding: Spacing[3], gap: Spacing[2] },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[2],
  },
  reviewTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assigneeAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assigneeInitials: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0,
  },
  assigneeName: {
    fontSize: 11.5,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
  },
  fileChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  fileCount: { fontSize: 11, fontFamily: 'Inter-Regular' },
  reviewTime: { fontSize: 11, fontFamily: 'Inter-Regular' },

  // Workload
  workloadCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  workloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  workloadAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  workloadInitials: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0,
  },
  workloadInfo: { flex: 1, minWidth: 0 },
  workloadTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  memberName: {
    fontSize: 12.5,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0,
  },
  activeCount: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Cross-dept task cards
  crossTaskCard: {
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  crossTaskBody: { flex: 1, padding: Spacing[3], gap: Spacing[2] },
  crossTaskTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[2],
  },
  crossTaskTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  crossTaskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  deptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deptBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  crossAssignee: {
    fontSize: 11.5,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
  },
  crossDue: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
  },

  // FAB
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
});
