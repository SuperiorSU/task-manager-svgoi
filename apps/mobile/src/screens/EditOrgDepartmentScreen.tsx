/**
 * EditOrgDepartmentScreen — SA "Edit department" (HTML screen 56c), reached
 * from Department members (56b) → "Edit department". Head is never edited
 * inline here — the "Change" link routes to Reassign head (56d) instead,
 * matching the design exactly. Reuses CreateOrgDepartmentScreen's
 * SettingsValueRow/SettingsPickerSheet pattern for the (smaller) working-
 * schedule field set.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { departmentsApi } from '@godigitify/api-client';

import { WORKING_DAYS_OPTIONS, WORKING_HOURS_OPTIONS } from '../data/adminSettings.mock';
import { useOrgDepartmentDetail, useUpdateOrgDepartment } from '../hooks/useOrgDirectory';
import { useToast } from '../hooks/useToast';
import { useColors } from '../constants/colors';
import { Layout, Spacing } from '../constants/spacing';
import { queryKeys } from '../constants/queryKeys';

import { SettingsValueRow } from '../components/profile/SettingsValueRow';
import { SettingsPickerSheet } from '../components/profile/SettingsPickerSheet';
import { Skeleton } from '../components/ui/Skeleton';

const WORKING_DAYS_TO_INDICES: Record<string, number[]> = {
  MON_SAT: [1, 2, 3, 4, 5, 6],
  MON_FRI: [1, 2, 3, 4, 5],
  ALL_DAYS: [0, 1, 2, 3, 4, 5, 6],
};
const WORKING_HOURS_TO_RANGE: Record<string, { start: string; end: string }> = {
  '9_5': { start: '09:00', end: '17:00' },
  '8_4': { start: '08:00', end: '16:00' },
  '10_6': { start: '10:00', end: '18:00' },
};

function indicesToWorkingDaysKey(indices: number[]): string {
  const sorted = [...indices].sort();
  const match = Object.entries(WORKING_DAYS_TO_INDICES).find(
    ([, v]) => v.length === sorted.length && [...v].sort().every((n, i) => n === sorted[i])
  );
  return match?.[0] ?? 'MON_SAT';
}
function rangeToWorkingHoursKey(start: string, end: string): string {
  const match = Object.entries(WORKING_HOURS_TO_RANGE).find(([, v]) => v.start === start && v.end === end);
  return match?.[0] ?? '9_5';
}

type PickerKind = 'workingDays' | 'workingHours' | null;

export function EditOrgDepartmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: dept, isLoading: deptLoading } = useOrgDepartmentDetail(id ?? '');
  const settingsQuery = useQuery({
    queryKey: queryKeys.departments.settings(id ?? ''),
    queryFn: () => departmentsApi.getSettings(id ?? ''),
    select: (res) => res.data,
    enabled: !!id,
  });
  const updateDepartment = useUpdateOrgDepartment(id ?? '');
  const toast = useToast();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [workingDays, setWorkingDays] = useState('MON_SAT');
  const [workingHours, setWorkingHours] = useState('9_5');
  const [activePicker, setActivePicker] = useState<PickerKind>(null);
  const [hydrated, setHydrated] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Hydrate form state once, when both dept + settings have loaded.
  useEffect(() => {
    if (hydrated || !dept || !settingsQuery.data) return;
    setName(dept.name);
    setCode(dept.code);
    setDescription(dept.description ?? '');
    setWorkingDays(indicesToWorkingDaysKey(settingsQuery.data.workingDays));
    setWorkingHours(rangeToWorkingHoursKey(settingsQuery.data.workingHoursStart, settingsQuery.data.workingHoursEnd));
    setHydrated(true);
  }, [hydrated, dept, settingsQuery.data]);

  const goBack = useCallback(() => router.back(), [router]);
  const goReassignHead = useCallback(
    () => router.push(`/(app)/people/department/${id}/reassign-head` as never),
    [router, id]
  );

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setNameError('Department name is required');
      return;
    }
    setNameError('');
    setSubmitting(true);
    try {
      const hours = WORKING_HOURS_TO_RANGE[workingHours] ?? WORKING_HOURS_TO_RANGE['9_5']!;
      await Promise.all([
        updateDepartment.mutateAsync({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          ...(description.trim() ? { description: description.trim() } : {}),
        }),
        departmentsApi.updateSettings(id ?? '', {
          workingDays: WORKING_DAYS_TO_INDICES[workingDays] ?? [],
          workingHoursStart: hours.start,
          workingHoursEnd: hours.end,
        }),
      ]);
      router.back();
    } catch {
      toast.error('Could not save changes. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [name, code, description, workingDays, workingHours, updateDepartment, id, router, toast]);

  const workingDaysLabel = WORKING_DAYS_OPTIONS.find((o) => o.value === workingDays)?.label ?? '';
  const workingHoursLabel = WORKING_HOURS_OPTIONS.find((o) => o.value === workingHours)?.label ?? '';

  if (deptLoading || !hydrated) {
    return (
      <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
        <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
          <Pressable onPress={goBack} style={s.headerBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back">
            <Feather name="chevron-left" size={22} color={colors.text.primary} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.text.primary }]}>Edit department</Text>
        </View>
        <View style={s.form}>
          <Skeleton height={50} borderRadius={11} />
          <Skeleton height={76} borderRadius={11} />
          <Skeleton height={60} borderRadius={11} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
        <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
          <Pressable onPress={goBack} style={s.headerBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back">
            <Feather name="chevron-left" size={22} color={colors.text.primary} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.text.primary }]}>Edit department</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[s.form, { paddingBottom: insets.bottom + 100 }]}>
          <View style={s.identityRow}>
            <View style={{ flex: 1.7 }}>
              <Text style={[s.fieldLabel, { color: colors.text.secondary }]}>NAME</Text>
              <View style={[s.input, { backgroundColor: colors.surface.card, borderColor: nameError ? colors.semantic.error : focused === 'name' ? colors.brand.primary : colors.surface.border }]}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                  style={[s.inputText, { color: colors.text.primary }]}
                  placeholder="Department name"
                  placeholderTextColor={colors.text.tertiary}
                />
              </View>
              {!!nameError && <Text style={[s.errorText, { color: colors.semantic.error }]}>{nameError}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.fieldLabel, { color: colors.text.secondary }]}>CODE</Text>
              <View style={[s.input, { backgroundColor: colors.surface.card, borderColor: colors.surface.border }]}>
                <TextInput
                  value={code}
                  onChangeText={(v) => setCode(v.toUpperCase())}
                  autoCapitalize="none"
                  style={[s.inputText, s.inputMono, { color: colors.text.primary }]}
                  placeholderTextColor={colors.text.tertiary}
                />
              </View>
            </View>
          </View>

          <View>
            <Text style={[s.fieldLabel, { color: colors.text.secondary }]}>DESCRIPTION</Text>
            <View style={[s.textarea, { backgroundColor: colors.surface.card, borderColor: focused === 'description' ? colors.brand.primary : colors.surface.border }]}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                onFocus={() => setFocused('description')}
                onBlur={() => setFocused(null)}
                multiline
                textAlignVertical="top"
                style={[s.textareaText, { color: colors.text.primary }]}
                placeholder="What this department does…"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </View>

          <View>
            <Text style={[s.fieldLabel, { color: colors.text.secondary }]}>HEAD OF DEPARTMENT</Text>
            <Pressable
              onPress={goReassignHead}
              style={[s.headRow, { backgroundColor: colors.surface.card, borderColor: colors.surface.border }]}
              accessibilityRole="button"
              accessibilityLabel="Change department head"
            >
              <View style={[s.headAvatar, { backgroundColor: colors.brand.primaryLight }]}>
                <Text style={[s.headAvatarText, { color: colors.brand.primary }]}>
                  {(dept?.headName ?? '—').split(' ').slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('')}
                </Text>
              </View>
              <Text style={[s.headName, { color: colors.text.primary }]} numberOfLines={1}>{dept?.headName ?? 'Unassigned'}</Text>
              <Text style={[s.changeLink, { color: colors.brand.primary }]}>Change</Text>
            </Pressable>
          </View>

          <View>
            <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Working schedule</Text>
            <View style={[s.card, { backgroundColor: colors.surface.card }]}>
              <SettingsValueRow label="Working days" value={workingDaysLabel} onPress={() => setActivePicker('workingDays')} showDivider />
              <SettingsValueRow label="Working hours" value={workingHoursLabel} onPress={() => setActivePicker('workingHours')} />
            </View>
          </View>
        </ScrollView>

        <View style={[s.footer, { paddingBottom: insets.bottom + 12, backgroundColor: colors.surface.card, borderTopColor: colors.surface.border }]}>
          <Pressable
            onPress={goBack}
            disabled={submitting}
            style={({ pressed }) => [s.cancelBtn, { borderColor: colors.surface.border, backgroundColor: colors.surface.card }, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={[s.cancelBtnText, { color: colors.text.secondary }]}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={submitting}
            style={({ pressed }) => [s.saveBtn, { backgroundColor: colors.brand.primary }, pressed && { opacity: 0.88 }, submitting && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Save changes"
          >
            {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={s.saveBtnText}>Save changes</Text>}
          </Pressable>
        </View>
      </View>

      <SettingsPickerSheet
        visible={activePicker === 'workingDays'}
        title="Working days"
        options={WORKING_DAYS_OPTIONS}
        selected={workingDays}
        onSelect={setWorkingDays}
        onClose={() => setActivePicker(null)}
      />
      <SettingsPickerSheet
        visible={activePicker === 'workingHours'}
        title="Working hours"
        options={WORKING_HOURS_OPTIONS}
        selected={workingHours}
        onSelect={setWorkingHours}
        onClose={() => setActivePicker(null)}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1 },
  headerBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  form: { paddingHorizontal: Spacing[4], paddingTop: 16, gap: 18 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter-Bold', letterSpacing: 0.4, marginBottom: 8 },
  identityRow: { flexDirection: 'row', gap: 12 },
  input: { height: 50, borderRadius: Layout.inputRadius, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  inputText: { flex: 1, fontSize: 14, letterSpacing: 0 },
  inputMono: { fontFamily: 'Inter-Regular', letterSpacing: 0.5 },
  errorText: { fontSize: 12, fontFamily: 'Inter-Regular', marginTop: 4, marginLeft: 2 },
  textarea: { minHeight: 76, borderRadius: Layout.inputRadius, borderWidth: 1.5, padding: 12 },
  textareaText: { fontSize: 14, letterSpacing: 0, flex: 1 },
  headRow: { height: 60, borderRadius: 11, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 },
  headAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headAvatarText: { fontSize: 12, fontFamily: 'Inter-Bold' },
  headName: { flex: 1, fontSize: 13.5, fontFamily: 'Inter-SemiBold' },
  changeLink: { fontSize: 12, fontFamily: 'Inter-SemiBold' },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter-Bold', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 9 },
  card: { borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: Spacing[4], paddingTop: 12, borderTopWidth: 1 },
  cancelBtn: { flex: 1, height: 50, borderRadius: Layout.buttonRadius, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  saveBtn: { flex: 1.4, height: 50, borderRadius: Layout.buttonRadius, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFFFFF', letterSpacing: 0 },
});
