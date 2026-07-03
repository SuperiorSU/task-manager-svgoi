/**
 * StaffLoadDetailScreen — single staff member, aggregate view (HTML screen
 * 67, "Staff load detail"). Reached from a department drill-down's "Load by
 * staff" row. Still counts-only per FR-72 — "View full task list" drills one
 * level further into StaffTaskListScreen, which is where real titles (if
 * authored for this staff member) appear.
 */

import React, { useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useStaffLoadDetail } from '../hooks/useSuperAdminTasks';
import { useColors } from '../constants/colors';
import { Spacing } from '../constants/spacing';

import { RiskBadge } from '../components/task/oversight/RiskBadge';
import { CapacityGauge } from '../components/task/oversight/CapacityGauge';
import { Skeleton } from '../components/ui/Skeleton';

export function StaffLoadDetailScreen() {
  const { staffId } = useLocalSearchParams<{ staffId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: staff, isLoading } = useStaffLoadDetail(staffId ?? '');

  const push = useCallback((path: string) => router.push(path as Parameters<typeof router.push>[0]), [router]);
  const goTaskList = useCallback(() => push(`/(app)/sa-tasks/staff/${staffId}/tasks`), [push, staffId]);
  const goAudit = useCallback(() => push('/(app)/audit'), [push]);
  const handleFlag = useCallback(() => {
    Alert.alert('Flag to admin', 'Direct messaging is not yet available in this build.');
  }, []);

  if (isLoading || !staff) {
    return (
      <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
        <View style={[s.header, { paddingTop: insets.top + 6 }]}>
          <Pressable onPress={() => router.back()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Back">
            <Feather name="chevron-left" size={22} color={colors.text.primary} />
          </Pressable>
        </View>
        <View style={s.loadingBody}>
          <Skeleton height={90} borderRadius={14} />
          <Skeleton height={140} borderRadius={14} />
        </View>
      </View>
    );
  }

  return (
    <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
      <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <View style={s.headerInfo}>
          <Text style={[s.headerTitle, { color: colors.text.primary }]}>Staff load</Text>
          <Text style={[s.headerSubtitle, { color: colors.text.tertiary }]}>{staff.departmentName} · aggregate</Text>
        </View>
        <RiskBadge level={staff.riskLevel} label={staff.riskLevel === 'CRITICAL' ? 'OVERLOADED' : undefined} />
      </View>

      <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: Spacing[6] }} showsVerticalScrollIndicator={false}>
        <View style={[s.summaryCard, { backgroundColor: colors.surface.card }]}>
          <View style={[s.avatar, { backgroundColor: staff.avatarBg }]}>
            <Text style={s.avatarText}>{staff.initials}</Text>
          </View>
          <View style={s.summaryInfo}>
            <View style={s.nameRow}>
              <Text style={[s.name, { color: colors.text.primary }]}>{staff.name}</Text>
              <View style={[s.roleBadge, { backgroundColor: colors.surface.background }]}>
                <Text style={[s.roleBadgeText, { color: colors.text.secondary }]}>EMPLOYEE</Text>
              </View>
            </View>
            <Text style={[s.meta, { color: colors.text.secondary }]} numberOfLines={1}>
              {staff.departmentName} · under {staff.managerName}
            </Text>
          </View>
        </View>

        <View style={[s.kpiStrip, { backgroundColor: colors.surface.background }]}>
          <View style={[s.kpiCell, { backgroundColor: colors.surface.card }]}>
            <Text style={[s.kpiValue, { color: colors.text.primary }]}>{staff.activeCount}</Text>
            <Text style={[s.kpiLabel, { color: colors.text.tertiary }]}>Active</Text>
          </View>
          <View style={[s.kpiCell, { backgroundColor: colors.surface.card }]}>
            <Text style={[s.kpiValue, { color: colors.semantic.error }]}>{staff.overdueCount}</Text>
            <Text style={[s.kpiLabel, { color: colors.text.tertiary }]}>Overdue</Text>
          </View>
          <View style={[s.kpiCell, { backgroundColor: colors.surface.card }]}>
            <Text style={[s.kpiValue, { color: colors.text.primary }]}>{staff.avgCycleDays.toFixed(1)}d</Text>
            <Text style={[s.kpiLabel, { color: colors.text.tertiary }]}>Avg cycle</Text>
          </View>
        </View>

        <View style={[s.card, { backgroundColor: colors.surface.card }]}>
          <CapacityGauge percent={staff.capacityPercent} target={staff.capacityTarget} current={staff.activeCount} riskLevel={staff.riskLevel} />
        </View>

        <Pressable
          onPress={goTaskList}
          style={({ pressed }) => [s.ctaCard, { backgroundColor: colors.surface.card }, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel="View full task list"
        >
          <View style={[s.ctaIcon, { backgroundColor: '#EEF2FB' }]}>
            <Feather name="list" size={18} color={colors.brand.secondary} />
          </View>
          <View style={s.ctaInfo}>
            <Text style={[s.ctaTitle, { color: colors.text.primary }]}>View full task list</Text>
            <Text style={[s.ctaSubtitle, { color: colors.text.tertiary }]}>All {staff.activeCount} tasks by status</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.surface.borderStrong} />
        </Pressable>
      </ScrollView>

      <View style={[s.actionsBar, { backgroundColor: colors.surface.card, borderTopColor: colors.surface.border, paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={handleFlag}
          style={({ pressed }) => [s.primaryAction, { backgroundColor: colors.brand.secondary }, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Flag to admin"
        >
          <Feather name="message-square" size={16} color="#FFFFFF" />
          <Text style={s.primaryActionText}>Flag to admin</Text>
        </Pressable>
        <Pressable
          onPress={goAudit}
          style={({ pressed }) => [s.secondaryAction, { borderColor: colors.surface.border }, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Audit trail"
        >
          <Feather name="list" size={16} color={colors.text.secondary} />
          <Text style={[s.secondaryActionText, { color: colors.text.secondary }]}>Audit trail</Text>
        </Pressable>
      </View>
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
  body: { flex: 1 },
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: Spacing[5], paddingTop: Spacing[4] },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
  summaryInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { fontSize: 17, fontFamily: 'Inter-SemiBold' },
  roleBadge: { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  roleBadgeText: { fontSize: 9, fontFamily: 'Inter-Bold', letterSpacing: 0.3 },
  meta: { fontSize: 12, fontFamily: 'Inter-Regular', marginTop: 3 },
  kpiStrip: { flexDirection: 'row', gap: 1, marginTop: 8 },
  kpiCell: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  kpiValue: { fontSize: 19, fontFamily: 'Inter-Bold' },
  kpiLabel: { fontSize: 10.5, fontFamily: 'Inter-Regular', marginTop: 2 },
  card: { marginTop: 8, padding: Spacing[5] },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 13, fontFamily: 'Inter-SemiBold' },
  linkText: { fontSize: 11.5, fontFamily: 'Inter-SemiBold' },
  ctaCard: { flexDirection: 'row', alignItems: 'center', gap: 11, margin: Spacing[4], marginTop: Spacing[3], borderRadius: 11, padding: 13 },
  pressed: { opacity: 0.85 },
  ctaIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  ctaInfo: { flex: 1, minWidth: 0 },
  ctaTitle: { fontSize: 13.5, fontFamily: 'Inter-SemiBold' },
  ctaSubtitle: { fontSize: 11, fontFamily: 'Inter-Regular', marginTop: 1 },
  actionsBar: { flexDirection: 'row', gap: 10, padding: Spacing[4], borderTopWidth: 1 },
  primaryAction: { flex: 1, height: 48, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryActionText: { fontSize: 13.5, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
  secondaryAction: { flex: 1, height: 48, borderRadius: 10, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  secondaryActionText: { fontSize: 13.5, fontFamily: 'Inter-SemiBold' },
});
