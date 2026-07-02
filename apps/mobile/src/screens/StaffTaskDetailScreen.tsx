/**
 * StaffTaskDetailScreen — "Task details, oversight, read-only" (HTML screen
 * 70). The Super Admin can read but not edit another user's task; the only
 * action is flagging it to the department admin. Reuses
 * TaskActivityTimeline (generic, presentational).
 */

import React, { useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { isTaskOverdue } from '../data/tasks.mock';
import { useStaffTask } from '../hooks/useSuperAdminTasks';
import { useColors } from '../constants/colors';
import { Spacing } from '../constants/spacing';

import { TaskActivityTimeline } from '../components/task/detail/TaskActivityTimeline';
import { Skeleton } from '../components/ui/Skeleton';

const PRIORITY_META: Record<string, { bg: string; text: string }> = {
  CRITICAL: { bg: '#F5F3FF', text: '#5B21B6' },
  HIGH: { bg: '#FEF2F2', text: '#B91C1C' },
  MEDIUM: { bg: '#FFFBEB', text: '#B45309' },
  LOW: { bg: '#F0FDF4', text: '#15803D' },
};

export function StaffTaskDetailScreen() {
  const { staffId, taskId } = useLocalSearchParams<{ staffId: string; taskId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: task, isLoading } = useStaffTask(staffId ?? '', taskId ?? '');

  const handleFlag = useCallback(() => {
    if (!task) return;
    Alert.alert('Flag to admin', `Direct messaging to ${task.creator.name} is not yet available in this build.`);
  }, [task]);

  if (isLoading || !task) {
    return (
      <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
        <View style={[s.header, { paddingTop: insets.top + 6 }]}>
          <Pressable onPress={() => router.back()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Back">
            <Feather name="chevron-left" size={22} color={colors.text.primary} />
          </Pressable>
        </View>
        <View style={s.loadingBody}>
          <Skeleton height={110} borderRadius={14} />
          <Skeleton height={90} borderRadius={14} />
          <Skeleton height={160} borderRadius={14} />
        </View>
      </View>
    );
  }

  const overdue = isTaskOverdue(task);
  const priority = PRIORITY_META[task.priority] ?? PRIORITY_META.MEDIUM!;
  const overdueDays = overdue ? Math.max(1, dayjs().diff(dayjs(task.dueDate), 'day')) : 0;
  const firstLabel = task.labels[0];

  return (
    <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
      <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.text.primary }]}>Task details</Text>
        <View style={[s.readOnlyChip, { backgroundColor: colors.surface.background }]}>
          <Feather name="eye" size={11} color={colors.text.secondary} />
          <Text style={[s.readOnlyText, { color: colors.text.secondary }]}>READ-ONLY</Text>
        </View>
      </View>
      <View style={[s.topStripe, { backgroundColor: overdue ? colors.semantic.error : colors.brand.secondary }]} />

      <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: Spacing[6] }} showsVerticalScrollIndicator={false}>
        <View style={[s.titleBlock, { backgroundColor: colors.surface.card }]}>
          <View style={s.badgeRow}>
            <View style={[s.priorityBadge, { backgroundColor: priority.bg, borderColor: `${priority.text}33` }]}>
              <Text style={[s.priorityText, { color: priority.text }]}>{task.priority}</Text>
            </View>
            {overdue && (
              <View style={s.overdueBadge}>
                <Text style={s.overdueText}>
                  OVERDUE · {overdueDays} {overdueDays === 1 ? 'DAY' : 'DAYS'}
                </Text>
              </View>
            )}
          </View>
          <Text style={[s.title, { color: colors.text.primary }]}>{task.title}</Text>
          <View style={s.chipRow}>
            <View style={[s.tagChip, { backgroundColor: colors.surface.background }]}>
              <Text style={[s.tagText, { color: colors.text.secondary }]}>{task.department.name}</Text>
            </View>
            {firstLabel && (
              <View style={[s.tagChip, { backgroundColor: colors.surface.background }]}>
                <Text style={[s.tagText, { color: colors.text.secondary }]}>{firstLabel}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[s.infoGrid, { backgroundColor: colors.surface.card }]}>
          <View style={s.infoCell}>
            <Text style={[s.infoLabel, { color: colors.text.tertiary }]}>DUE</Text>
            <View style={s.infoValueRow}>
              <Feather name="clock" size={14} color={overdue ? colors.semantic.error : colors.text.secondary} />
              <Text style={[s.infoValue, { color: overdue ? colors.semantic.error : colors.text.primary }]}>
                {dayjs(task.dueDate).format('MMM D, h:mm A')}
              </Text>
            </View>
          </View>
          <View style={s.infoCell}>
            <Text style={[s.infoLabel, { color: colors.text.tertiary }]}>PRIORITY</Text>
            <Text style={[s.infoValue, { color: priority.text, marginTop: 6 }]}>{task.priority}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={[s.infoLabel, { color: colors.text.tertiary }]}>ASSIGNED BY</Text>
            <View style={s.infoValueRow}>
              <View style={[s.smallAvatar, { backgroundColor: colors.brand.secondary }]}>
                <Text style={s.smallAvatarText}>{task.creator.initials}</Text>
              </View>
              <Text style={[s.infoValue, { color: colors.text.primary }]}>{task.creator.name}</Text>
            </View>
          </View>
          <View style={s.infoCell}>
            <Text style={[s.infoLabel, { color: colors.text.tertiary }]}>ASSIGNEE</Text>
            <View style={s.infoValueRow}>
              <View style={[s.smallAvatar, { backgroundColor: colors.status.completed.solid }]}>
                <Text style={s.smallAvatarText}>{task.assignee.initials}</Text>
              </View>
              <Text style={[s.infoValue, { color: colors.text.primary }]}>{task.assignee.name}</Text>
            </View>
          </View>
        </View>

        <View style={[s.card, { backgroundColor: colors.surface.card }]}>
          <Text style={[s.cardTitle, { color: colors.text.secondary }]}>Description</Text>
          <Text style={[s.description, { color: colors.text.secondary }]}>{task.description}</Text>
        </View>

        <View style={[s.card, { backgroundColor: colors.surface.card }]}>
          <TaskActivityTimeline events={task.activity} />
        </View>

        <View style={[s.oversightNote, { backgroundColor: colors.surface.background }]}>
          <Feather name="info" size={16} color={colors.text.tertiary} style={s.oversightIcon} />
          <Text style={[s.oversightText, { color: colors.text.secondary }]}>
            Oversight view — the Super Admin can read but not edit another user's task. Act through the department admin.
          </Text>
        </View>
      </ScrollView>

      <View style={[s.footer, { backgroundColor: colors.surface.card, borderTopColor: colors.surface.border, paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={handleFlag}
          style={({ pressed }) => [s.flagBtn, { backgroundColor: colors.brand.secondary }, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Flag to ${task.creator.name}`}
        >
          <Feather name="message-square" size={17} color="#FFFFFF" />
          <Text style={s.flagText}>Flag to {task.creator.name} (admin)</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingBottom: 12 },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Inter-SemiBold' },
  readOnlyChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4 },
  readOnlyText: { fontSize: 10, fontFamily: 'Inter-Bold', letterSpacing: 0.3 },
  topStripe: { height: 6 },
  loadingBody: { padding: Spacing[4], gap: Spacing[3] },
  body: { flex: 1 },
  titleBlock: { padding: Spacing[5], paddingTop: Spacing[4] },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priorityBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3 },
  priorityText: { fontSize: 10, fontFamily: 'Inter-Bold', letterSpacing: 0.4 },
  overdueBadge: { backgroundColor: '#FEF2F2', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 4 },
  overdueText: { fontSize: 11, fontFamily: 'Inter-Bold', letterSpacing: 0.3, color: '#B91C1C' },
  title: { fontSize: 21, fontFamily: 'Inter-SemiBold', letterSpacing: -0.2, lineHeight: 28, marginTop: 13 },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 11 },
  tagChip: { borderRadius: 7, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, fontFamily: 'Inter-Medium' },
  infoGrid: { marginTop: 8, padding: Spacing[5], flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  infoCell: { width: '45%' },
  infoLabel: { fontSize: 10, fontFamily: 'Inter-Bold', letterSpacing: 0.5 },
  infoValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  infoValue: { fontSize: 13, fontFamily: 'Inter-Medium' },
  smallAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  smallAvatarText: { fontSize: 9, fontFamily: 'Inter-Bold', color: '#FFFFFF' },
  card: { marginTop: 8, padding: Spacing[5] },
  cardTitle: { fontSize: 13, fontFamily: 'Inter-SemiBold', marginBottom: 8 },
  description: { fontSize: 13, lineHeight: 21, fontFamily: 'Inter-Regular' },
  oversightNote: { flexDirection: 'row', gap: 10, alignItems: 'center', margin: Spacing[4], marginTop: Spacing[3], borderRadius: 11, padding: 13 },
  oversightIcon: { flexShrink: 0 },
  oversightText: { flex: 1, fontSize: 11, lineHeight: 16, fontFamily: 'Inter-Regular' },
  footer: { padding: Spacing[4], borderTopWidth: 1 },
  flagBtn: { height: 50, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  flagText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
  pressed: { opacity: 0.85 },
});
