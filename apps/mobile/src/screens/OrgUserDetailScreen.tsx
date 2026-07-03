/**
 * OrgUserDetailScreen — SA "User detail" (HTML screen 68, People · Users →
 * User detail). Full org-wide user record: identity, account info, ongoing
 * task load, activity history, manage actions. Reached from
 * SuperAdminPeopleScreen's Users list (OrgUserCard onPress) — distinct from
 * Admin's own `/people/[id]` (team.mock.ts's dept-scoped roster).
 *
 * Ongoing load and its "Task history & load" destination are role-conditional
 * (per orgDirectoryService.getUserDetail): Employees get their personal
 * StaffLoadSummary and route to the existing Staff load screen (67);
 * Admins get the DeptTaskHealth row for the department they administer and
 * route to the existing dept drill-down (59) — there's no personal
 * StaffLoadSummary for an Admin (FR-72 aggregates are per-employee).
 */

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import type { OrgUser } from '../hooks/useOrgDirectory';
import {
  useOrgUserDetail,
  useChangeOrgUserRole,
  useResetOrgUserPassword,
  useSuspendOrgUser,
  useReactivateOrgUser,
} from '../hooks/useOrgDirectory';
import { useColors } from '../constants/colors';
import { Spacing } from '../constants/spacing';

import { OrgUserActivityTimeline } from '../components/people/OrgUserActivityTimeline';
import { OrgUserManageRow } from '../components/people/OrgUserManageRow';
import { OrgChangeRoleSheet } from '../components/people/OrgChangeRoleSheet';
import { OrgResetPasswordSheet } from '../components/people/OrgResetPasswordSheet';
import { OrgSuspendConfirmModal } from '../components/people/OrgSuspendConfirmModal';
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

function AccountRow({
  icon,
  label,
  value,
  mono,
  last,
  colors,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[ar.row, !last && { borderBottomWidth: 1, borderBottomColor: colors.surface.border }]}>
      <Feather name={icon} size={17} color={colors.text.tertiary} />
      <View style={ar.info}>
        <Text style={[ar.label, { color: colors.text.tertiary }]}>{label}</Text>
        <Text style={[ar.value, { color: colors.text.primary }, mono && ar.mono]}>{value}</Text>
      </View>
    </View>
  );
}
const ar = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 12, paddingHorizontal: 16 },
  info: { flex: 1, minWidth: 0 },
  label: { fontSize: 11, fontFamily: 'Inter-Regular' },
  value: { fontSize: 13, fontFamily: 'Inter-Regular', marginTop: 1 },
  mono: { fontFamily: 'Inter-Regular', letterSpacing: 0.2 },
});

