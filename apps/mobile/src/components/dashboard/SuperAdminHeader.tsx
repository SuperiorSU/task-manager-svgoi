import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';
import { getInitials } from '../../utils/initial';

type Props = {
  greeting: string;
  firstName: string;
  userName: string;
  dateLabel: string;
  scopeLabel: string;
  unreadCount: number;
  onNotificationPress: () => void;
  onProfilePress: () => void;
};

// Navy identity strip — the Super Admin surface's signature element,
// distinct from the white DashboardHeader used by Admin/Employee. Mirrors
// the sidebar navy (brand.secondary) treatment Web Admin uses for
// admin-tier surfaces (06_frontend_design_directive.md Part 4).
export const SuperAdminHeader = React.memo(
  ({
    greeting,
    firstName,
    userName,
    dateLabel,
    scopeLabel,
    unreadCount,
    onNotificationPress,
    onProfilePress,
  }: Props) => {
    const insets = useSafeAreaInsets();
    const colors = useColors();
    const initials = getInitials(userName || firstName);

    return (
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing[2], backgroundColor: colors.brand.secondary },
        ]}
      >
        <View style={styles.left}>
          <View style={styles.roleBadge}>
            <Feather name="shield" size={11} color="#C7D2FE" />
            <Text style={styles.roleBadgeText}>Super Admin</Text>
          </View>
          <Text style={styles.greeting} numberOfLines={1}>
            {greeting}, {firstName}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{dateLabel}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{scopeLabel}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={onNotificationPress}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <Feather name="bell" size={22} color="#C7D2FE" />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.semantic.warning, borderColor: colors.brand.secondary }]}>
                <Text style={[styles.badgeText, { color: colors.brand.secondary }]}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={onProfilePress}
            style={({ pressed }) => [styles.avatarBtn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            <Text style={[styles.avatarText, { color: colors.brand.secondary }]}>{initials}</Text>
          </Pressable>
        </View>
      </View>
    );
  }
);

SuperAdminHeader.displayName = 'SuperAdminHeader';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[4],
    gap: Spacing[3],
  },
  left: { flex: 1, minWidth: 0 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.13)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.6,
    color: '#C7D2FE',
    textTransform: 'uppercase',
  },
  greeting: {
    ...Typography.h2,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginTop: 9,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  metaText: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    color: '#A5B4E0',
  },
  metaDot: { color: '#3B4A94' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginTop: 2,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    lineHeight: 13,
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
  },
});
