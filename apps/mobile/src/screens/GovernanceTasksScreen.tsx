/**
 * GovernanceTasksScreen — "Assigned by me" tracker (HTML screen 62). Lists
 * the SA's own governance tasks to admins, grouped by status. Unlike the
 * aggregate oversight tab, these are the SA's own tasks so full titles are
 * shown (FR-72 doesn't restrict a creator's view of their own tasks).
 */

import React, { useCallback } from 'react';
import { View, Text, SectionList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import type { GovernanceStage, GovernanceTask } from '@godigitify/types';
import { useGovernanceTasks } from '../hooks/useGovernance';
import { useRefreshControl } from '../hooks/useRefreshControl';
import { useColors } from '../constants/colors';
import { Layout, Spacing } from '../constants/spacing';

import { GovernanceTaskRow } from '../components/task/oversight/GovernanceTaskRow';
import { EmptyState } from '../components/ui/EmptyState';
import { ListSkeleton } from '../components/dashboard/ListSkeleton';

type GovernanceGroupId = 'needs_approval' | 'revision_requested' | 'in_progress' | 'awaiting_accept';

// Buckets the flat governance list by server-computed stage — APPROVED tasks
// are excluded from this "active" tracker (mirrors the prior mock behavior,
// which never surfaced completed governance tasks here).
const GROUP_META: Record<GovernanceGroupId, { label: string; stage: GovernanceStage; tone: { color: string; bg: string } }> = {
  needs_approval: { label: 'Needs your approval', stage: 'SUBMITTED', tone: { color: '#6D28D9', bg: '#F5F3FF' } },
  revision_requested: { label: 'Sent back for revision', stage: 'REVISION_REQUESTED', tone: { color: '#B91C1C', bg: '#FEF2F2' } },
  in_progress: { label: 'In progress', stage: 'IN_PROGRESS', tone: { color: '#B45309', bg: '#FFFBEB' } },
  awaiting_accept: { label: 'Awaiting accept', stage: 'ASSIGNED', tone: { color: '#475569', bg: '#F1F5F9' } },
};

const GROUP_ORDER: GovernanceGroupId[] = ['needs_approval', 'revision_requested', 'in_progress', 'awaiting_accept'];

export function GovernanceTasksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data, isLoading, refetch } = useGovernanceTasks();
  const { refreshing, onRefresh } = useRefreshControl(async () => {
    await refetch();
  });

  const push = useCallback((path: string) => router.push(path as Parameters<typeof router.push>[0]), [router]);

  const goDetail = useCallback((task: GovernanceTask) => push(`/(app)/sa-tasks/assigned-by-me/${task.id}`), [push]);
  const goAssign = useCallback(() => push('/(app)/sa-tasks/assign'), [push]);

  const tasks = data ?? [];
  const sections = GROUP_ORDER.map((id) => {
    const meta = GROUP_META[id];
    const groupTasks = tasks.filter((t) => t.stage === meta.stage);
    return { id, label: meta.label, count: groupTasks.length, tasks: groupTasks, data: groupTasks };
  }).filter((group) => group.count > 0);

  return (
    <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
      <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <View style={s.headerInfo}>
          <Text style={[s.headerTitle, { color: colors.text.primary }]}>Assigned by me</Text>
          <Text style={[s.headerSubtitle, { color: colors.text.tertiary }]}>Governance tasks you gave to admins</Text>
        </View>
        <Pressable onPress={goAssign} style={[s.iconBtn, { borderColor: colors.surface.border }]} accessibilityRole="button" accessibilityLabel="New assignment">
          <Feather name="plus" size={18} color={colors.text.secondary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={s.loadingBody}>
          <ListSkeleton rows={4} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <GovernanceTaskRow task={item} onPress={goDetail} />}
          renderSectionHeader={({ section }) => {
            const tone = GROUP_META[section.id].tone;
            return (
              <View style={s.sectionHeader}>
                <Text style={[s.sectionLabel, { color: tone.color }]}>{section.label.toUpperCase()}</Text>
                <View style={[s.sectionBadge, { backgroundColor: tone.bg }]}>
                  <Text style={[s.sectionBadgeText, { color: tone.color }]}>{section.count}</Text>
                </View>
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 18 }} />}
          ListEmptyComponent={
            <EmptyState icon="check-circle" title="No governance tasks yet" subtitle="Tasks you assign to admins will appear here." />
          }
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + Layout.tabBarHeight + 96 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} colors={[colors.brand.primary]} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <Pressable
        onPress={goAssign}
        style={({ pressed }) => [
          s.fab,
          { bottom: insets.bottom + Layout.tabBarHeight + 16, backgroundColor: colors.brand.secondary },
          pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel="New assignment"
      >
        <Feather name="plus" size={22} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold' },
  headerSubtitle: { fontSize: 11, fontFamily: 'Inter-Regular', marginTop: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  loadingBody: { padding: Spacing[4] },
  list: { paddingHorizontal: Spacing[5], paddingTop: Spacing[3] + 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter-Bold', letterSpacing: 0.4 },
  sectionBadge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  sectionBadgeText: { fontSize: 11, fontFamily: 'Inter-Bold' },
  fab: {
    position: 'absolute',
    right: 16,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(13,34,112,0.35)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 8,
  },
});
