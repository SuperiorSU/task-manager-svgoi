/**
 * DepartmentDetailScreen — SA "Department detail" (HTML screen 56a, People ·
 * Departments → tap a card). Identity + KPI strip + task-status breakdown +
 * composition. No edit/reassign/archive here — those live one level deeper,
 * in DepartmentMembersScreen (56b), reached via the header's "Members" pill.
 */

import React, { useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { useOrgDepartmentDetail, useOrgDepartmentMembers } from '../hooks/useOrgDirectory';
import { useColors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { rateTextColor } from '../utils/completionRate';

import { Skeleton } from '../components/ui/Skeleton';

function SectionLabel({ children }: { children: string }) {
  const colors = useColors();
  return <Text style={[sl.text, { color: colors.text.tertiary }]}>{children}</Text>;
}
const sl = StyleSheet.create({
  text: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing[5],
    paddingTop: 18,
    paddingBottom: 9,
  },
});

function KpiCell({ value, label, colors, accent }: { value: number | string; label: string; colors: ReturnType<typeof useColors>; accent?: string }) {
  return (
    <View style={[k.cell, { backgroundColor: colors.surface.card }]}>
      <Text style={[k.value, { color: accent ?? colors.text.primary }]}>{value}</Text>
      <Text style={[k.label, { color: colors.text.tertiary }]}>{label}</Text>
    </View>
  );
}
const k = StyleSheet.create({
  cell: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  value: { fontSize: 19, fontFamily: 'Inter-Bold' },
  label: { fontSize: 10.5, fontFamily: 'Inter-Regular', marginTop: 2 },
});

export function DepartmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: dept, isLoading } = useOrgDepartmentDetail(id ?? '');
  const { data: membersData } = useOrgDepartmentMembers(id ?? '', 'ALL');

  const push = useCallback((path: string) => router.push(path as Parameters<typeof router.push>[0]), [router]);
  const goMembers = useCallback(() => push(`/(app)/people/department/${id}/members`), [push, id]);
  const goHead = useCallback(() => {
    if (dept?.headId) push(`/(app)/people/org/${dept.headId}`);
  }, [push, dept?.headId]);

  if (isLoading || !dept) {
    return (
      <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
        <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
          <Pressable onPress={() => router.back()} style={s.headerBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
            <Feather name="chevron-left" size={22} color={colors.text.primary} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.text.primary }]}>Department</Text>
          <View style={s.headerBtn} />
        </View>
        <View style={s.loadingBody}>
          <Skeleton height={140} borderRadius={16} />
          <Skeleton height={90} borderRadius={14} />
          <Skeleton height={110} borderRadius={14} />
        </View>
      </View>
    );
  }

  const { taskStats } = dept;
  const completedPercent = taskStats.activeCount + taskStats.completedCount > 0
    ? Math.round((taskStats.completedCount / (taskStats.activeCount + taskStats.completedCount)) * 100)
    : 0;
  const inProgressPercent = taskStats.activeCount + taskStats.completedCount > 0
    ? Math.round((taskStats.inProgressCount / (taskStats.activeCount + taskStats.completedCount)) * 100)
    : 0;
  const overduePercent = Math.max(100 - completedPercent - inProgressPercent, 0);

  const composition = membersData?.composition;

  return (
    <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable onPress={() => router.back()} style={s.headerBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.text.primary }]}>Department</Text>
        <Pressable onPress={goMembers} style={[s.membersBtn, { borderColor: colors.surface.border }]} accessibilityRole="button" accessibilityLabel="View members">
          <Feather name="users" size={14} color={colors.brand.primary} />
          <Text style={[s.membersBtnText, { color: colors.brand.primary }]}>Members</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* ── Identity ─────────────────────────────────────────────────── */}
        <View style={[s.identityBlock, { backgroundColor: colors.surface.card }]}>
          <View style={[s.icon56, { backgroundColor: '#CCFBF1' }]}>
            <Feather name="briefcase" size={24} color="#0D9488" />
          </View>
          <View style={s.nameRow}>
            <Text style={[s.name, { color: colors.text.primary }]}>{dept.name}</Text>
            <View style={[s.codeBadge, { backgroundColor: '#CCFBF1' }]}>
              <Text style={[s.codeBadgeText, { color: '#0D9488' }]}>{dept.code}</Text>
            </View>
          </View>
          <Text style={[s.meta, { color: colors.text.secondary }]}>
            {dept.memberCount} {dept.memberCount === 1 ? 'member' : 'members'} · Created {dayjs(dept.createdAt).format('MMM YYYY')}
          </Text>

          {dept.headId && (
            <Pressable onPress={goHead} style={[s.headRow, { borderColor: colors.surface.border }]} accessibilityRole="button" accessibilityLabel={`Head of department: ${dept.headName ?? ''}`}>
              <View style={[s.headAvatar, { backgroundColor: colors.brand.primaryLight }]}>
                <Text style={[s.headAvatarText, { color: colors.brand.primary }]}>
                  {(dept.headName ?? '—').split(' ').slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('')}
                </Text>
              </View>
              <View style={s.headInfo}>
                <Text style={[s.headEyebrow, { color: colors.text.tertiary }]}>HEAD OF DEPARTMENT</Text>
                <View style={s.headNameRow}>
                  <Text style={[s.headName, { color: colors.text.primary }]}>{dept.headName ?? 'Unassigned'}</Text>
                  <View style={[s.adminBadge, { backgroundColor: colors.brand.secondary }]}>
                    <Text style={s.adminBadgeText}>ADMIN</Text>
                  </View>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color={colors.surface.borderStrong} />
            </Pressable>
          )}
        </View>

        {/* ── KPI strip ────────────────────────────────────────────────── */}
        <View style={[s.kpiStrip, { backgroundColor: colors.surface.background }]}>
          <KpiCell value={dept.memberCount} label="Members" colors={colors} />
          <KpiCell value={taskStats.activeCount} label="Active tasks" colors={colors} />
          <KpiCell value={`${taskStats.onTimeRate}%`} label="On-time rate" colors={colors} accent={rateTextColor(taskStats.onTimeRate, colors)} />
          <KpiCell value={taskStats.overdueCount} label="Overdue" colors={colors} accent={colors.semantic.error} />
        </View>

        {/* ── Task status ──────────────────────────────────────────────── */}
        <SectionLabel>Task status</SectionLabel>
        <View style={[s.card, { backgroundColor: colors.surface.card, marginHorizontal: Spacing[4] }]}>
          <View style={s.taskStatusHeader}>
            <Text style={[s.cardTitle, { color: colors.text.primary }]}>Overview</Text>
            <Text style={[s.cardCaption, { color: colors.text.tertiary }]}>This month</Text>
          </View>
          <View style={[s.segmentBar, { backgroundColor: colors.surface.background }]}>
            {completedPercent > 0 && <View style={[s.segment, { width: `${completedPercent}%`, backgroundColor: colors.semantic.success }]} />}
            {inProgressPercent > 0 && <View style={[s.segment, { width: `${inProgressPercent}%`, backgroundColor: colors.semantic.warning }]} />}
            {overduePercent > 0 && <View style={[s.segment, { width: `${overduePercent}%`, backgroundColor: colors.semantic.error }]} />}
          </View>
          <View style={s.legendRow}>
            <LegendDot color={colors.semantic.success} label="Completed" value={taskStats.completedCount} colors={colors} />
            <LegendDot color={colors.semantic.warning} label="In progress" value={taskStats.inProgressCount} colors={colors} />
            <LegendDot color={colors.semantic.error} label="Overdue" value={taskStats.overdueCount} colors={colors} />
          </View>
        </View>

        {/* ── Composition ──────────────────────────────────────────────── */}
        {composition && (
          <>
            <SectionLabel>Composition</SectionLabel>
            <View style={[s.card, { backgroundColor: colors.surface.card, marginHorizontal: Spacing[4] }]}>
              <CompositionRow swatch="#4F46E5" label="Admins" value={composition.admins} colors={colors} />
              <View style={[s.cardDivider, { backgroundColor: colors.surface.border }]} />
              <CompositionRow swatch="#1D4ED8" label="Employees" value={composition.employees} colors={colors} />
              <View style={[s.cardDivider, { backgroundColor: colors.surface.border }]} />
              <CompositionRow swatch="#94A3B8" label="Suspended" value={composition.suspended} colors={colors} muted last />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function LegendDot({ color, label, value, colors }: { color: string; label: string; value: number; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={ld.row}>
      <View style={[ld.dot, { backgroundColor: color }]} />
      <Text style={[ld.text, { color: colors.text.secondary }]}>{label} {value}</Text>
    </View>
  );
}
const ld = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontSize: 11.5, fontFamily: 'Inter-Regular' },
});

