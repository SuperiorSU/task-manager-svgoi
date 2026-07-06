import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { useColors } from '../../constants/colors';
import { useThemeStore } from '../../stores/theme.store';
import { ProfileSettingsItem } from './ProfileSettingsItem';

const THEME_LABELS = { light: 'Light', dark: 'Dark', system: 'System' };

export const ProfileSettingsSection = () => {
  const colors = useColors();
  const router = useRouter();
  const { preference } = useThemeStore();

  return (
    <>
      <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>Settings</Text>
      <View style={[styles.card, { backgroundColor: colors.surface.card }]}>
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
          showDivider
        />
        <ProfileSettingsItem
          icon="file-text"
          label="Terms & privacy"
          onPress={() => router.push('/(app)/profile/terms')}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
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