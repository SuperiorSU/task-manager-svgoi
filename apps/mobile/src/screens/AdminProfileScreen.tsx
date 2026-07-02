import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useColors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { useProfileData, useProfileStats } from '../hooks/useProfile';
import { useLogout } from '../hooks/useAuth';

import { LogoutModal } from '../components/profile/LogoutModal';
import { ProfileHeaderBar } from '../components/profile/ProfileHeaderBar';
import { ProfileHeaderCard } from '../components/profile/ProfileHeaderCard';
import { ProfileAccountSection } from '../components/profile/ProfileAccountSection';
import { ProfileManagementSection } from '../components/profile/ProfileManagementSection';
import { ProfileReportingCard } from '../components/profile/ProfileReportingCard';
import { ProfileSettingsSection } from '../components/profile/ProfileSettingsSection';
import { ProfileSettingsItem } from '../components/profile/ProfileSettingsItem';
import { ProfileLogoutCard } from '../components/profile/ProfileLogoutCard';
import { ProfileSkeleton } from '../components/profile/ProfileSkeleton';

// ─── Reports section (admin-only) ────────────────────────────────────────────

const ProfileReportsSection = () => {
  const colors = useColors();
  const router = useRouter();

  return (
    <>
      <Text style={[rs.sectionLabel, { color: colors.text.tertiary }]}>Reports</Text>
      <View style={[rs.card, { backgroundColor: colors.surface.card }]}>
        <ProfileSettingsItem
          icon="bar-chart-2"
          label="My Performance"
          onPress={() =>
            router.push('/(app)/profile/performance' as Parameters<typeof router.push>[0])
          }
          showDivider
        />
        <ProfileSettingsItem
          icon="pie-chart"
          label="Department Report"
          onPress={() =>
            router.push('/(app)/profile/department-report' as Parameters<typeof router.push>[0])
          }
        />
      </View>
    </>
  );
};

const rs = StyleSheet.create({
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AdminProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const { data: profile, isLoading: profileLoading } = useProfileData();
  const { data: stats, isLoading: statsLoading } = useProfileStats();
  const { mutate: logout, isPending: logoutPending } = useLogout();

  const [logoutVisible, setLogoutVisible] = useState(false);

  const isLoading = profileLoading || statsLoading;
  const handleEditPress = () => router.push('/(app)/profile/edit');

  const headerProfile = profile
    ? {
        name: profile.name,
        ...(profile.designation !== undefined ? { designation: profile.designation } : {}),
        ...(profile.department ? { department: profile.department.name } : {}),
        role: profile.role,
      }
    : undefined;

  const headerStats = stats
    ? {
        onTimeRate: stats.completed > 0 ? Math.round(((stats.completed - stats.overdue) / stats.completed) * 100) : 0,
        completed: stats.completed,
        active: stats.pending + stats.inProgress,
      }
    : undefined;

  return (
    <View style={[s.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      <ProfileHeaderBar onEditPress={handleEditPress} />

      {isLoading ? (
        <ProfileSkeleton />
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <ProfileHeaderCard profile={headerProfile} stats={headerStats} onEditPress={handleEditPress} />

          <ProfileManagementSection />

          <ProfileAccountSection profile={profile} />

          {profile?.reportingManager && (
            <ProfileReportingCard
              managerName={profile.reportingManager}
              managerRoleLabel={profile.reportingManagerRole ?? 'Super Admin'}
            />
          )}

          <ProfileReportsSection />

          <ProfileSettingsSection />

          <ProfileLogoutCard onPress={() => setLogoutVisible(true)} />

          <Text style={[s.version, { color: colors.text.tertiary }]}>TaskFlow SVGOI · v1.0</Text>

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

// ─── Styles ───────────────────────────────────────────────────────────────────

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
