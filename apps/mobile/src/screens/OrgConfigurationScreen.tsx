import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../constants/colors';
import { useOrgConfig, useUpdateOrgConfig } from '../hooks/useOrgConfig';
import {
  WORKING_DAYS_OPTIONS,
  WORKING_HOURS_OPTIONS,
  WEEKLY_HOLIDAY_OPTIONS,
  type OrgConfig,
} from '../data/orgConfig.mock';

import { SettingsToggleRow } from '../components/profile/SettingsToggleRow';
import { SettingsValueRow } from '../components/profile/SettingsValueRow';
import { SettingsPickerSheet } from '../components/profile/SettingsPickerSheet';
import { CategoryChipEditor } from '../components/profile/CategoryChipEditor';

type SheetKey = 'workingDays' | 'workingHours' | 'weeklyHoliday';

// Reached from Super Admin Profile → System & security → "Organization
// configuration" (nav destination required by the Profile module directive,
// but with no dedicated HTML mockup — see orgConfig.mock.ts's header comment
// for the reasoning behind this screen's content). Structure mirrors Admin's
// department-settings.tsx screen closely (same read-only identity row,
// working-schedule card, save/cancel bottom bar) since this is the org-wide
// analog of that screen, just scoped to the whole organisation instead of one
// department.
export function OrgConfigurationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const { data: config, isLoading } = useOrgConfig();
  const { mutate: save, isPending } = useUpdateOrgConfig();

  const [draft, setDraft] = useState<OrgConfig | null>(null);
  const [sheet, setSheet] = useState<SheetKey | null>(null);

  useEffect(() => {
    if (config && !draft) setDraft(config);
  }, [config, draft]);

  const patch = (fields: Partial<OrgConfig>) => setDraft((d) => (d ? { ...d, ...fields } : d));

  const handleSave = () => {
    if (!draft) return;
    Alert.alert(
      'Save organization settings?',
      'These settings apply org-wide — every department and admin will follow the new working hours, holiday, and cross-department assignment rules immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: () => save(draft, { onSuccess: () => router.back() }) },
      ]
    );
  };

  const addCategory = (cat: string) =>
    patch({ defaultTaskCategories: [...(draft?.defaultTaskCategories ?? []), cat] });
  const removeCategory = (cat: string) =>
    patch({ defaultTaskCategories: (draft?.defaultTaskCategories ?? []).filter((c) => c !== cat) });

  return (
    <View style={[s.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      <View style={[s.headerBar, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}>
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.text.primary }]}>Organization configuration</Text>
        <View style={{ width: 38 }} />
      </View>

      {isLoading || !draft ? (
        <View style={s.loader}>
          <ActivityIndicator color={colors.brand.primary} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Organization</Text>
            <View
              style={[s.identityRow, { backgroundColor: colors.surface.card, borderColor: colors.surface.border }]}
            >
              <Text style={[s.identityName, { color: colors.text.primary }]}>{draft.orgName}</Text>
              <Feather name="lock" size={15} color={colors.surface.borderStrong} />
            </View>

            <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Task assignment</Text>
            <View style={[s.card, { backgroundColor: colors.surface.card }]}>
              <SettingsToggleRow
                label="Cross-dept employee assignment"
                subtitle="Admins may assign to employees outside their department"
                enabled={draft.allowCrossDeptEmployeeAssignment}
                onToggle={() =>
                  patch({ allowCrossDeptEmployeeAssignment: !draft.allowCrossDeptEmployeeAssignment })
                }
              />
            </View>

            <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Working schedule</Text>
            <View style={[s.card, { backgroundColor: colors.surface.card }]}>
              <SettingsValueRow
                label="Working days"
                value={WORKING_DAYS_OPTIONS.find((o) => o.value === draft.workingDays)?.label ?? ''}
                onPress={() => setSheet('workingDays')}
                showDivider
              />
              <SettingsValueRow
                label="Working hours"
                value={WORKING_HOURS_OPTIONS.find((o) => o.value === draft.workingHours)?.label ?? ''}
                onPress={() => setSheet('workingHours')}
                showDivider
              />
              <SettingsValueRow
                label="Weekly holiday"
                value={WEEKLY_HOLIDAY_OPTIONS.find((o) => o.value === draft.weeklyHoliday)?.label ?? ''}
                onPress={() => setSheet('weeklyHoliday')}
              />
            </View>
            <Text style={[s.hint, { color: colors.text.tertiary }]}>
              Defaults for newly created departments — existing departments keep their own schedule.
            </Text>

            <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Default task categories</Text>
            <CategoryChipEditor
              categories={draft.defaultTaskCategories}
              onAdd={addCategory}
              onRemove={removeCategory}
            />

            <View style={{ height: 24 }} />
          </ScrollView>

          <View
            style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.surface.card, borderTopColor: colors.surface.border }]}
          >
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [s.cancelBtn, { borderColor: colors.surface.border }, pressed && { opacity: 0.7 }]}
            >
              <Text style={[s.cancelLabel, { color: colors.text.secondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={isPending}
              style={({ pressed }) => [s.saveBtn, { backgroundColor: colors.brand.primary }, pressed && { opacity: 0.85 }]}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.saveLabel}>Save settings</Text>
              )}
            </Pressable>
          </View>

          <SettingsPickerSheet
            visible={sheet === 'workingDays'}
            title="Working days"
            options={WORKING_DAYS_OPTIONS}
            selected={draft.workingDays}
            onSelect={(workingDays) => patch({ workingDays })}
            onClose={() => setSheet(null)}
          />
          <SettingsPickerSheet
            visible={sheet === 'workingHours'}
            title="Working hours"
            options={WORKING_HOURS_OPTIONS}
            selected={draft.workingHours}
            onSelect={(workingHours) => patch({ workingHours })}
            onClose={() => setSheet(null)}
          />
          <SettingsPickerSheet
            visible={sheet === 'weeklyHoliday'}
            title="Weekly holiday"
            options={WEEKLY_HOLIDAY_OPTIONS}
            selected={draft.weeklyHoliday}
            onSelect={(weeklyHoliday) => patch({ weeklyHoliday })}
            onClose={() => setSheet(null)}
          />
        </>
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
    paddingBottom: 12,
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
  scroll: { paddingHorizontal: 16, paddingTop: 20 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 9,
    marginLeft: 4,
  },
  identityRow: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  identityName: { fontSize: 14, fontFamily: 'Inter-Medium' },
  hint: { fontSize: 11.5, fontFamily: 'Inter-Regular', marginTop: 8, marginBottom: 20, lineHeight: 16 },
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
  bottomBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    width: 96,
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  saveBtn: { flex: 1, height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  saveLabel: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#fff' },
});
