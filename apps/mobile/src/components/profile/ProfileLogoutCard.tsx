import React from 'react';
import { View, StyleSheet } from 'react-native';

import { useColors } from '../../constants/colors';
import { ProfileSettingsItem } from './ProfileSettingsItem';

interface ProfileLogoutCardProps {
  onPress: () => void;
}

export const ProfileLogoutCard = ({ onPress }: ProfileLogoutCardProps) => {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface.card }]}>
      <ProfileSettingsItem
        icon="log-out"
        iconColor="#DC2626"
        label="Log out"
        labelColor="#DC2626"
        onPress={onPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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