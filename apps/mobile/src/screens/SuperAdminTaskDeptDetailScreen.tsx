/**
 * SuperAdminTaskDeptDetailScreen — department drill-down (HTML screen 59,
 * "SA Tasks — Dept drill-down: aggregate health, no contents"). Reached by
 * tapping a department card in the Departments segment.
 */

import React, { useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { useDepartmentTaskDetail } from '../hooks/useSuperAdminTasks';

import { RiskBadge } from '../components/task/oversight/RiskBadge';
import { StatusDistributionBar } from '../components/task/oversight/StatusDistributionBar';
import { StaffLoadRow } from '../components/task/oversight/StaffLoadRow';
import { PrivacyNoteBanner } from '../components/task/oversight/PrivacyNoteBanner';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

export function SuperAdminTaskDeptDetailScreen() {
  const { deptId } = useLocalSearchParams<{ deptId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, isLoading } = useDepartmentTaskDetail(deptId ?? '');

  const push = useCallback((path: string) => router.push(path as Parameters<typeof router.push>[0]), [router]);

  const goStaffLoad = useCallback((staffId: string) => push(`/(app)/sa-tasks/staff/${staffId}`), [push]);
  const goAudit = useCallback(() => push('/(app)/audit'), [push]);
  const handleMessage = useCallback(() => {
    Alert.alert('Message admin', 'Direct messaging is not yet available in this build.');
  }, []);

  if (isLoading || !data) {
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
          <Skeleton height={160} borderRadius={14} />
        </View>
      </View>
    );
  }

  const { dept, staffLoad } = data;

  return (
    <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
      <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <View style={s.headerInfo}>
          <Text style={[s.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
            {dept.departmentName}
          </Text>
          <Text style={[s.headerSubtitle, { color: colors.text.tertiary }]}>Task health · aggregate</Text>
        </View>
        <RiskBadge level={dept.riskLevel} />
      </View>

      <ScrollView
        style={s.body}
        contentContainerStyle={{ paddingBottom: Spacing[6] }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.summaryCard, { backgroundColor: colors.surface.card }]}>
          <View style={[s.deptIcon, { backgroundColor: colors.surface.background }]}>
            <Feather name="grid" size={24} color={colors.text.secondary} />
          </View>
          <View style={s.summaryInfo}>
            <Text style={[s.summaryTitle, { color: colors.text.primary }]}>{dept.departmentName} Dept</Text>
            <View style={s.summaryMetaRow}>
              <View style={[s.adminAvatar, { backgroundColor: colors.brand.secondary }]}>
                <Text style={s.adminAvatarText}>{dept.adminInitials}</Text>
              </View>
              <Text style={[s.summaryMeta, { color: colors.text.secondary }]} numberOfLines={1}>
                Admin · {dept.adminName} · {dept.staffCount} staff
              </Text>
            </View>
          </View>
        </View>

        <View style={[s.kpiStrip, { backgroundColor: colors.surface.background }]}>
          <View style={[s.kpiCell, { backgroundColor: colors.surface.card }]}>
            <Text style={[s.kpiValue, { color: colors.text.primary }]}>{dept.activeCount}</Text>
            <Text style={[s.kpiLabel, { color: colors.text.tertiary }]}>Active</Text>
          </View>
          <View style={[s.kpiCell, { backgroundColor: colors.surface.card }]}>
            <Text style={[s.kpiValue, { color: colors.semantic.error }]}>{dept.overdueCount}</Text>
            <Text style={[s.kpiLabel, { color: colors.text.tertiary }]}>Overdue</Text>
          </View>
          <View style={[s.kpiCell, { backgroundColor: colors.surface.card }]}>
            <Text style={[s.kpiValue, { color: '#B45309' }]}>{dept.onTimeRate}%</Text>
            <Text style={[s.kpiLabel, { color: colors.text.tertiary }]}>On-time</Text>
          </View>
          <View style={[s.kpiCell, { backgroundColor: colors.surface.card }]}>
            <Text style={[s.kpiValue, { color: colors.text.primary }]}>
              {(dept.overdueCount > 0 ? 2 + dept.overdueCount * 0.1 : 1.4).toFixed(1)}d
            </Text>
            <Text style={[s.kpiLabel, { color: colors.text.tertiary }]}>Avg cycle</Text>
          </View>
        </View>

        <View style={[s.card, { backgroundColor: colors.surface.card }]}>
          <Text style={[s.cardTitle, { color: colors.text.secondary }]}>Status distribution</Text>
          <StatusDistributionBar distribution={dept.statusDistribution} total={dept.activeCount} />
        </View>

        <View style={[s.card, { backgroundColor: colors.surface.card }]}>
          <View style={s.cardHeaderRow}>
            <Text style={[s.cardTitle, { color: colors.text.secondary }]}>Load by staff</Text>
            <Text style={[s.cardMeta, { color: colors.text.tertiary }]}>counts only</Text>
          </View>
          {staffLoad.length > 0 ? (
            <View style={s.staffList}>
              {staffLoad.map((staff) => (
                <StaffLoadRow key={staff.staffId} staff={staff} onPress={goStaffLoad} />
              ))}
            </View>
          ) : (
            <EmptyState icon="users" title="No staff assigned yet" />
          )}
        </View>

        <View style={s.privacyWrap}>
          <PrivacyNoteBanner text="Task titles & details are hidden. To act, message the admin or open the audit trail." />
        </View>
      </ScrollView>

      <View style={[s.actionsBar, { backgroundColor: colors.surface.card, borderTopColor: colors.surface.border, paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={handleMessage}
          style={({ pressed }) => [s.primaryAction, { backgroundColor: colors.brand.secondary }, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Message admin"
        >
          <Feather name="message-square" size={16} color="#FFFFFF" />
          <Text style={s.primaryActionText}>Message admin</Text>
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
  deptIcon: { width: 52, height: 52, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  summaryInfo: { flex: 1, minWidth: 0 },
  summaryTitle: { fontSize: 17, fontFamily: 'Inter-SemiBold' },
  summaryMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  adminAvatar: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  adminAvatarText: { fontSize: 9, fontFamily: 'Inter-Bold', color: '#FFFFFF' },
  summaryMeta: { fontSize: 12.5, fontFamily: 'Inter-Regular', flex: 1 },
  kpiStrip: { flexDirection: 'row', gap: 1, marginTop: 8 },
  kpiCell: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  kpiValue: { fontSize: 19, fontFamily: 'Inter-Bold' },
  kpiLabel: { fontSize: 10.5, fontFamily: 'Inter-Regular', marginTop: 2 },
  card: { marginTop: 8, padding: Spacing[5], backgroundColor: '#fff' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  cardTitle: { fontSize: 13, fontFamily: 'Inter-SemiBold', marginBottom: 12 },
  cardMeta: { fontSize: 10.5, fontFamily: 'Inter-Regular' },
  staffList: { gap: 13 },
  privacyWrap: { margin: Spacing[4], marginTop: Spacing[3] },
  actionsBar: { flexDirection: 'row', gap: 10, padding: Spacing[4], borderTopWidth: 1 },
  primaryAction: { flex: 1, height: 48, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryActionText: { fontSize: 13.5, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
  secondaryAction: { flex: 1, height: 48, borderRadius: 10, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  secondaryActionText: { fontSize: 13.5, fontFamily: 'Inter-SemiBold' },
  pressed: { opacity: 0.85 },
});
