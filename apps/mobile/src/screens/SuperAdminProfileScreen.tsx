import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { useSuperAdminProfileData } from '../hooks/useProfile';
import { useSystemHealth } from '../hooks/useSuperAdminDashboard';

import { ProfileHeaderBar } from '../components/profile/ProfileHeaderBar';
import { SuperAdminProfileHeaderCard } from '../components/profile/SuperAdminProfileHeaderCard';
import { OrgScopeStatsBar } from '../components/profile/OrgScopeStatsBar';
import { ScopeAuthorityCard } from '../components/profile/ScopeAuthorityCard';
import { SystemSecuritySection } from '../components/profile/SystemSecuritySection';
import { ProfileSkeleton } from '../components/profile/ProfileSkeleton';

// Screen 71 — Super Admin Profile Part 1 (identity · org scope · system).
// Split from Part 2 (SuperAdminProfileAccountScreen) per the HTML's overflow
// rule. Unlike Admin/Employee's single-scroll Profile, SA's content doesn't
// fit one screen — Part 2 is a pushed stack route (app/(app)/profile/
// sa-part-2), matching every other Profile sub-screen's navigation pattern
// in this app rather than the HTML's literal "same tab bar, second page"
// treatment (no in-app precedent for horizontal-paged tab screens exists).
export function SuperAdminProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const { data: profile, isLoading: profileLoading } = useSuperAdminProfileData();
  const { data: health, isLoading: healthLoading } = useSystemHealth();

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

          <Pressable
            onPress={() => router.push('/(app)/profile/sa-part-2')}
            style={({ pressed }) => [s.continueRow, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
          >
            <Text style={[s.continueLabel, { color: colors.text.tertiary }]}>
              Scroll for account, settings &amp; log out
            </Text>
            <Feather name="arrow-right" size={13} color={colors.text.tertiary} />
          </Pressable>

          <View style={{ height: Spacing[8] }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  continueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  continueLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});
