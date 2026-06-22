import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Colors } from '../../../src/constants/colors';
import { Typography } from '../../../src/constants/typography';
import { Spacing, Layout } from '../../../src/constants/spacing';
import { ScreenHeader } from '../../../src/components/layout/ScreenHeader';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Badge } from '../../../src/components/ui/Badge';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useLogout } from '../../../src/hooks/useAuth';

const ROLE_DISPLAY: Record<string, { label: string; bg: string; text: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', bg: Colors.priority.critical.bg, text: Colors.priority.critical.text },
  ADMIN: { label: 'Admin', bg: Colors.brand.primaryLight, text: Colors.brand.primary },
  EMPLOYEE: { label: 'Employee', bg: Colors.surface.border, text: Colors.text.secondary },
};

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const { mutate: logout, isPending } = useLogout();

  const roleDisplay = ROLE_DISPLAY[user?.role ?? 'EMPLOYEE'];

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeScreen>
      <ScreenHeader title="Profile" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <Avatar name={user?.name ?? ''} uri={user?.avatarUrl} size={72} />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            {roleDisplay && (
              <Badge label={roleDisplay.label} bg={roleDisplay.bg} textColor={roleDisplay.text} />
            )}
          </View>
        </View>

        {/* Details */}
        {user?.department && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Department</Text>
            <View style={styles.row}>
              <Feather name="briefcase" size={16} color={Colors.brand.primary} />
              <Text style={styles.rowText}>{user.department.name}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            onPress={handleLogout}
            disabled={isPending}
          >
            <Feather name="log-out" size={18} color={Colors.semantic.error} />
            <Text style={[styles.menuText, { color: Colors.semantic.error }]}>
              {isPending ? 'Signing out...' : 'Sign Out'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing[4], gap: Spacing[4], paddingBottom: Spacing[8] },
  profileCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: Layout.cardRadius,
    padding: Spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  profileInfo: { flex: 1, gap: Spacing[1] },
  name: { ...Typography.h4, fontFamily: 'Inter-SemiBold', color: Colors.text.primary },
  email: { ...Typography.bodyMd, fontFamily: 'Inter-Regular', color: Colors.text.secondary },
  section: {
    backgroundColor: Colors.surface.card,
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  sectionLabel: { ...Typography.labelMd, fontFamily: 'Inter-SemiBold', color: Colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  rowText: { ...Typography.bodyMd, fontFamily: 'Inter-Regular', color: Colors.text.primary },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[2],
  },
  menuText: { ...Typography.bodyLg, fontFamily: 'Inter-Medium' },
  pressed: { opacity: 0.7 },
});
