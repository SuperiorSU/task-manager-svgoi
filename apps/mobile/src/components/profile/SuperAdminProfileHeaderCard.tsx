import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { getInitials } from '../../utils/initial';

interface SuperAdminProfileHeaderCardProps {
  profile?: {
    name?: string | undefined;
    designation?: string | undefined;
    orgName?: string | undefined;
  } | undefined;
}

// Screen 71 of the HTML reference — distinct from ProfileHeaderCard (Admin/
// Employee): navy avatar with a shield-check badge (identity marker, not an
// edit affordance — editing is reached via the header bar's pencil button)
// and a solid navy role pill instead of the light brand.primaryLight pill.
// This is the Super Admin's signature navy identity, matching
// SuperAdminHeader on the SA Dashboard.
export const SuperAdminProfileHeaderCard = ({ profile }: SuperAdminProfileHeaderCardProps) => {
  const colors = useColors();
  return (
    <View style={[styles.profileCard, { backgroundColor: colors.surface.card }]}>
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundColor: colors.brand.secondary }]}>
          <Text style={styles.initials}>{getInitials(profile?.name ?? '')}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.brand.secondary, borderColor: colors.surface.card }]}>
          <Feather name="shield" size={12} color="#fff" />
        </View>
      </View>

      <Text style={[styles.name, { color: colors.text.primary }]}>{profile?.name}</Text>
      <Text style={[styles.designation, { color: colors.text.secondary }]}>
        {profile?.designation} · {profile?.orgName}
      </Text>

      <View style={[styles.roleBadge, { backgroundColor: colors.brand.secondary }]}>
        <Feather name="shield" size={11} color="#fff" />
        <Text style={styles.roleLabel}>Super Admin</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    letterSpacing: 1,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  designation: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 13,
    paddingHorizontal: 11,
    paddingVertical: 4,
    marginTop: 10,
  },
  roleLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
});