function CompositionRow({ swatch, label, value, colors, muted, last }: { swatch: string; label: string; value: number; colors: ReturnType<typeof useColors>; muted?: boolean; last?: boolean }) {
  return (
    <View style={[cr.row, !last && { borderBottomWidth: 0 }]}>
      <View style={[cr.swatch, { backgroundColor: swatch }]} />
      <Text style={[cr.label, { color: colors.text.primary }]}>{label}</Text>
      <Text style={[cr.value, { color: muted ? colors.text.tertiary : colors.text.primary }]}>{value}</Text>
    </View>
  );
}
const cr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, paddingHorizontal: 16 },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  label: { flex: 1, fontSize: 13.5, fontFamily: 'Inter-Regular' },
  value: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
});

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1 },
  headerBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  membersBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 34, paddingHorizontal: 12, borderRadius: 9, borderWidth: 1 },
  membersBtnText: { fontSize: 12.5, fontFamily: 'Inter-SemiBold' },
  loadingBody: { padding: Spacing[4], gap: Spacing[3] },

  identityBlock: { alignItems: 'center', paddingHorizontal: Spacing[5], paddingVertical: 20, paddingTop: 8 },
  icon56: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  name: { fontSize: 20, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  codeBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
  codeBadgeText: { fontSize: 11, fontFamily: 'Inter-Bold', letterSpacing: 0.3 },
  meta: { fontSize: 13, fontFamily: 'Inter-Regular', marginTop: 6 },

  headRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18,
    borderWidth: 1, borderRadius: 13, padding: 12, paddingHorizontal: 14, width: '100%',
  },
  headAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headAvatarText: { fontSize: 13, fontFamily: 'Inter-Bold' },
  headInfo: { flex: 1, minWidth: 0 },
  headEyebrow: { fontSize: 10, fontFamily: 'Inter-Bold', letterSpacing: 0.4 },
  headNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 2 },
  headName: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  adminBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  adminBadgeText: { fontSize: 9, fontFamily: 'Inter-Bold', color: '#FFFFFF', letterSpacing: 0.3 },

  kpiStrip: { flexDirection: 'row', gap: 1, marginTop: 8 },

  card: { borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  cardDivider: { height: 1 },
  cardTitle: { fontSize: 13.5, fontFamily: 'Inter-SemiBold' },
  cardCaption: { fontSize: 11, fontFamily: 'Inter-Regular' },

  taskStatusHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, paddingBottom: 10 },
  segmentBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginHorizontal: 14 },
  segment: { height: '100%' },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, paddingTop: 12 },
});
