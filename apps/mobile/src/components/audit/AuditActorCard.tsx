import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useColors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { avatarPalette } from '../../utils/avatarPalette';
import { initialsFor } from '../../utils/auditPresentation';

export type AuditActorCardActor = { id: string; name: string; role: string; employeeId?: string | null };

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  SYSTEM: 'Automated system',
  EMPLOYEE: 'Employee',
};

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: 'SA',
  ADMIN: 'ADMIN',
  SYSTEM: 'SYSTEM',
  EMPLOYEE: 'EMPLOYEE',
};

export const AuditActorCard = React.memo(({ actor }: { actor: AuditActorCardActor }) => {
  const colors = useColors();
  const isSelf = actor.role === 'SUPER_ADMIN';
  const initials = initialsFor(actor.name);
  const pal = avatarPalette(initials);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface.card, borderColor: colors.surface.border }]}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: isSelf ? colors.brand.secondary : pal.bg },
        ]}
      >
        <Text style={[styles.avatarText, { color: isSelf ? '#FFFFFF' : pal.fg }]}>{initials}</Text>
      </View>
      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.text.primary }]} numberOfLines={1}>
          {actor.name}
        </Text>
        <Text style={[styles.meta, { color: colors.text.tertiary }]} numberOfLines={1}>
          {ROLE_LABEL[actor.role] ?? actor.role}
          {actor.employeeId ? ` · ${actor.employeeId}` : ''}
        </Text>
      </View>
      <View style={[styles.roleBadge, { backgroundColor: colors.brand.primaryLight }]}>
        <Text style={[styles.roleBadgeText, { color: colors.brand.secondary }]}>
          {ROLE_BADGE[actor.role] ?? actor.role}
        </Text>
      </View>
    </View>
  );
});

AuditActorCard.displayName = 'AuditActorCard';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing[4] - 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 13, fontFamily: 'Inter-Bold', letterSpacing: 0 },
  body: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  meta: { fontSize: 11.5, fontFamily: 'Inter-Regular', letterSpacing: 0, marginTop: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  roleBadgeText: { fontSize: 9, fontFamily: 'Inter-Bold', letterSpacing: 0.4 },
});
