import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

type Props = {
  greeting: string;
  firstName: string;
  userName: string;
  dateLabel: string;
  unreadCount: number;
  onNotificationPress: () => void;
  onProfilePress: () => void;
};

const getInitials = (name: string): string =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

export const DashboardHeader = React.memo(
  ({ greeting, firstName, userName, dateLabel, unreadCount, onNotificationPress, onProfilePress }: Props) => {
    const insets = useSafeAreaInsets();
    const colors = useColors();
    const initials = getInitials(userName || firstName);

    return (
      <View style={[
        styles.header,
        { paddingTop: insets.top + Spacing[2], backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border },
      ]}>
        <View style={styles.row}>
          <View style={styles.greetingBlock}>
            <Text style={[styles.greeting, { color: colors.text.primary }]} numberOfLines={1}>
              {greeting},{' '}
              <Text style={{ fontFamily: 'Inter-Bold', color: colors.text.primary }}>{firstName}</Text>
            </Text>
            <Text style={[styles.date, { color: colors.text.secondary }]}>{dateLabel}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onNotificationPress}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.75 }]}
              accessibilityRole="button"
              accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <Feather name="bell" size={22} color={colors.brand.primary} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.semantic.error, borderColor: colors.surface.card }]}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={onProfilePress}
              style={({ pressed }) => [styles.avatarBtn, { backgroundColor: colors.brand.secondary }, pressed && { opacity: 0.8 }]}
              accessibilityRole="button"
              accessibilityLabel="Profile"
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }
);

DashboardHeader.displayName = 'DashboardHeader';

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing[2],
  },
  greetingBlock: {
    flex: 1,
    paddingRight: Spacing[3],
  },
  greeting: {
    ...Typography.h2,
    fontFamily: 'Inter-Regular',
  },
  date: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    marginTop: Spacing[1],
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
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
    borderWidth: 1.5,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    lineHeight: 13,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
