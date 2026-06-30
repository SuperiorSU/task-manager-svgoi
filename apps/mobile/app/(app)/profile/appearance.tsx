import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../../src/constants/colors';
import { useThemeStore, type ThemePreference } from '../../../src/stores/theme.store';

// ─── Option config ────────────────────────────────────────────────────────────

type Option = {
  value: ThemePreference;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
};

const OPTIONS: Option[] = [
  {
    value: 'light',
    label: 'Light',
    description: 'Always use the light theme',
    icon: 'sun',
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Always use the dark theme',
    icon: 'moon',
  },
  {
    value: 'system',
    label: 'System default',
    description: 'Follow your device setting',
    icon: 'smartphone',
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AppearanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { preference, setPreference } = useThemeStore();

  return (
    <View style={[s.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      {/* ── Header ── */}
      <View style={[s.headerBar, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}
        >
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.text.primary }]}>Appearance</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* ── Options ── */}
      <View style={[s.card, { backgroundColor: colors.surface.card, borderColor: colors.surface.border, marginTop: 24, marginHorizontal: 16 }]}>
        {OPTIONS.map((opt, i) => {
          const selected = preference === opt.value;
          return (
            <React.Fragment key={opt.value}>
              <Pressable
                onPress={() => setPreference(opt.value)}
                style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
              >
                {/* Icon bubble */}
                <View style={[
                  s.iconBubble,
                  {
                    backgroundColor: selected ? colors.brand.primary : colors.surface.background,
                  },
                ]}>
                  <Feather
                    name={opt.icon}
                    size={18}
                    color={selected ? '#fff' : colors.text.secondary}
                  />
                </View>

                {/* Labels */}
                <View style={s.labelBlock}>
                  <Text style={[s.optLabel, { color: selected ? colors.brand.primary : colors.text.primary }]}>
                    {opt.label}
                  </Text>
                  <Text style={[s.optDesc, { color: colors.text.tertiary }]}>
                    {opt.description}
                  </Text>
                </View>

                {/* Radio indicator */}
                <View style={[s.radio, { borderColor: selected ? colors.brand.primary : colors.surface.borderStrong }]}>
                  {selected && <View style={[s.radioDot, { backgroundColor: colors.brand.primary }]} />}
                </View>
              </Pressable>
              {i < OPTIONS.length - 1 && (
                <View style={[s.divider, { backgroundColor: colors.surface.border, marginLeft: 68 }]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* ── Current label ── */}
      <Text style={[s.hint, { color: colors.text.tertiary }]}>
        {preference === 'system'
          ? 'Currently following your device setting'
          : `${OPTIONS.find((o) => o.value === preference)?.label} mode is active`}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelBlock: { flex: 1 },
  optLabel: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 20,
  },
  optDesc: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
    lineHeight: 16,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  divider: {
    height: 1,
    marginRight: 16,
  },
  hint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 24,
  },
});
