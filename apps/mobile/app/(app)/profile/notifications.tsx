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
import {
  useNotificationPrefs,
  useUpdateNotificationPrefs,
  toNotificationPreferencesView,
  buildDeliveryTogglePatch,
  buildTypeGroupTogglePatch,
} from '../../../src/hooks/useProfile';
import type { DeliveryMethod } from '../../../src/types/notificationPreferences';
import { SettingsToggleRow } from '../../../src/components/profile/SettingsToggleRow';
import { ProfileSettingsItem } from '../../../src/components/profile/ProfileSettingsItem';
import { TimePickerModal } from '../../../src/components/ui/TimePickerModal';
import { parseTimeString, formatTimeString } from '../../../src/utils/time';

const DELIVERY_ICONS: Record<DeliveryMethod['key'], keyof typeof Feather.glyphMap> = {
  inApp: 'bell',
  email: 'mail',
  push: 'smartphone',
};

const formatDisplayTime = (time: string): string => {
  const { hour, minute, isAfternoon } = parseTimeString(time);
  return `${hour}:${String(minute).padStart(2, '0')} ${isAfternoon ? 'PM' : 'AM'}`;
};

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const { data: serverPrefs, isLoading } = useNotificationPrefs();
  const { mutate: updatePrefs } = useUpdateNotificationPrefs();

  const [editingBoundary, setEditingBoundary] = useState<'start' | 'end' | null>(null);

  const current = serverPrefs ? toNotificationPreferencesView(serverPrefs) : null;

  const toggleDelivery = (key: DeliveryMethod['key']) => {
    if (!serverPrefs) return;
    updatePrefs(buildDeliveryTogglePatch(serverPrefs, key));
  };

  const toggleType = (groupKey: string) => {
    if (!serverPrefs) return;
    updatePrefs(buildTypeGroupTogglePatch(serverPrefs, groupKey));
  };

  const toggleQuietHours = () => {
    if (!serverPrefs) return;
    updatePrefs({ quietHoursEnabled: !serverPrefs.quietHoursEnabled });
  };

  const confirmBoundaryTime = (hour: number, minute: number, isAfternoon: boolean) => {
    if (!serverPrefs || !editingBoundary) return;
    const time = formatTimeString(hour, minute, isAfternoon);
    updatePrefs(editingBoundary === 'start' ? { quietHoursStart: time } : { quietHoursEnd: time });
    setEditingBoundary(null);
  };

  const boundaryPickerValue = editingBoundary && serverPrefs
    ? parseTimeString(editingBoundary === 'start' ? serverPrefs.quietHoursStart : serverPrefs.quietHoursEnd)
    : null;

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
                onToggle={() => toggleType(t.key)}
                showDivider={i < current.types.length - 1}
              />
            ))}
          </View>

          <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Quiet hours</Text>
          <View style={[s.card, { backgroundColor: colors.surface.card }]}>
            <SettingsToggleRow
              icon="moon"
              label="Quiet hours"
              subtitle={`${formatDisplayTime(current.quietHoursStart)} – ${formatDisplayTime(current.quietHoursEnd)}`}
              enabled={current.quietHoursEnabled}
              onToggle={toggleQuietHours}
              showDivider={current.quietHoursEnabled}
            />
            {current.quietHoursEnabled && (
              <>
                <ProfileSettingsItem
                  icon="clock"
                  label="Starts at"
                  valueLabel={formatDisplayTime(current.quietHoursStart)}
                  onPress={() => setEditingBoundary('start')}
                  showDivider
                />
                <ProfileSettingsItem
                  icon="clock"
                  label="Ends at"
                  valueLabel={formatDisplayTime(current.quietHoursEnd)}
                  onPress={() => setEditingBoundary('end')}
                />
              </>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {boundaryPickerValue && (
        <TimePickerModal
          visible
          hour={boundaryPickerValue.hour}
          minute={boundaryPickerValue.minute}
          isAfternoon={boundaryPickerValue.isAfternoon}
          onConfirm={confirmBoundaryTime}
          onClose={() => setEditingBoundary(null)}
          colors={colors}
          title={editingBoundary === 'start' ? 'Quiet hours start' : 'Quiet hours end'}
        />
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
