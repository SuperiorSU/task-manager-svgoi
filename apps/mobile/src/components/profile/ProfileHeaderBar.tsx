import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';

interface ProfileHeaderBarProps {
  onEditPress: () => void;
}

export const ProfileHeaderBar = ({ onEditPress }: ProfileHeaderBarProps) => {
  const colors = useColors();
  return (
    <View style={[styles.headerBar, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
      <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Profile</Text>
      <Pressable
        onPress={onEditPress}
        style={({ pressed }) => [styles.editBtn, { borderColor: colors.surface.border }, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel="Edit profile"
      >
        <Feather name="edit-2" size={16} color={colors.text.primary} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
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
});