import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import type { DepartmentSettings as ApiDepartmentSettings } from '@godigitify/types';

import { useColors } from '../../../src/constants/colors';
import { useAdminSettings, useUpdateAdminSettings } from '../../../src/hooks/useAdminSettings';
import { useAuthStore } from '../../../src/stores/auth.store';

import { SettingsToggleRow } from '../../../src/components/profile/SettingsToggleRow';
import { SettingsValueRow } from '../../../src/components/profile/SettingsValueRow';
import { SettingsPickerSheet } from '../../../src/components/profile/SettingsPickerSheet';
import { CategoryChipEditor } from '../../../src/components/profile/CategoryChipEditor';

type DepartmentSettingsDraft = Pick<
  ApiDepartmentSettings,
  | 'workingDays'
  | 'workingHoursStart'
  | 'workingHoursEnd'
  | 'weeklyHoliday'
  | 'defaultPriority'
  | 'defaultDueWindowDays'
  | 'membersSeeOnlyOwnTasks'
  | 'taskCategories'
>;

type SheetKey = 'workingDays' | 'workingHours' | 'weeklyHoliday' | 'defaultPriority' | 'dueWindow';

const WORKING_DAYS_OPTIONS: { value: string; label: string }[] = [
  { value: 'MON_SAT', label: 'Mon – Sat' },
  { value: 'MON_FRI', label: 'Mon – Fri' },
  { value: 'ALL_DAYS', label: 'All days' },
];

const WORKING_DAYS_PRESETS: Record<string, number[]> = {
  MON_SAT: [1, 2, 3, 4, 5, 6],
  MON_FRI: [1, 2, 3, 4, 5],
  ALL_DAYS: [0, 1, 2, 3, 4, 5, 6],
};

const workingDaysToKey = (days: number[]): string => {
  const sorted = [...days].sort();
  const match = Object.entries(WORKING_DAYS_PRESETS).find(
    ([, preset]) => preset.length === sorted.length && preset.every((d, i) => d === sorted[i])
  );
  return match?.[0] ?? 'MON_SAT';
};

const WORKING_HOURS_OPTIONS: { value: string; label: string }[] = [
  { value: '9_5', label: '9:00 AM – 5:00 PM' },
  { value: '8_4', label: '8:00 AM – 4:00 PM' },
  { value: '10_6', label: '10:00 AM – 6:00 PM' },
];

const WORKING_HOURS_PRESETS: Record<string, { start: string; end: string }> = {
  '9_5': { start: '09:00', end: '17:00' },
  '8_4': { start: '08:00', end: '16:00' },
  '10_6': { start: '10:00', end: '18:00' },
};

const workingHoursToKey = (start: string, end: string): string =>
  Object.entries(WORKING_HOURS_PRESETS).find(
    ([, p]) => p.start === start && p.end === end
  )?.[0] ?? '9_5';

const WEEKLY_HOLIDAY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Sunday' },
  { value: 6, label: 'Saturday' },
  { value: -1, label: 'None' },
];

const DUE_WINDOW_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '1 day' },
  { value: 2, label: '2 days' },
  { value: 3, label: '3 days' },
  { value: 7, label: '7 days' },
];

const DEFAULT_PRIORITY_OPTIONS: { value: ApiDepartmentSettings['defaultPriority']; label: string }[] = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const PRIORITY_DOT_COLOR: Record<string, (c: ReturnType<typeof useColors>) => string> = {
  CRITICAL: (c) => c.priority.critical.solid,
  HIGH: (c) => c.priority.high.solid,
  MEDIUM: (c) => c.priority.medium.solid,
  LOW: (c) => c.priority.low.solid,
};

