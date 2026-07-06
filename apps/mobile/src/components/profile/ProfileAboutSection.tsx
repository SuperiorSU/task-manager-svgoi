import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';

// Screen 72's "About" card. "Terms & privacy" now lives as its own row in
// ProfileSettingsSection (shared across every role), so it isn't repeated
// here — this card is just the app version line.
export const ProfileAboutSection = () => {
  const colors = useColors();

  return (
    <>
      <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>About</Text>
      <View style={[s.card, { backgroundColor: colors.surface.card }]}>
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
