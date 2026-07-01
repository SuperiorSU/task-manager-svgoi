import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { getInitials } from '../../utils/initial';
import { ProfileStatsBar } from './ProfileStatsBar';

interface ProfileHeaderCardProps {
  profile?: {
    name?: string;
    designation?: string;
    department?: string;
    role?: string;
  } | undefined;
  stats?: React.ComponentProps<typeof ProfileStatsBar>['stats'] | undefined;
  onEditPress: () => void;
}

export const ProfileHeaderCard = ({ profile, stats, onEditPress }: ProfileHeaderCardProps) => {
  const colors = useColors();
  return (
    <View style={[styles.profileCard, { backgroundColor: colors.surface.card }]}>
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundColor: colors.brand.secondary }]}>
          <Text style={styles.initials}>{getInitials(profile?.name ?? '')}</Text>
        </View>
        <Pressable
          onPress={onEditPress}
          style={[styles.avatarEditBadge, { backgroundColor: colors.brand.primary, borderColor: colors.surface.card }]}
          accessibilityLabel="Change photo"
        >
          <Feather name="camera" size={11} color="#fff" />
        </Pressable>
      </View>

      <Text style={[styles.name, { color: colors.text.primary }]}>{profile?.name}</Text>
      <Text style={[styles.designation, { color: colors.text.secondary }]}>
        {profile?.designation} · {profile?.department}
      </Text>

      <View style={[styles.roleBadge, { backgroundColor: colors.brand.primaryLight, borderColor: '#DBEAFE' }]}>
        <View style={[styles.roleDot, { backgroundColor: colors.brand.primary }]} />
        <Text style={[styles.roleLabel, { color: colors.brand.primaryDark }]}>{profile?.role}</Text>
      </View>

      {stats && <ProfileStatsBar stats={stats} />}
    </View>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 24,
    marginBottom: 20,
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
  avatarEditBadge: {
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
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 10,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  roleLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
});