export default function DepartmentSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const department = useAuthStore((s) => s.user?.department);

  const { data: settings, isLoading } = useAdminSettings();
  const { mutate: save, isPending } = useUpdateAdminSettings();

  const [draft, setDraft] = useState<DepartmentSettingsDraft | null>(null);
  const [sheet, setSheet] = useState<SheetKey | null>(null);

  useEffect(() => {
    if (settings && !draft) {
      setDraft({
        workingDays: settings.workingDays,
        workingHoursStart: settings.workingHoursStart,
        workingHoursEnd: settings.workingHoursEnd,
        weeklyHoliday: settings.weeklyHoliday,
        defaultPriority: settings.defaultPriority,
        defaultDueWindowDays: settings.defaultDueWindowDays,
        membersSeeOnlyOwnTasks: settings.membersSeeOnlyOwnTasks,
        taskCategories: settings.taskCategories,
      });
    }
  }, [settings, draft]);

  const patch = (fields: Partial<DepartmentSettingsDraft>) =>
    setDraft((d) => (d ? { ...d, ...fields } : d));

  const handleSave = () => {
    if (!draft) return;
    save(draft, { onSuccess: () => router.back() });
  };

  const addCategory = (cat: string) =>
    patch({ taskCategories: [...(draft?.taskCategories ?? []), cat] });
  const removeCategory = (cat: string) =>
    patch({ taskCategories: (draft?.taskCategories ?? []).filter((c) => c !== cat) });

  const priorityOptionsWithColor = DEFAULT_PRIORITY_OPTIONS.map((o) => ({
    ...o,
    color: PRIORITY_DOT_COLOR[o.value]?.(colors),
  }));

  const workingDaysKey = useMemo(
    () => (draft ? workingDaysToKey(draft.workingDays) : 'MON_SAT'),
    [draft]
  );
  const workingHoursKey = useMemo(
    () => (draft ? workingHoursToKey(draft.workingHoursStart, draft.workingHoursEnd) : '9_5'),
    [draft]
  );

  return (
    <View style={[s.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      <View style={[s.headerBar, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}>
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.text.primary }]}>Department settings</Text>
        <View style={{ width: 38 }} />
      </View>

      {isLoading || !draft ? (
        <View style={s.loader}>
          <ActivityIndicator color={colors.brand.primary} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Department name</Text>
            <View
              style={[
                s.identityRow,
                { backgroundColor: colors.surface.card, borderColor: colors.surface.border },
              ]}
            >
              <Text style={[s.identityName, { color: colors.text.primary }]}>{department?.name ?? ''}</Text>
              <Text style={[s.identityCode, { color: colors.text.tertiary }]}>{department?.code ?? ''}</Text>
            </View>
            <Text style={[s.hint, { color: colors.text.tertiary }]}>
              Managed by Super Admin — contact them to rename or restructure this department.
            </Text>

            <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Working schedule</Text>
            <View style={[s.card, { backgroundColor: colors.surface.card }]}>
              <SettingsValueRow
                label="Working days"
                value={WORKING_DAYS_OPTIONS.find((o) => o.value === workingDaysKey)?.label ?? ''}
                onPress={() => setSheet('workingDays')}
                showDivider
              />
              <SettingsValueRow
                label="Working hours"
                value={WORKING_HOURS_OPTIONS.find((o) => o.value === workingHoursKey)?.label ?? ''}
                onPress={() => setSheet('workingHours')}
                showDivider
              />
              <SettingsValueRow
                label="Weekly holiday"
                value={WEEKLY_HOLIDAY_OPTIONS.find((o) => o.value === draft.weeklyHoliday)?.label ?? ''}
                onPress={() => setSheet('weeklyHoliday')}
              />
            </View>

            <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Task defaults</Text>
            <View style={[s.card, { backgroundColor: colors.surface.card }]}>
              <SettingsValueRow
                label="Default priority"
                value={DEFAULT_PRIORITY_OPTIONS.find((o) => o.value === draft.defaultPriority)?.label ?? ''}
                valueDotColor={PRIORITY_DOT_COLOR[draft.defaultPriority]?.(colors)}
                onPress={() => setSheet('defaultPriority')}
                showDivider
              />
              <SettingsValueRow
                label="Default due window"
                value={DUE_WINDOW_OPTIONS.find((o) => o.value === draft.defaultDueWindowDays)?.label ?? ''}
                onPress={() => setSheet('dueWindow')}
                showDivider
              />
              <SettingsToggleRow
                label="Members see only own tasks"
                subtitle="Private task copies"
                enabled={draft.membersSeeOnlyOwnTasks}
                onToggle={() => patch({ membersSeeOnlyOwnTasks: !draft.membersSeeOnlyOwnTasks })}
              />
            </View>

            <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Task categories</Text>
            <CategoryChipEditor
              categories={draft.taskCategories}
              onAdd={addCategory}
              onRemove={removeCategory}
            />

            <View style={{ height: 24 }} />
          </ScrollView>

          <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.surface.card, borderTopColor: colors.surface.border }]}>
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
            selected={workingDaysKey}
            onSelect={(key) => {
              const preset = WORKING_DAYS_PRESETS[key];
              if (preset) patch({ workingDays: preset });
            }}
            onClose={() => setSheet(null)}
          />
          <SettingsPickerSheet
            visible={sheet === 'workingHours'}
            title="Working hours"
            options={WORKING_HOURS_OPTIONS}
            selected={workingHoursKey}
            onSelect={(key) => {
              const preset = WORKING_HOURS_PRESETS[key];
              if (preset) patch({ workingHoursStart: preset.start, workingHoursEnd: preset.end });
            }}
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
          <SettingsPickerSheet
            visible={sheet === 'defaultPriority'}
            title="Default priority"
            options={priorityOptionsWithColor}
            selected={draft.defaultPriority}
            onSelect={(defaultPriority) => patch({ defaultPriority })}
            onClose={() => setSheet(null)}
          />
          <SettingsPickerSheet
            visible={sheet === 'dueWindow'}
            title="Default due window"
            options={DUE_WINDOW_OPTIONS}
            selected={draft.defaultDueWindowDays}
            onSelect={(defaultDueWindowDays) => patch({ defaultDueWindowDays })}
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
  },
  identityName: { fontSize: 14, fontFamily: 'Inter-Medium' },
  identityCode: { fontSize: 12, fontFamily: 'Inter-Regular' },
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
