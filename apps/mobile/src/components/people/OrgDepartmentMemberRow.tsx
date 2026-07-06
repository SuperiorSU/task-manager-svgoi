/**
 * OrgDepartmentMemberRow — Department members roster row (screen 56b).
 * Avatar · name (+ HEAD badge on the head) · role · staff ID · status dot.
 * Mirrors OrgUserCard's shape but scoped to one department (no dept label).
 */

import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';

import type { OrgDepartmentMember } from '../../hooks/useOrgDirectory';
import { useColors } from '../../constants/colors';

type Props = {
  member: OrgDepartmentMember;
  onPress?: (member: OrgDepartmentMember) => void;
};

export const OrgDepartmentMemberRow = React.memo(({ member, onPress }: Props) => {
  const colors = useColors();
  const isActive = member.status === 'ACTIVE';
  const roleLabel = member.role === 'ADMIN' ? 'Administrator' : 'Employee';

  return (
    <Pressable
      onPress={onPress ? () => onPress(member) : undefined}
      disabled={!onPress}
      style={({ pressed }) => [
        s.card,
        { backgroundColor: colors.surface.card },
        !isActive && s.suspended,
        pressed && onPress && { opacity: 0.85 },
      ]}
    >
      <View style={[s.avatar, { backgroundColor: member.avatarBg }]}>
        <Text style={[s.avatarText, { color: member.avatarText }]}>{member.initials}</Text>
      </View>

      <View style={s.info}>
        <View style={s.nameRow}>
          <Text style={[s.name, { color: isActive ? colors.text.primary : colors.text.secondary }]} numberOfLines={1}>
            {member.name}
          </Text>
          {member.isHead && (
            <View style={[s.headBadge, { backgroundColor: colors.brand.primaryLight }]}>
              <Text style={[s.headBadgeText, { color: colors.brand.primary }]}>HEAD</Text>
            </View>
          )}
        </View>
        <View style={s.metaRow}>
          <Text style={[s.metaText, { color: colors.text.secondary }]}>{roleLabel}</Text>
          <Text style={[s.metaSep, { color: colors.surface.borderStrong }]}>·</Text>
          <Text style={[s.metaMono, { color: colors.text.tertiary }]}>{member.staffId}</Text>
        </View>
      </View>

      <View style={s.statusWrap}>
        <View style={[s.statusDot, { backgroundColor: isActive ? '#10B981' : colors.text.tertiary }]} />
        <Text style={[s.statusText, { color: isActive ? '#15803D' : colors.text.secondary }]}>
          {isActive ? 'Active' : 'Suspended'}
        </Text>
      </View>
    </Pressable>
  );
});

OrgDepartmentMemberRow.displayName = 'OrgDepartmentMemberRow';

const s = StyleSheet.create({
  card: {
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  suspended: { opacity: 0.72 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 13, fontFamily: 'Inter-Bold', letterSpacing: 0 },
  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { fontSize: 14, fontFamily: 'Inter-SemiBold', letterSpacing: 0, flexShrink: 1 },
  headBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, flexShrink: 0 },
  headBadgeText: { fontSize: 9, fontFamily: 'Inter-Bold', letterSpacing: 0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  metaText: { fontSize: 11.5, fontFamily: 'Inter-Regular' },
  metaSep: { fontSize: 11 },
  metaMono: { fontSize: 11, fontFamily: 'Inter-Regular' },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 11, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
});
