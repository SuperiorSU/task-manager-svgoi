/**
 * Member Detail screen (screen 34, §4.13).
 *
 * Layout:
 *  - Back ← + "Team member" title + ⋮ overflow menu
 *  - Profile block: 80pt avatar · name · role + status · dept · EmpID
 *  - Contact: email · phone
 *  - Task summary 30 days: Assigned / Completed / Overdue + on-time rate
 *  - Recent tasks: compact cards with priority stripe + status chip
 *  - Manage: Edit profile · Reset password · Suspend / Reactivate
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';

import type { RichTask } from '@godigitify/types';
import {
  useUser,
  useUserTaskStats,
  useUserRecentTasks,
  useDeactivateUser,
  useReactivateUser,
  useResetUserPassword,
} from '../../../src/hooks/usePeople';
import { useAuthStore } from '../../../src/stores/auth.store';
import { toTeamMemberView, type TeamMemberView } from '../../../src/utils/teamMemberView';
import { useColors } from '../../../src/constants/colors';
import { Spacing } from '../../../src/constants/spacing';
import { SuspendConfirmModal } from '../../../src/components/team/SuspendConfirmModal';
import { ResetPasswordSheet } from '../../../src/components/team/ResetPasswordSheet';

// ─── Priority stripe colours ──────────────────────────────────────────────────

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: '#7C3AED',
  HIGH: '#EF4444',
  MEDIUM: '#F59E0B',
  LOW: '#22C55E',
};

// ─── Status chip ──────────────────────────────────────────────────────────────

function getStatusChip(status: string): { bg: string; text: string; label: string } {
  switch (status) {
    case 'UNDER_REVIEW': return { bg: '#F5F3FF', text: '#6D28D9', label: 'REVIEW' };
    case 'IN_PROGRESS':  return { bg: '#FFFBEB', text: '#B45309', label: 'ACTIVE' };
    case 'PENDING':      return { bg: '#F1F5F9', text: '#475569', label: 'PENDING' };
    case 'ACCEPTED':     return { bg: '#EFF6FF', text: '#1D4ED8', label: 'ACCEPTED' };
    case 'COMPLETED':    return { bg: '#F0FDF4', text: '#15803D', label: 'DONE' };
    case 'CANCELLED':    return { bg: '#F8FAFC', text: '#94A3B8', label: 'CANCELLED' };
    default:             return { bg: '#F1F5F9', text: '#475569', label: status };
  }
}

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  EMPLOYEE: { bg: '#F1F5F9', text: '#475569' },
  ADMIN:    { bg: '#EFF6FF', text: '#1D4ED8' },
};

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  const colors = useColors();
  return (
    <Text style={[sl.text, { color: colors.text.tertiary }]}>{children}</Text>
  );
}
const sl = StyleSheet.create({
  text: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing[5],
    paddingTop: 18,
    paddingBottom: 4,
  },
});

// ─── Overflow menu ────────────────────────────────────────────────────────────

type OverflowMenuProps = {
  visible: boolean;
  member: TeamMemberView;
  onEdit: () => void;
  onResetPwd: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
  onDismiss: () => void;
};

function OverflowMenu({ visible, member, onEdit, onResetPwd, onSuspend, onReactivate, onDismiss }: OverflowMenuProps) {
  const colors = useColors();
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onDismiss} statusBarTranslucent>
      <Pressable style={om.scrim} onPress={onDismiss} />
      <View style={[om.menu, { backgroundColor: colors.surface.card, top: 110, right: 16 }]}>
        <MenuItem icon="edit-2" label="Edit profile" onPress={onEdit} colors={colors} />
        <View style={[om.divider, { backgroundColor: colors.surface.border }]} />
        <MenuItem icon="lock" label="Reset password" onPress={onResetPwd} colors={colors} accent={colors.brand.primary} />
        <View style={[om.divider, { backgroundColor: colors.surface.border }]} />
        {member.isActive ? (
          <MenuItem icon="user-x" label="Suspend account" onPress={onSuspend} colors={colors} danger />
        ) : (
          <MenuItem icon="user-check" label="Reactivate account" onPress={onReactivate} colors={colors} accent="#16A34A" />
        )}
      </View>
    </Modal>
  );
}

function MenuItem({
  icon, label, onPress, colors, danger, accent,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  danger?: boolean;
  accent?: string;
}) {
  const color = danger ? colors.semantic.error : accent ?? colors.text.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [om.item, pressed && { backgroundColor: colors.surface.background }]}
    >
      <Feather name={icon} size={17} color={color} />
      <Text style={[om.itemText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const om = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject },
  menu: {
    position: 'absolute',
    borderRadius: 14,
    paddingVertical: 4,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  itemText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0,
  },
  divider: { height: 1, marginHorizontal: 12 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MemberDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useAuthStore((s) => s.user);

  const [overflowVisible, setOverflowVisible] = useState(false);
  const [suspendVisible, setSuspendVisible] = useState(false);
  const [resetVisible, setResetVisible] = useState(false);

  const { data: user, isLoading } = useUser(id ?? '');
  const { data: taskStats } = useUserTaskStats(id ?? '');
  const { data: recentTasks = [] } = useUserRecentTasks(id ?? '');

  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();
  const resetPassword = useResetUserPassword();

  const member: TeamMemberView | null = user
    ? toTeamMemberView(user, taskStats)
    : null;

  // Admin viewing a user outside their own department: read-only (§4.13)
  const isReadOnly =
    currentUser?.role === 'ADMIN' &&
    member?.department?.id !== undefined &&
    member.department.id !== currentUser.departmentId;

  const handleSuspendConfirm = useCallback(async (m: TeamMemberView) => {
    await deactivateUser.mutateAsync(m.id);
    setSuspendVisible(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [deactivateUser]);

  const handleReactivate = useCallback(async () => {
    if (!member) return;
    await reactivateUser.mutateAsync(member.id);
    setOverflowVisible(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [member, reactivateUser]);

  const handleResetConfirm = useCallback(async (m: TeamMemberView) => {
    await resetPassword.mutateAsync(m.id);
    setResetVisible(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [resetPassword]);

  if (isLoading) {
    return (
      <View style={[s.loadWrap, { backgroundColor: colors.surface.background, paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.brand.primary} size="large" />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={[s.loadWrap, { backgroundColor: colors.surface.background, paddingTop: insets.top }]}>
        <Text style={[{ color: colors.text.secondary, fontFamily: 'Inter-Regular', fontSize: 14 }]}>
          Member not found
        </Text>
      </View>
    );
  }

  const roleBadge = ROLE_BADGE[member.role] ?? ROLE_BADGE['EMPLOYEE']!;
  const statusColor = member.isActive ? '#16A34A' : '#B45309';
  const statusLabel = member.isActive ? 'Active' : 'Suspended';

  return (
    <View style={[s.screen, { backgroundColor: colors.surface.background }]}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View
        style={[
          s.header,
          {
            paddingTop: insets.top + 6,
            backgroundColor: colors.surface.card,
            borderBottomColor: colors.surface.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={s.headerBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>

        <Text style={[s.headerTitle, { color: colors.text.primary }]}>Team member</Text>

        {isReadOnly ? (
          <View style={s.headerBtn} />
        ) : (
          <Pressable
            onPress={() => setOverflowVisible(true)}
            style={s.headerBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="More actions"
          >
            <Feather name="more-vertical" size={20} color={colors.text.tertiary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* ── Profile block ────────────────────────────────────────────── */}
        <View
          style={[
            s.profileBlock,
            {
              backgroundColor: colors.surface.card,
              borderBottomColor: '#EEF2F7',
            },
          ]}
        >
          {/* Avatar */}
          <View style={[s.avatar80, { backgroundColor: member.avatarColor }]}>
            <Text style={s.avatar80Text}>{member.initials}</Text>
          </View>

          {/* Info */}
          <View style={s.profileInfo}>
            <Text style={[s.memberName, { color: colors.text.primary }]}>{member.name}</Text>

            {/* Role + status row */}
            <View style={s.roleRow}>
              <View style={[s.roleBadge, { backgroundColor: roleBadge.bg }]}>
                <Text style={[s.roleBadgeText, { color: roleBadge.text }]}>{member.role}</Text>
              </View>
              <View style={s.statusRow}>
                <View style={[s.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[s.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>

            {/* Dept · EmpID */}
            <View style={s.metaRow}>
              <Text style={[s.metaDept, { color: colors.text.tertiary }]}>{member.department?.name ?? '—'}</Text>
              <Text style={[s.metaSep, { color: colors.surface.borderStrong }]}>·</Text>
              <Text style={[s.metaEmpId, { color: colors.text.tertiary }]}>{member.employeeId}</Text>
            </View>
          </View>
        </View>

        {/* ── Contact ──────────────────────────────────────────────────── */}
        <SectionLabel>Contact</SectionLabel>
        <View style={[s.card, { backgroundColor: colors.surface.card, marginHorizontal: Spacing[4] }]}>
          <ContactRow icon="mail" value={member.email} colors={colors} />
          {member.phone && (
            <>
              <View style={[s.cardDivider, { backgroundColor: '#F4F6FA' }]} />
              <ContactRow icon="phone" value={member.phone} colors={colors} />
            </>
          )}
        </View>

        {/* ── Task summary ─────────────────────────────────────────────── */}
        <View style={s.taskSummaryHeader}>
          <Text style={[s.sectionLabelInline, { color: colors.text.tertiary }]}>
            Task summary · 30 days
          </Text>
          {member.taskStats.onTimeRate > 0 && (
            <Text style={s.onTimeRate}>{member.taskStats.onTimeRate}% on-time</Text>
          )}
        </View>
        <View
          style={[
            s.statsCard,
            { backgroundColor: colors.surface.card, marginHorizontal: Spacing[4] },
          ]}
        >
          <StatItem label="Assigned" value={member.taskStats.assigned} colors={colors} />
          <View style={[s.statDivider, { backgroundColor: '#EEF2F7' }]} />
          <StatItem label="Completed" value={member.taskStats.completed} colors={colors} accent="#16A34A" />
          <View style={[s.statDivider, { backgroundColor: '#EEF2F7' }]} />
          <StatItem
            label="Overdue"
            value={member.taskStats.overdue}
            colors={colors}
            {...(member.taskStats.overdue > 0 ? { accent: '#DC2626' } : {})}
          />
        </View>

        {/* ── Recent tasks ─────────────────────────────────────────────── */}
        {recentTasks.length > 0 && (
          <>
            <SectionLabel>Recent tasks</SectionLabel>
            <View
              style={[
                s.card,
                { backgroundColor: colors.surface.card, marginHorizontal: Spacing[4] },
              ]}
            >
              {recentTasks.map((task, idx) => (
                <React.Fragment key={task.id}>
                  {idx > 0 && (
                    <View style={[s.cardDivider, { backgroundColor: '#F4F6FA' }]} />
                  )}
                  <RecentTaskRow task={task} colors={colors} />
                </React.Fragment>
              ))}
            </View>
          </>
        )}

        {/* ── Manage ───────────────────────────────────────────────────── */}
        {!isReadOnly && (
          <>
            <SectionLabel>Manage</SectionLabel>
            <View
              style={[
                s.card,
                { backgroundColor: colors.surface.card, marginHorizontal: Spacing[4] },
              ]}
            >
              <ManageRow
                icon="edit-2"
                label="Edit profile"
                onPress={() => {
                  setOverflowVisible(false);
                  router.push(`/(app)/people/${member.id}/edit` as Parameters<typeof router.push>[0]);
                }}
                colors={colors}
              />
              <View style={[s.cardDivider, { backgroundColor: '#F4F6FA' }]} />
              <ManageRow
                icon="lock"
                label="Reset password"
                accent={colors.brand.primary}
                onPress={() => {
                  setOverflowVisible(false);
                  setResetVisible(true);
                }}
                colors={colors}
              />
              <View style={[s.cardDivider, { backgroundColor: '#F4F6FA' }]} />
              {member.isActive ? (
                <ManageRow
                  icon="user-x"
                  label="Suspend account"
                  danger
                  onPress={() => {
                    setOverflowVisible(false);
                    setSuspendVisible(true);
                  }}
                  colors={colors}
                />
              ) : (
                <ManageRow
                  icon="user-check"
                  label="Reactivate account"
                  accent="#16A34A"
                  onPress={handleReactivate}
                  colors={colors}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Overflow menu ────────────────────────────────────────────────── */}
      <OverflowMenu
        visible={overflowVisible}
        member={member}
        onEdit={() => {
          setOverflowVisible(false);
          router.push(`/(app)/people/${member.id}/edit` as Parameters<typeof router.push>[0]);
        }}
        onResetPwd={() => {
          setOverflowVisible(false);
          setResetVisible(true);
        }}
        onSuspend={() => {
          setOverflowVisible(false);
          setSuspendVisible(true);
        }}
        onReactivate={handleReactivate}
        onDismiss={() => setOverflowVisible(false)}
      />

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <SuspendConfirmModal
        member={member}
        visible={suspendVisible}
        onConfirm={handleSuspendConfirm}
        onDismiss={() => setSuspendVisible(false)}
      />

      <ResetPasswordSheet
        member={member}
        visible={resetVisible}
        onConfirm={handleResetConfirm}
        onDismiss={() => setResetVisible(false)}
      />
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ContactRow({
  icon,
  value,
  colors,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={cr.row}>
      <Feather name={icon} size={17} color={colors.text.tertiary} />
      <Text style={[cr.value, { color: colors.text.secondary }]}>{value}</Text>
    </View>
  );
}

const cr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, paddingHorizontal: 15 },
  value: { fontSize: 13, fontFamily: 'Inter-Regular', letterSpacing: 0, flex: 1 },
});

function StatItem({
  label,
  value,
  colors,
  accent,
}: {
  label: string;
  value: number;
  colors: ReturnType<typeof useColors>;
  accent?: string;
}) {
  return (
    <View style={si.wrap}>
      <Text style={[si.value, { color: accent ?? colors.text.primary }]}>{value}</Text>
      <Text style={[si.label, { color: colors.text.tertiary }]}>{label}</Text>
    </View>
  );
}

const si = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center' },
  value: { fontSize: 21, fontFamily: 'Inter-Bold', letterSpacing: 0 },
  label: { fontSize: 11, fontFamily: 'Inter-Regular', marginTop: 2 },
});

function RecentTaskRow({
  task,
  colors,
}: {
  task: Pick<RichTask, 'id' | 'title' | 'priority' | 'status' | 'dueDate'>;
  colors: ReturnType<typeof useColors>;
}) {
  const stripe = PRIORITY_COLOR[task.priority] ?? '#94A3B8';
  const chip = getStatusChip(task.status);
  const due = dayjs(task.dueDate);
  const isToday = due.isSame(dayjs(), 'day');
  const dueLabel = isToday
    ? `Due today, ${due.format('h:mm A')}`
    : `Due ${due.format('MMM D')}`;

  return (
    <View style={rt.row}>
      <View style={[rt.stripe, { backgroundColor: stripe }]} />
      <View style={rt.info}>
        <Text style={[rt.title, { color: colors.text.primary }]} numberOfLines={1}>
          {task.title}
        </Text>
        <Text style={[rt.due, { color: colors.text.tertiary }]}>{dueLabel}</Text>
      </View>
      <View style={[rt.chip, { backgroundColor: chip.bg }]}>
        <Text style={[rt.chipText, { color: chip.text }]}>{chip.label}</Text>
      </View>
    </View>
  );
}

const rt = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    paddingHorizontal: 15,
  },
  stripe: { width: 4, height: 38, borderRadius: 3, flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  title: { fontSize: 13.5, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  due: { fontSize: 11, fontFamily: 'Inter-Regular', marginTop: 2 },
  chip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexShrink: 0 },
  chipText: { fontSize: 10, fontFamily: 'Inter-Bold', letterSpacing: 0.3 },
});

