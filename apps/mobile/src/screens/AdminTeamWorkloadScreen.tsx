/**
 * AdminTeamWorkloadScreen — "Team workload — full" (HTML screen 73).
 * Reached from Admin Dashboard → Workload distribution → See all.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import type { WorkloadMember } from '../services/adminWorkload.service';
import { useTeamWorkload } from '../hooks/useAdminWorkload';
import { useColors } from '../constants/colors';
import { Spacing } from '../constants/spacing';

import { WorkloadMemberRow } from '../components/task/workload/WorkloadMemberRow';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

type SortDirection = 'desc' | 'asc';

export function AdminTeamWorkloadScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isRefetching, refetch } = useTeamWorkload();
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const push = useCallback((path: string) => router.push(path as Parameters<typeof router.push>[0]), [router]);
  const goMember = useCallback((userId: string) => push(`/(app)/admin-workload/${userId}`), [push]);

  const members = useMemo(() => {
    const list = data?.members ?? [];
    return sortDirection === 'desc'
      ? list
      : [...list].sort((a, b) => a.capacityPercent - b.capacityPercent);
  }, [data, sortDirection]);

  const handleSortPress = useCallback(() => {
    Alert.alert('Sort by capacity', undefined, [
      { text: 'High → Low', onPress: () => setSortDirection('desc') },
      { text: 'Low → High', onPress: () => setSortDirection('asc') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  if (isLoading || !data) {
    return (
      <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
        <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card }]}>
          <Pressable onPress={() => router.back()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Back">
            <Feather name="chevron-left" size={22} color={colors.text.primary} />
          </Pressable>
        </View>
        <View style={s.loadingBody}>
          <Skeleton height={64} borderRadius={0} />
          <Skeleton height={90} borderRadius={14} />
          <Skeleton height={72} borderRadius={13} />
          <Skeleton height={72} borderRadius={13} />
          <Skeleton height={72} borderRadius={13} />
        </View>
      </View>
    );
  }

  return (
    <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <View style={s.headerInfo}>
          <Text style={[s.headerTitle, { color: colors.text.primary }]}>Team workload</Text>
          <Text style={[s.headerSubtitle, { color: colors.text.tertiary }]}>
            {data.departmentName} department · {data.memberCount} people
          </Text>
        </View>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.userId}
        renderItem={({ item }: { item: WorkloadMember }) => (
          <WorkloadMemberRow member={item} onPress={goMember} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {/* ── KPI strip ──────────────────────────────────────────────── */}
            <View style={[s.kpiStrip, { backgroundColor: colors.surface.background }]}>
              <KpiCell value={data.totals.active} label="Active" color={colors.text.primary} colors={colors} />
              <KpiCell
                value={data.totals.avgPerPerson}
                label="Avg / person"
                color={colors.text.primary}
                colors={colors}
              />
              <KpiCell value={data.totals.overloadedCount} label="Overloaded" color="#B91C1C" colors={colors} />
              <KpiCell value={data.totals.freeCount} label="Free" color="#15803D" colors={colors} />
            </View>

            {/* ── Balance banner ─────────────────────────────────────────── */}
            {data.banner && (
              <View style={[s.banner, { backgroundColor: '#FFFBEB', borderColor: '#FDE9C8' }]}>
                <View style={[s.bannerIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Feather name="alert-triangle" size={16} color="#B45309" />
                </View>
                <View style={s.bannerBody}>
                  <Text style={s.bannerTitle}>
                    {data.banner.memberName.split(' ')[0]} is at {data.banner.percent}% capacity
                  </Text>
                  <Text style={s.bannerSubtitle}>{data.banner.suggestion}</Text>
                </View>
              </View>
            )}

            {/* ── Sort control ───────────────────────────────────────────── */}
            <View style={s.sortRow}>
              <Text style={[s.sortLabel, { color: colors.text.tertiary }]}>
                By capacity · {sortDirection === 'desc' ? 'high → low' : 'low → high'}
              </Text>
              <Pressable onPress={handleSortPress} style={s.sortBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Change sort order">
                <Text style={[s.sortBtnText, { color: colors.brand.primary }]}>Sort</Text>
                <Feather name="chevron-down" size={14} color={colors.brand.primary} />
              </Pressable>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <EmptyState
              icon="users"
              title="No workload data yet"
              subtitle="Assign tasks to your team to see capacity here."
            />
          </View>
        }
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + Spacing[6] }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function KpiCell({
  value,
  label,
  color,
  colors,
}: {
  value: number;
  label: string;
  color: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[s.kpiCell, { backgroundColor: colors.surface.card }]}>
      <Text style={[s.kpiValue, { color }]}>{value}</Text>
      <Text style={[s.kpiLabel, { color: colors.text.tertiary }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingBottom: 12 },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold' },
  headerSubtitle: { fontSize: 11, fontFamily: 'Inter-Regular', marginTop: 1 },
  loadingBody: { padding: Spacing[4], gap: Spacing[3] },
  list: { paddingHorizontal: Spacing[4] },
  kpiStrip: { flexDirection: 'row', gap: 1, marginTop: 8, marginHorizontal: -Spacing[4] },
  kpiCell: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  kpiValue: { fontSize: 19, fontFamily: 'Inter-Bold' },
  kpiLabel: { fontSize: 10.5, fontFamily: 'Inter-Regular', marginTop: 2 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  bannerIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  bannerBody: { flex: 1, minWidth: 0 },
  bannerTitle: { fontSize: 12.5, fontFamily: 'Inter-SemiBold', color: '#92400E' },
  bannerSubtitle: { fontSize: 11, fontFamily: 'Inter-Regular', color: '#B45309', marginTop: 1 },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 10,
  },
  sortLabel: { fontSize: 11, fontFamily: 'Inter-Bold', letterSpacing: 0.5, textTransform: 'uppercase' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  sortBtnText: { fontSize: 12.5, fontFamily: 'Inter-SemiBold' },
  emptyWrap: { marginTop: Spacing[4] },
});
