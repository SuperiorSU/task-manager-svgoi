import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useColors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { useSuperAdminProfileData } from '../hooks/useProfile';
import { useLogout } from '../hooks/useAuth';

import { LogoutModal } from '../components/profile/LogoutModal';
import { SuperAdminProfileCompactHeader } from '../components/profile/SuperAdminProfileCompactHeader';
import { ProfileAccountSection } from '../components/profile/ProfileAccountSection';
import { ProfileSettingsSection } from '../components/profile/ProfileSettingsSection';
import { ProfileAboutSection } from '../components/profile/ProfileAboutSection';
import { ProfileLogoutCard } from '../components/profile/ProfileLogoutCard';
import { ProfileSkeleton } from '../components/profile/ProfileSkeleton';

// Screen 72 — Super Admin Profile Part 2 (account · settings · about · log
// out). Reached by tapping the "Scroll for account, settings & log out"
// row at the bottom of Part 1. Pushed as its own stack screen with a back
// header — unlike the HTML mockup (no back button, tab bar still visible),
// every other Profile sub-screen in this app (edit, change-password,
// department-settings, ...) is a headered stack push with no tab bar, so
// this follows that established navigation architecture instead of the
// literal static mockup.
export function SuperAdminProfileAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const { data: profile, isLoading } = useSuperAdminProfileData();
  const { mutate: logout, isPending: logoutPending } = useLogout();

  const [logoutVisible, setLogoutVisible] = useState(false);

  return (
    <View style={[s.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      <SuperAdminProfileCompactHeader
        onBackPress={() => router.back()}
        profile={{
          name: profile?.name,
          designation: profile?.designation,
          orgName: profile?.department,
        }}
      />

      {isLoading ? (
        <ProfileSkeleton />
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <ProfileAccountSection profile={profile} idLabel="Super Admin ID · read-only" />

          <ProfileSettingsSection />

          <ProfileAboutSection />

          <ProfileLogoutCard onPress={() => setLogoutVisible(true)} />

          <Text style={[s.version, { color: colors.text.tertiary }]}>TaskFlow SVGOI · Super Admin · v1.0</Text>

          <View style={{ height: Spacing[8] }} />
        </ScrollView>
      )}

      <LogoutModal
        visible={logoutVisible}
        isPending={logoutPending}
        onConfirm={() => {
          setLogoutVisible(false);
          logout();
        }}
        onCancel={() => setLogoutVisible(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  version: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 8,
  },
});