export function OrgUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: user, isLoading } = useOrgUserDetail(id ?? '');
  const changeRole = useChangeOrgUserRole(id ?? '');
  const resetPassword = useResetOrgUserPassword(id ?? '');
  const suspend = useSuspendOrgUser(id ?? '');
  const reactivate = useReactivateOrgUser(id ?? '');

  const [overflowVisible, setOverflowVisible] = useState(false);
  const [roleSheetVisible, setRoleSheetVisible] = useState(false);
  const [resetVisible, setResetVisible] = useState(false);
  const [suspendVisible, setSuspendVisible] = useState(false);

  const push = useCallback((path: string) => router.push(path as Parameters<typeof router.push>[0]), [router]);

  const goTaskLoad = useCallback(() => {
    if (!user) return;
    if (user.role === 'EMPLOYEE') {
      push(`/(app)/sa-tasks/staff/${user.id}`);
    } else if (user.primaryDepartmentId) {
      push(`/(app)/sa-tasks/dept/${user.primaryDepartmentId}`);
    }
  }, [push, user]);

  const handleChangeRole = useCallback(
    async (u: OrgUser, role: OrgUser['role']) => {
      await changeRole.mutateAsync(role);
      setRoleSheetVisible(false);
      setOverflowVisible(false);
    },
    [changeRole]
  );

  const handleResetPassword = useCallback(async () => {
    await resetPassword.mutateAsync();
    setResetVisible(false);
    setOverflowVisible(false);
  }, [resetPassword]);

  const handleSuspendToggle = useCallback(async () => {
    if (!user) return;
    if (user.status === 'ACTIVE') {
      await suspend.mutateAsync();
    } else {
      await reactivate.mutateAsync();
    }
    setSuspendVisible(false);
    setOverflowVisible(false);
  }, [user, suspend, reactivate]);

  if (isLoading || !user) {
    return (
      <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
        <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
          <Pressable onPress={() => router.back()} style={s.headerBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
            <Feather name="chevron-left" size={22} color={colors.text.primary} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.text.primary }]}>User record</Text>
          <View style={s.headerBtn} />
        </View>
        <View style={s.loadingBody}>
          <Skeleton height={160} borderRadius={16} />
          <Skeleton height={90} borderRadius={14} />
          <Skeleton height={140} borderRadius={14} />
        </View>
      </View>
    );
  }

  const isActive = user.status === 'ACTIVE';
  const deptLabel = user.departments.map((d) => d.name).join(', ') || '—';
  const joined = dayjs(user.createdAt);
  const yearsTenure = (dayjs().diff(joined, 'day') / 365).toFixed(1);
  const lastActive = dayjs(user.lastActiveAt);
  const lastActiveLabel = lastActive.isSame(dayjs(), 'day')
    ? `Today, ${lastActive.format('h:mm A')}`
    : lastActive.format('MMM D, h:mm A');

  const overdueCount = user.ongoingLoad.overdueCount;

  return (
    <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable onPress={() => router.back()} style={s.headerBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.text.primary }]}>User record</Text>
        <Pressable onPress={() => setOverflowVisible(true)} style={s.headerBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="More actions">
          <Feather name="more-vertical" size={20} color={colors.text.tertiary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* ── Identity ─────────────────────────────────────────────────── */}
        <View style={[s.identityBlock, { backgroundColor: colors.surface.card }]}>
          <View style={[s.avatar76, { backgroundColor: user.avatarBg }]}>
            <Text style={[s.avatar76Text, { color: user.avatarText }]}>{user.initials}</Text>
          </View>
          <View style={s.nameRow}>
            <Text style={[s.name, { color: colors.text.primary }]}>{user.name}</Text>
            {user.role === 'ADMIN' ? (
              <View style={[s.roleBadgeAdmin, { backgroundColor: colors.brand.secondary }]}>
                <Feather name="shield" size={10} color="#FFFFFF" />
                <Text style={s.roleBadgeAdminText}>Admin</Text>
              </View>
            ) : (
              <View style={[s.roleBadgeEmp, { backgroundColor: colors.surface.background }]}>
                <Text style={[s.roleBadgeEmpText, { color: colors.text.secondary }]}>Employee</Text>
              </View>
            )}
          </View>
          <Text style={[s.designation, { color: colors.text.secondary }]}>
            {user.designation ? `${user.designation} · ` : ''}
            {deptLabel}
          </Text>
          <View style={[s.statusPill, { backgroundColor: isActive ? '#F0FDF4' : '#FEF2F2', borderColor: isActive ? '#DCFCE7' : '#FECACA' }]}>
            <View style={[s.statusDot, { backgroundColor: isActive ? '#10B981' : '#EF4444' }]} />
            <Text style={[s.statusText, { color: isActive ? '#15803D' : '#B91C1C' }]}>
              {isActive ? 'Active account' : 'Suspended account'}
            </Text>
          </View>
        </View>

        {/* ── Ongoing load (aggregate, role-conditional) ─────────────────── */}
        <View style={[s.kpiStrip, { backgroundColor: colors.surface.background }]}>
          {user.ongoingLoad.kind === 'DEPT' ? (
            <>
              <KpiCell value={user.ongoingLoad.staffCount} label="Team" colors={colors} />
              <KpiCell value={user.ongoingLoad.activeCount} label="Dept active" colors={colors} />
              <KpiCell value={user.ongoingLoad.overdueCount} label="Overdue" colors={colors} accent={colors.semantic.error} />
              <KpiCell value={`${user.ongoingLoad.onTimeRate}%`} label="On-time" colors={colors} accent="#B45309" />
            </>
          ) : (
            <>
              <KpiCell value={user.ongoingLoad.activeCount} label="Active" colors={colors} />
              <KpiCell value={user.ongoingLoad.overdueCount} label="Overdue" colors={colors} accent={colors.semantic.error} />
              <KpiCell value={`${user.ongoingLoad.onTimeRate}%`} label="On-time" colors={colors} accent="#B45309" />
              <KpiCell value={`${user.ongoingLoad.avgCycleDays.toFixed(1)}d`} label="Avg cycle" colors={colors} />
            </>
          )}
        </View>

        {/* ── Task history & load link ─────────────────────────────────── */}
        <SectionLabel>Tasks</SectionLabel>
        <Pressable
          onPress={goTaskLoad}
          style={({ pressed }) => [s.taskLink, { backgroundColor: colors.surface.card }, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Task history and load"
        >
          <View style={[s.taskLinkIcon, { backgroundColor: '#EEF2FB' }]}>
            <Feather name="check-square" size={18} color={colors.brand.secondary} />
          </View>
          <View style={s.taskLinkInfo}>
            <Text style={[s.taskLinkTitle, { color: colors.text.primary }]}>Task history &amp; load</Text>
            <Text style={[s.taskLinkSub, { color: colors.text.tertiary }]}>Distribution, list &amp; task details</Text>
          </View>
          {overdueCount > 0 ? (
            <View style={[s.overdueBadge, { backgroundColor: '#FEF2F2' }]}>
              <Text style={s.overdueBadgeText}>{overdueCount} overdue</Text>
            </View>
          ) : (
            <View style={[s.overdueBadge, { backgroundColor: '#F0FDF4' }]}>
              <Text style={s.onTrackBadgeText}>On track</Text>
            </View>
          )}
          <Feather name="chevron-right" size={18} color={colors.surface.borderStrong} />
        </Pressable>

        {/* ── Account info ─────────────────────────────────────────────── */}
        <SectionLabel>Account</SectionLabel>
        <View style={[s.card, { backgroundColor: colors.surface.card, marginHorizontal: Spacing[4] }]}>
          <AccountRow icon="mail" label="Email" value={user.email} colors={colors} />
          <AccountRow icon="hash" label="User ID" value={user.staffId} mono colors={colors} />
          <AccountRow icon="calendar" label="Joined" value={`${joined.format('MMM D, YYYY')} · ${yearsTenure} yrs`} colors={colors} />
          <AccountRow icon="clock" label="Last active" value={`${lastActiveLabel} · IP ${user.lastActiveIp}`} last colors={colors} />
        </View>

        {/* ── Activity history ─────────────────────────────────────────── */}
        <OrgUserActivityTimeline events={user.activityHistory} />

        {/* ── Manage ───────────────────────────────────────────────────── */}
        <SectionLabel>Manage</SectionLabel>
        <View style={[s.card, { backgroundColor: colors.surface.card, marginHorizontal: Spacing[4] }]}>
          <OrgUserManageRow icon="shield" label="Change role" onPress={() => setRoleSheetVisible(true)} />
          <View style={[s.cardDivider, { backgroundColor: colors.surface.border }]} />
          <OrgUserManageRow icon="lock" label="Reset password" accent={colors.brand.primary} onPress={() => setResetVisible(true)} />
          <View style={[s.cardDivider, { backgroundColor: colors.surface.border }]} />
          {isActive ? (
            <OrgUserManageRow icon="user-x" label="Suspend account" danger onPress={() => setSuspendVisible(true)} />
          ) : (
            <OrgUserManageRow icon="user-check" label="Reactivate account" accent="#16A34A" onPress={() => setSuspendVisible(true)} />
          )}
        </View>
      </ScrollView>

      {/* ── Overflow menu (mirrors Manage — quick access from header) ───── */}
      <Modal transparent animationType="fade" visible={overflowVisible} onRequestClose={() => setOverflowVisible(false)} statusBarTranslucent>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setOverflowVisible(false)} />
        <View style={[s.overflowMenu, { backgroundColor: colors.surface.card, top: insets.top + 60, right: 16 }]}>
          <OrgUserManageRow icon="shield" label="Change role" onPress={() => { setOverflowVisible(false); setRoleSheetVisible(true); }} />
          <View style={[s.cardDivider, { backgroundColor: colors.surface.border }]} />
          <OrgUserManageRow icon="lock" label="Reset password" accent={colors.brand.primary} onPress={() => { setOverflowVisible(false); setResetVisible(true); }} />
          <View style={[s.cardDivider, { backgroundColor: colors.surface.border }]} />
          {isActive ? (
            <OrgUserManageRow icon="user-x" label="Suspend account" danger onPress={() => { setOverflowVisible(false); setSuspendVisible(true); }} />
          ) : (
            <OrgUserManageRow icon="user-check" label="Reactivate account" accent="#16A34A" onPress={() => { setOverflowVisible(false); setSuspendVisible(true); }} />
          )}
        </View>
      </Modal>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <OrgChangeRoleSheet user={user} visible={roleSheetVisible} onConfirm={handleChangeRole} onDismiss={() => setRoleSheetVisible(false)} />
      <OrgResetPasswordSheet user={user} visible={resetVisible} onConfirm={handleResetPassword} onDismiss={() => setResetVisible(false)} />
      <OrgSuspendConfirmModal
        user={user}
        mode={isActive ? 'SUSPEND' : 'REACTIVATE'}
        visible={suspendVisible}
        onConfirm={handleSuspendToggle}
        onDismiss={() => setSuspendVisible(false)}
      />
    </View>
  );
}

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

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1 },
  headerBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  loadingBody: { padding: Spacing[4], gap: Spacing[3] },

  identityBlock: { alignItems: 'center', paddingHorizontal: Spacing[5], paddingVertical: 20, paddingTop: 8 },
  avatar76: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  avatar76Text: { fontSize: 27, fontFamily: 'Inter-Bold' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  name: { fontSize: 20, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  roleBadgeAdmin: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 11 },
  roleBadgeAdminText: { fontSize: 10, fontFamily: 'Inter-Bold', color: '#FFFFFF', letterSpacing: 0.2 },
  roleBadgeEmp: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 11 },
  roleBadgeEmpText: { fontSize: 10, fontFamily: 'Inter-Bold', letterSpacing: 0.2 },
  designation: { fontSize: 13, fontFamily: 'Inter-Regular', marginTop: 4 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 11.5, fontFamily: 'Inter-SemiBold' },

  kpiStrip: { flexDirection: 'row', gap: 1, marginTop: 8 },

  taskLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: Spacing[4],
    borderRadius: 12,
    padding: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  pressed: { opacity: 0.85 },
  taskLinkIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  taskLinkInfo: { flex: 1, minWidth: 0 },
  taskLinkTitle: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  taskLinkSub: { fontSize: 11.5, fontFamily: 'Inter-Regular', marginTop: 1 },
  overdueBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 11, flexShrink: 0 },
  overdueBadgeText: { fontSize: 11, fontFamily: 'Inter-Bold', color: '#B91C1C' },
  onTrackBadgeText: { fontSize: 11, fontFamily: 'Inter-Bold', color: '#15803D' },

  card: { borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  cardDivider: { height: 1 },

  overflowMenu: {
    position: 'absolute',
    borderRadius: 14,
    minWidth: 220,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 12,
  },
});
