import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../constants/colors';
import { useToastStore, type ToastItem, TOAST_AUTO_DISMISS_MS } from '../../stores/toast.store';

const ICON: Record<ToastItem['type'], keyof typeof Feather.glyphMap> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'info',
};

function ToastRow({ item }: { item: ToastItem }) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;
  const meta = {
    success: { bg: colors.semantic.successBg, fg: colors.semantic.success },
    error: { bg: colors.semantic.errorBg, fg: colors.semantic.error },
    info: { bg: colors.semantic.infoBg, fg: colors.semantic.info },
  }[item.type];

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    const fadeOutTimer = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    }, TOAST_AUTO_DISMISS_MS - 220);
    return () => clearTimeout(fadeOutTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        s.row,
        { backgroundColor: meta.bg, borderColor: meta.fg },
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
        },
      ]}
    >
      <Feather name={ICON[item.type]} size={17} color={meta.fg} />
      <Text style={[s.text, { color: colors.text.primary }]} numberOfLines={2}>
        {item.message}
      </Text>
    </Animated.View>
  );
}

/** Global toast stack — mounted once at the app root (see app/_layout.tsx). */
export function Toast() {
  const toasts = useToastStore((s) => s.toasts);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View pointerEvents="none" style={[s.container, { top: insets.top + 8 }]}>
      {toasts.map((t) => (
        <ToastRow key={t.id} item={t} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 1000,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  text: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'Inter-Medium',
  },
});
