/**
 * StaffTaskListScreen — "Staff task list, by status" (HTML screen 69).
 * Reached from Staff load detail's "View full task list". Only staff
 * members with authored MockTask records (currently: the one deliberate
 * drill-through demo case) have entries here — everyone else is aggregate
 * only per FR-72, and this screen shows an EmptyState for them rather than
 * a broken list.
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, SectionList, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import type { MockTask } from '../data/tasks.mock';
import { isTaskOverdue } from '../data/tasks.mock';
import { useStaffLoad, useStaffTasks } from '../hooks/useSuperAdminTasks';
import { useColors } from '../constants/colors';
import { Spacing } from '../constants/spacing';

import { EmptyState } from '../components/ui/EmptyState';
import { ListSkeleton } from '../components/dashboard/ListSkeleton';

type SectionId = 'overdue' | 'active' | 'review';

const SECTION_META: Record<SectionId, { label: string; color: string; bg: string }> = {
  overdue: { label: 'Overdue', color: '#B91C1C', bg: '#FEF2F2' },
  active: { label: 'In progress', color: '#B45309', bg: '#FFFBEB' },
  review: { label: 'Under review', color: '#6D28D9', bg: '#F5F3FF' },
};

export function StaffTaskListScreen() {
  const { staffId } = useLocalSearchParams<{ staffId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: staff } = useStaffLoad(staffId ?? '');
  const { data: tasks, isLoading } = useStaffTasks(staffId ?? '');

  const push = useCallback((path: string) => router.push(path as Parameters<typeof router.push>[0]), [router]);
  const goDetail = useCallback((task: MockTask) => push(`/(app)/sa-tasks/staff/${staffId}/tasks/${task.id}`), [push, staffId]);

  const sections = useMemo(() => {
    const list = tasks ?? [];
    const overdue = list.filter(isTaskOverdue);
    const active = list.filter((t) => t.status === 'IN_PROGRESS' && !isTaskOverdue(t));
    const review = list.filter((t) => t.status === 'UNDER_REVIEW');
    const pending = list.filter((t) => (t.status === 'PENDING' || t.status === 'ACCEPTED') && !isTaskOverdue(t));

    const result: { id: SectionId | 'pending'; label: string; color: string; bg: string; data: MockTask[] }[] = [];
    if (overdue.length) result.push({ id: 'overdue', ...SECTION_META.overdue, data: overdue });
    if (active.length) result.push({ id: 'active', ...SECTION_META.active, data: active });
    if (review.length) result.push({ id: 'review', ...SECTION_META.review, data: review });
    if (pending.length) result.push({ id: 'pending', label: 'Pending', color: '#475569', bg: '#F1F5F9', data: pending });
    return result;
  }, [tasks]);

  const total = tasks?.length ?? 0;

  return (
    <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
      <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <View style={[s.avatar, { backgroundColor: staff?.avatarBg ?? colors.brand.secondary }]}>
          <Text style={s.avatarText}>{staff?.initials ?? ''}</Text>
        </View>
        <View style={s.headerInfo}>
          <Text style={[s.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
            {staff?.name ?? 'Staff'} · Tasks
          </Text>
          <Text style={[s.headerSubtitle, { color: colors.text.tertiary }]}>
            {total} active · {staff?.departmentName ?? ''}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={s.loadingBody}>
          <ListSkeleton rows={4} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item, section }) => <StaffTaskRow task={item} tone={section.color} onPress={goDetail} />}
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeader}>
              <Text style={[s.sectionLabel, { color: section.color }]}>{section.label.toUpperCase()}</Text>
              <View style={[s.sectionBadge, { backgroundColor: section.bg }]}>
                <Text style={[s.sectionBadgeText, { color: section.color }]}>{section.data.length}</Text>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 18 }} />}
          ListEmptyComponent={
            <EmptyState
              icon="lock"
              title="Task-level detail not available"
              subtitle="This staff member's tasks are shown as aggregate counts only (FR-72)."
            />
          }
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + Spacing[6] }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function StaffTaskRow({ task, tone, onPress }: { task: MockTask; tone: string; onPress: (t: MockTask) => void }) {
  const colors = useColors();
  const overdue = isTaskOverdue(task);
  const subtitle = overdue
    ? `Due ${dayjs(task.dueDate).format('MMM D')} · ${dayjs().diff(dayjs(task.dueDate), 'day')} day${dayjs().diff(dayjs(task.dueDate), 'day') === 1 ? '' : 's'} late`
    : task.status === 'UNDER_REVIEW'
      ? `Submitted · awaiting ${task.creator.name}`
      : `Due ${dayjs(task.dueDate).format('MMM D')} · assigned by ${task.creator.name}`;
  const badgeLabel = overdue ? 'OVERDUE' : task.status === 'UNDER_REVIEW' ? 'REVIEW' : task.status === 'IN_PROGRESS' ? 'ACTIVE' : 'PENDING';

  return (
    <Pressable
      onPress={() => onPress(task)}
      style={({ pressed }) => [s.row, { backgroundColor: colors.surface.card }, pressed && s.pressed]}
      accessibilityRole="button"
      accessibilityLabel={task.title}
    >
      <View style={[s.stripe, { backgroundColor: tone }]} />
      <View style={s.rowInfo}>
        <Text style={[s.rowTitle, { color: colors.text.primary }]} numberOfLines={1}>
          {task.title}
        </Text>
        <Text style={[s.rowSubtitle, { color: overdue ? '#B91C1C' : colors.text.secondary }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View style={[s.badge, { backgroundColor: `${tone}1A` }]}>
        <Text style={[s.badgeText, { color: tone }]}>{badgeLabel}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 8, paddingBottom: 12 },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11, fontFamily: 'Inter-Bold', color: '#FFFFFF' },
  headerInfo: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 15, fontFamily: 'Inter-SemiBold' },
  headerSubtitle: { fontSize: 11, fontFamily: 'Inter-Regular' },
  loadingBody: { padding: Spacing[4] },
  list: { paddingHorizontal: Spacing[5], paddingTop: Spacing[3] + 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter-Bold', letterSpacing: 0.4 },
  sectionBadge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  sectionBadgeText: { fontSize: 11, fontFamily: 'Inter-Bold' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 13, padding: 13 },
  pressed: { opacity: 0.85 },
  stripe: { width: 4, height: 46, borderRadius: 3, flexShrink: 0 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  rowSubtitle: { fontSize: 11.5, fontFamily: 'Inter-Regular', marginTop: 4 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontFamily: 'Inter-Bold' },
});