function ManageRow({
  icon,
  label,
  onPress,
  colors,
  danger,
  accent,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  danger?: boolean;
  accent?: string;
}) {
  const color = danger ? colors.semantic.error : accent ?? colors.text.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        mr.row,
        pressed && { backgroundColor: colors.surface.background },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Feather name={icon} size={18} color={color} />
      <Text style={[mr.label, { color, flex: 1 }]}>{label}</Text>
      <Feather name="chevron-right" size={18} color={colors.surface.borderStrong} />
    </Pressable>
  );
}

const mr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingHorizontal: 15 },
  label: { fontSize: 14, fontFamily: 'Inter-Medium', letterSpacing: 0 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1 },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[5],
    paddingTop: 8,
    borderBottomWidth: 1,
  },
  avatar80: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatar80Text: {
    fontSize: 27,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  profileInfo: { flex: 1, minWidth: 0 },
  memberName: {
    fontSize: 19,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  roleBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 8,
  },
  metaDept: { fontSize: 11.5, fontFamily: 'Inter-Regular' },
  metaSep: { fontSize: 11 },
  metaEmpId: { fontSize: 11, fontFamily: 'Inter-Regular' },
  card: {
    borderRadius: 13,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardDivider: { height: 1 },
  taskSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingTop: 18,
    paddingBottom: 4,
  },
  sectionLabelInline: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  onTimeRate: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    color: '#15803D',
  },
  statsCard: {
    borderRadius: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  statDivider: { width: 1 },
});
