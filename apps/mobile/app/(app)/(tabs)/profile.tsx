import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../../src/constants/colors';
import { Spacing } from '../../../src/constants/spacing';
import { useThemeStore } from '../../../src/stores/theme.store';
import { useProfileData, useProfileStats } from '../../../src/hooks/useProfile';
import { useLogout } from '../../../src/hooks/useAuth';
import { ProfileStatsBar } from '../../../src/components/profile/ProfileStatsBar';
import { ProfileInfoCard } from '../../../src/components/profile/ProfileInfoCard';
import { ProfileSettingsItem } from '../../../src/components/profile/ProfileSettingsItem';
import { LogoutModal } from '../../../src/components/profile/LogoutModal';
import { Skeleton } from '../../../src/components/ui/Skeleton';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

const THEME_LABELS = { light: 'Light', dark: 'Dark', system: 'System' };

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const ProfileSkeleton = ({ bg }: { bg: string }) => (
  <View style={{ gap: 12, padding: 16, backgroundColor: bg, flex: 1 }}>
    <Skeleton height={220} borderRadius={16} />
    <Skeleton height={110} borderRadius={12} />
    <Skeleton height={200} borderRadius={12} />
    <Skeleton height={56} borderRadius={12} />
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const { preference } = useThemeStore();
  const { data: profile, isLoading: profileLoading } = useProfileData();
  const { data: stats, isLoading: statsLoading } = useProfileStats();
  const { mutate: logout, isPending: logoutPending } = useLogout();

  const [logoutVisible, setLogoutVisible] = useState(false);

  const isLoading = profileLoading || statsLoading;

  return (
    <View style={[s.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      {/* ── Custom header ── */}
      <View style={[s.headerBar, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Text style={[s.headerTitle, { color: colors.text.primary }]}>Profile</Text>
        <Pressable
          onPress={() => router.push('/(app)/profile/edit')}
          style={({ pressed }) => [s.editBtn, { borderColor: colors.surface.border }, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
        >
          <Feather name="edit-2" size={16} color={colors.text.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <ProfileSkeleton bg={colors.surface.background} />
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Profile header card ── */}
          <View style={[s.profileCard, { backgroundColor: colors.surface.card }]}>
            <View style={s.avatarWrap}>
              <View style={[s.avatar, { backgroundColor: colors.brand.secondary }]}>
                <Text style={s.initials}>{getInitials(profile?.name ?? '')}</Text>
              </View>
              <Pressable
                onPress={() => router.push('/(app)/profile/edit')}
                style={[s.avatarEditBadge, { backgroundColor: colors.brand.primary, borderColor: colors.surface.card }]}
                accessibilityLabel="Change photo"
              >
                <Feather name="camera" size={11} color="#fff" />
              </Pressable>
            </View>

            <Text style={[s.name, { color: colors.text.primary }]}>{profile?.name}</Text>
            <Text style={[s.designation, { color: colors.text.secondary }]}>
              {profile?.designation} · {profile?.department?.name ?? '—'}
            </Text>

            <View style={[s.roleBadge, { backgroundColor: colors.brand.primaryLight, borderColor: '#DBEAFE' }]}>
              <View style={[s.roleDot, { backgroundColor: colors.brand.primary }]} />
              <Text style={[s.roleLabel, { color: colors.brand.primaryDark }]}>
                {profile?.role === 'SUPER_ADMIN' ? 'Super Admin'
                  : profile?.role === 'ADMIN' ? 'Admin'
                  : 'Employee'}
              </Text>
            </View>

            {stats && <ProfileStatsBar stats={{
              onTimeRate: 0,
              completed: stats.completed,
              active: (stats.pending ?? 0) + (stats.inProgress ?? 0),
            }} />}
          </View>

          {/* ── Account section ── */}
          <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Account</Text>
          <View style={s.cardWrap}>
            <ProfileInfoCard
              rows={[
                { icon: 'mail', subLabel: 'Email', value: profile?.email ?? '' },
                { icon: 'phone', subLabel: 'Phone', value: profile?.phone ?? '' },
                {
                  icon: 'credit-card',
                  subLabel: 'Employee ID · read-only',
                  value: profile?.employeeId ?? '',
                  readOnly: true,
                },
              ]}
            />
          </View>

          {/* ── Settings section ── */}
          <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Settings</Text>
          <View style={[s.card, { backgroundColor: colors.surface.card }]}>
            <ProfileSettingsItem
              icon="lock"
              label="Change password"
              onPress={() => router.push('/(app)/profile/change-password')}
              showDivider
            />
            <ProfileSettingsItem
              icon="sun"
              label="Appearance"
              valueLabel={THEME_LABELS[preference]}
              onPress={() => router.push('/(app)/profile/appearance')}
              showDivider
            />
            <ProfileSettingsItem
              icon="bell"
              label="Notification preferences"
              onPress={() => router.push('/(app)/profile/notifications')}
              showDivider
            />
            <ProfileSettingsItem
              icon="info"
              label="Help & support"
              onPress={() => router.push('/(app)/profile/help')}
            />
          </View>

          {/* ── Logout row ── */}
          <View style={[s.card, { backgroundColor: colors.surface.card }]}>
            <ProfileSettingsItem
              icon="log-out"
              iconColor="#DC2626"
              label="Log out"
              labelColor="#DC2626"
              onPress={() => setLogoutVisible(true)}
            />
          </View>

          {/* ── Version footer ── */}
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
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
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 9,
    marginLeft: 2,
  },
  cardWrap: {
    marginBottom: 20,
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
  version: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 8,
  },
});
