import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { useNotificationStore } from '../../stores/notification.store';

type Props = {
  name: keyof typeof Feather.glyphMap;
  focused: boolean;
  showBadge?: boolean;
};

export const TabBarIcon = ({ name, focused, showBadge }: Props) => {
  const colors = useColors();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const showDot = showBadge && unreadCount > 0;

  return (
    <View>
      <Feather
        name={name}
        size={22}
        color={focused ? colors.brand.primary : colors.text.tertiary}
      />
      {showDot && (
        <View style={[styles.badge, { backgroundColor: colors.semantic.error }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
