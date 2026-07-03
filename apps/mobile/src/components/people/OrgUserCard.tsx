/**
 * OrgUserCard — People → Users view row (screen 55).
 * Avatar (two-tone) · name + role badge · dept · staff ID · status dot.
 */

import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';

import type { OrgUser } from '../../hooks/useOrgDirectory';
import { useColors } from '../../constants/colors';

const ROLE_BADGE: Record<OrgUser['role'], { bg: string; text: string; label: string }> = {
  ADMIN: { bg: '#EEF2FF', text: '#0D2270', label: 'ADMIN' },
  EMPLOYEE: { bg: '#F1F5F9', text: '#475569', label: 'EMPLOYEE' },
};

type Props = {
  user: OrgUser;
  onPress?: (user: OrgUser) => void;
};

export const OrgUserCard = React.memo(({ user, onPress }: Props) => {
  const colors = useColors();
  const badge = ROLE_BADGE[user.role];
  const isActive = user.status === 'ACTIVE';
  const deptLabel = user.departments.map((d) => d.name).join(', ') || '—';

  return (
    <Pressable
      onPress={onPress ? () => onPress(user) : undefined}
      disabled={!onPress}
      style={({ pressed }) => [
        s.card,
        { backgroundColor: colors.surface.card },
        !isActive && s.suspended,
        pressed && onPress && { opacity: 0.85 },
      ]}
    >
      <View style={[s.avatar, { backgroundColor: user.avatarBg }]}>
        <Text style={[s.avatarText, { color: user.avatarText }]}>{user.initials}</Text>
      </View>

      <View style={s.info}>
        <View style={s.nameRow}>
          <Text style={[s.name, { color: isActive ? colors.text.primary : colors.text.secondary }]} numberOfLines={1}>
            {user.name}
          </Text>
          <View style={[s.badge, { backgroundColor: badge.bg }]}>
            <Text style={[s.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>
        <View style={s.metaRow}>
          <Text style={[s.metaText, { color: colors.text.secondary }]} numberOfLines={1}>
            {deptLabel}
          </Text>
          <Text style={[s.metaSep, { color: colors.surface.borderStrong }]}>·</Text>
          <Text style={[s.metaMono, { color: colors.text.tertiary }]}>{user.staffId}</Text>
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

OrgUserCard.displayName = 'OrgUserCard';

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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 13, fontFamily: 'Inter-Bold', letterSpacing: 0 },
  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { fontSize: 14, fontFamily: 'Inter-SemiBold', letterSpacing: 0, flexShrink: 1 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, flexShrink: 0 },
  badgeText: { fontSize: 9, fontFamily: 'Inter-Bold', letterSpacing: 0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  metaText: { fontSize: 11.5, fontFamily: 'Inter-Regular', flexShrink: 1 },
  metaSep: { fontSize: 11 },
  metaMono: { fontSize: 11, fontFamily: 'Inter-Regular' },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 11, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
});
