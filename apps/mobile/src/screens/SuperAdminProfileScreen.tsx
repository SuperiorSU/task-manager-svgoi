import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useColors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { useSuperAdminProfileData } from '../hooks/useProfile';
import { useSystemHealth } from '../hooks/useSuperAdminDashboard';
import { useLogout } from '../hooks/useAuth';

import { ProfileHeaderBar } from '../components/profile/ProfileHeaderBar';
import { SuperAdminProfileHeaderCard } from '../components/profile/SuperAdminProfileHeaderCard';
import { OrgScopeStatsBar } from '../components/profile/OrgScopeStatsBar';
import { ScopeAuthorityCard } from '../components/profile/ScopeAuthorityCard';
import { SystemSecuritySection } from '../components/profile/SystemSecuritySection';
import { ProfileAccountSection } from '../components/profile/ProfileAccountSection';
import { ProfileSettingsSection } from '../components/profile/ProfileSettingsSection';
import { ProfileAboutSection } from '../components/profile/ProfileAboutSection';
import { ProfileLogoutCard } from '../components/profile/ProfileLogoutCard';
import { ProfileSkeleton } from '../components/profile/ProfileSkeleton';
import { LogoutModal } from '../components/profile/LogoutModal';

// Screen 71/72 — Super Admin Profile, single scroll (identity · org scope ·
// system · account · settings · about · log out). Previously split across
// two screens/routes (Part 1 tab screen + Part 2 pushed stack screen) to
// match an HTML mock's overflow rule; merged into one screen since every
// other role's Profile is a single scroll and the split served no
// navigational purpose — Part 2 had no entry point other than a "continue"
// row at the bottom of Part 1.
export function SuperAdminProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const { data: profile, isLoading: profileLoading } = useSuperAdminProfileData();
  const { data: health, isLoading: healthLoading } = useSystemHealth();
  const { mutate: logout, isPending: logoutPending } = useLogout();

  const [logoutVisible, setLogoutVisible] = useState(false);

  const isLoading = profileLoading || healthLoading;
  const handleEditPress = () => router.push('/(app)/profile/edit');

  return (
    <View style={[s.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      <ProfileHeaderBar onEditPress={handleEditPress} />

      {isLoading ? (
        <ProfileSkeleton />
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <SuperAdminProfileHeaderCard
            profile={{
              name: profile?.name,
              designation: profile?.designation,
              orgName: profile?.department,
            }}
          />

          <OrgScopeStatsBar
            departments={health?.departments ?? 0}
            admins={health?.admins ?? 0}
            users={health?.activeUsers ?? 0}
          />

          <ScopeAuthorityCard />

          <SystemSecuritySection
            onAuditLogPress={() => router.push('/(app)/audit')}
            onOrgConfigPress={() => router.push('/(app)/profile/org-configuration')}
          />

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
