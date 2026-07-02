/**
 * TeamMemberCard — matches HTML reference §4.11 (screen 33).
 *
 * Layout:
 *   [Avatar 44pt]  [Name + role badge]     [Status dot + label →]
 *                  [Designation · EmpID]
 *
 * Active:    green dot · "Active"
 * Suspended: amber dot · "Suspended" · card opacity 0.72
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TeamMemberView } from '../../utils/teamMemberView';
import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';

// ─── Role badge config ─────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  EMPLOYEE: { bg: '#F1F5F9', text: '#475569', label: 'EMPLOYEE' },
  ADMIN:    { bg: '#EFF6FF', text: '#1D4ED8', label: 'ADMIN' },
};

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  member: TeamMemberView;
  onPress: (member: TeamMemberView) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const TeamMemberCard = React.memo(({ member, onPress }: Props) => {
  const colors = useColors();
  const badge = ROLE_BADGE[member.role] ?? ROLE_BADGE['EMPLOYEE']!;

  const handlePress = useCallback(() => onPress(member), [member, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        s.card,
        { backgroundColor: colors.surface.card },
        !member.isActive && s.suspended,
        pressed && s.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${member.name}, ${member.designation}`}
    >
      {/* Avatar */}
      <View style={[s.avatar, { backgroundColor: member.avatarColor }]}>
        <Text style={s.avatarText}>{member.initials}</Text>
      </View>

      {/* Info */}
      <View style={s.info}>
        {/* Name row */}
        <View style={s.nameRow}>
          <Text style={[s.name, { color: colors.text.primary }]} numberOfLines={1}>
            {member.name}
          </Text>
          <View style={[s.roleBadge, { backgroundColor: badge.bg }]}>
            <Text style={[s.roleBadgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Designation · EmployeeID */}
        <View style={s.metaRow}>
          <Text style={[s.designation, { color: colors.text.tertiary }]} numberOfLines={1}>
            {member.designation}
          </Text>
          <Text style={[s.separator, { color: colors.surface.borderStrong }]}>·</Text>
          <Text style={[s.empId, { color: colors.text.tertiary }]} numberOfLines={1}>
            {member.employeeId}
          </Text>
        </View>
      </View>

      {/* Status indicator */}
      <View style={s.statusWrap}>
        <View
          style={[
            s.statusDot,
            { backgroundColor: member.isActive ? '#16A34A' : '#B45309' },
          ]}
        />
        <Text
          style={[
            s.statusLabel,
            { color: member.isActive ? '#15803D' : '#B45309' },
          ]}
        >
          {member.isActive ? 'Active' : 'Suspended'}
        </Text>
      </View>
    </Pressable>
  );
});

TeamMemberCard.displayName = 'TeamMemberCard';

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  suspended: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
    flexShrink: 1,
  },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    flexShrink: 0,
  },
  roleBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  designation: {
    fontSize: 11.5,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
    flexShrink: 1,
  },
  separator: {
    fontSize: 11,
    flexShrink: 0,
  },
  empId: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
    flexShrink: 0,
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
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
});
