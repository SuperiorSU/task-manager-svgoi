import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useColors } from '../../../src/constants/colors';
import { Spacing } from '../../../src/constants/spacing';
import { useProfileData, useProfileStats } from '../../../src/hooks/useProfile';
import { useLogout } from '../../../src/hooks/useAuth';
import { LogoutModal } from '../../../src/components/profile/LogoutModal';
import { ProfileHeaderBar } from '../../../src/components/profile/ProfileHeaderBar';
import { ProfileHeaderCard } from '../../../src/components/profile/ProfileHeaderCard';
import { ProfileAccountSection } from '../../../src/components/profile/ProfileAccountSection';
import { ProfileSettingsSection } from '../../../src/components/profile/ProfileSettingsSection';
import { ProfileLogoutCard } from '../../../src/components/profile/ProfileLogoutCard';
import { ProfileSkeleton } from '../../../src/components/profile/ProfileSkeleton';

export default function ProfileScreen() {
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

          <ProfileAccountSection profile={profile} />

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

// ─── Styles (layout only — no colors) ────────────────────────────────────────

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