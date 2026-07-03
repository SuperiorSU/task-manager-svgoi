import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { ProfileSettingsItem } from './ProfileSettingsItem';

// Screen 72's "About" card. No dedicated Terms & Privacy screen exists
// anywhere in the app yet — "Terms & privacy" routes to Help & support (the
// closest existing analog) rather than shipping a dead-looking tappable row,
// same "wire to nearest existing destination" precedent used for the
// Dashboard's Report/See log links.
export const ProfileAboutSection = () => {
  const colors = useColors();
  const router = useRouter();

  return (
    <>
      <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>About</Text>
      <View style={[s.card, { backgroundColor: colors.surface.card }]}>
        <ProfileSettingsItem
          icon="file-text"
          label="Terms & privacy"
          onPress={() => router.push('/(app)/profile/help')}
          showDivider
        />
        <View style={s.staticRow}>
          <Feather name="info" size={19} color={colors.text.secondary} />
          <Text style={[s.staticLabel, { color: colors.text.primary }]}>App version</Text>
          <Text style={[s.staticValue, { color: colors.text.tertiary }]}>v1.0.0</Text>
        </View>
      </View>
    </>
  );
};

const s = StyleSheet.create({
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
  staticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  staticLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter-Regular' },
  staticValue: { fontSize: 12, fontFamily: 'Inter-SemiBold' },
});
