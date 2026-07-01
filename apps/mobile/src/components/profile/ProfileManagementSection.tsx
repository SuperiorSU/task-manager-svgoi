import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { useColors } from '../../constants/colors';
import { useTeamCount } from '../../hooks/useAdminSettings';
import { ProfileSettingsItem } from './ProfileSettingsItem';

// Admin-only "Management" section reached from Profile — screens 46/47 of the
// HTML reference. "Manage team members" opens the existing Team tab; the other
// two rows push the new Approval preferences / Department settings screens.
export const ProfileManagementSection = () => {
  const colors = useColors();
  const router = useRouter();
  const { data: teamCount } = useTeamCount();

  return (
    <>
      <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Management</Text>
      <View style={[s.card, { backgroundColor: colors.surface.card }]}>
        <ProfileSettingsItem
          icon="users"
          iconColor={colors.brand.primary}
          label="Manage team members"
          valueLabel={teamCount !== undefined ? String(teamCount) : undefined}
          onPress={() => router.push('/(app)/(admin)/team' as Parameters<typeof router.push>[0])}
          showDivider
        />
        <ProfileSettingsItem
          icon="check-square"
          iconColor={colors.status.underReview.text}
          label="Approval preferences"
          onPress={() => router.push('/(app)/profile/approval-preferences' as Parameters<typeof router.push>[0])}
          showDivider
        />
        <ProfileSettingsItem
          icon="home"
          iconColor={colors.priority.low.text}
          label="Department settings"
          onPress={() => router.push('/(app)/profile/department-settings' as Parameters<typeof router.push>[0])}
        />
      </View>
    </>
  );
};

const s = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 9,
    marginLeft: 2,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
});
