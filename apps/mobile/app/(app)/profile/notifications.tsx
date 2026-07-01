import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../../src/constants/colors';
import { useNotificationPrefs, useUpdateNotificationPrefs } from '../../../src/hooks/useProfile';
import type {
  NotificationPreferences,
  DeliveryMethod,
} from '../../../src/data/profile.mock';
import { SettingsToggleRow } from '../../../src/components/profile/SettingsToggleRow';

const DELIVERY_ICONS: Record<DeliveryMethod['key'], keyof typeof Feather.glyphMap> = {
  inApp: 'bell',
  email: 'mail',
  push: 'smartphone',
};

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const { data: prefs, isLoading } = useNotificationPrefs();
  const { mutate: updatePrefs } = useUpdateNotificationPrefs();

  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences | null>(null);
  const current = localPrefs ?? prefs;

  const patch = (updated: NotificationPreferences) => {
    setLocalPrefs(updated);
    updatePrefs(updated);
  };

  const toggleDelivery = (key: DeliveryMethod['key']) => {
    if (!current) return;
    patch({ ...current, delivery: current.delivery.map((d) => d.key === key ? { ...d, enabled: !d.enabled } : d) });
  };

  const toggleType = (id: string) => {
    if (!current) return;
    patch({ ...current, types: current.types.map((t) => t.id === id ? { ...t, enabled: !t.enabled } : t) });
  };

  const toggleQuietHours = () => {
    if (!current) return;
    patch({ ...current, quietHoursEnabled: !current.quietHoursEnabled });
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      <View style={[s.headerBar, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}>
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.text.primary }]}>Notification Preferences</Text>
        <View style={{ width: 38 }} />
      </View>

      {isLoading || !current ? (
        <View style={s.loader}>
          <ActivityIndicator color={colors.brand.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Delivery method</Text>
          <View style={[s.card, { backgroundColor: colors.surface.card }]}>
            {current.delivery.map((d, i) => (
              <SettingsToggleRow
                key={d.id}
                icon={DELIVERY_ICONS[d.key]}
                label={d.label}
                enabled={d.enabled}
                onToggle={() => toggleDelivery(d.key)}
                showDivider={i < current.delivery.length - 1}
              />
            ))}
          </View>

          <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Notify me about</Text>
          <View style={[s.card, { backgroundColor: colors.surface.card }]}>
            {current.types.map((t, i) => (
              <SettingsToggleRow
                key={t.id}
                label={t.label}
                enabled={t.enabled}
                onToggle={() => toggleType(t.id)}
                showDivider={i < current.types.length - 1}
              />
            ))}
          </View>

          <View style={[s.card, { backgroundColor: colors.surface.card }]}>
            <SettingsToggleRow
              icon="moon"
              label="Quiet hours"
              subtitle={`${current.quietHoursStart} – ${current.quietHoursEnd}`}
              enabled={current.quietHoursEnabled}
              onToggle={toggleQuietHours}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

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
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    color: '#94A3B8',
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
