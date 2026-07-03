/**
 * Create Department screen — Super Admin (screen 54).
 * Seeds identity, head and working-schedule/task-default defaults. Reuses
 * the same option presets as Admin's own Department Settings screen (§47,
 * adminSettings.mock.ts) so both screens speak the same value vocabulary.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import {
  WORKING_DAYS_OPTIONS,
  WORKING_HOURS_OPTIONS,
  WEEKLY_HOLIDAY_OPTIONS,
  DUE_WINDOW_OPTIONS,
  DEFAULT_PRIORITY_OPTIONS,
  type TaskPriorityKey,
} from '../data/adminSettings.mock';
import { useOrgAdmins, useCreateOrgDepartment } from '../hooks/useOrgDirectory';
import { useColors } from '../constants/colors';
import { Layout, Spacing } from '../constants/spacing';

import { HeadPickerSheet } from '../components/people/HeadPickerSheet';
import { SettingsValueRow } from '../components/profile/SettingsValueRow';
import { SettingsPickerSheet } from '../components/profile/SettingsPickerSheet';

// ─── Field helpers (same local convention as CreateOrgUserScreen) ─────────────

function FieldLabel({ children, hint }: { children: string; hint?: string }) {
  const colors = useColors();
  return (
    <View style={fl.row}>
      <Text style={[fl.label, { color: colors.text.secondary }]}>{children}</Text>
      {hint && <Text style={[fl.hint, { color: colors.text.tertiary }]}> · {hint}</Text>}
    </View>
  );
}
const fl = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  label: { fontSize: 12, fontFamily: 'Inter-SemiBold' },
  hint: { fontSize: 12, fontFamily: 'Inter-Regular' },
});

function FieldInput({
  value,
  onChangeText,
  placeholder,
  error,
  focused,
  onFocus,
  onBlur,
  autoCapitalize = 'words',
  mono = false,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  error?: string;
  focused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  autoCapitalize?: TextInput['props']['autoCapitalize'];
  mono?: boolean;
}) {
  const colors = useColors();
  return (
    <>
      <View
        style={[
          fi.input,
          {
            backgroundColor: colors.surface.card,
            borderColor: error ? colors.semantic.error : focused ? colors.brand.primary : colors.surface.border,
          },
          focused && fi.focused,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          onFocus={onFocus}
          onBlur={onBlur}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          style={[
            fi.textInput,
            { color: colors.text.primary, fontFamily: mono ? 'Inter-Regular' : 'Inter-Regular' },
            Platform.select({ android: { padding: 0 } }),
          ]}
        />
      </View>
      {error ? <Text style={[fi.error, { color: colors.semantic.error }]}>{error}</Text> : null}
    </>
  );
}
const fi = StyleSheet.create({
  input: { height: 50, borderRadius: Layout.inputRadius, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  focused: { shadowColor: '#1A5CF8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  textInput: { flex: 1, fontSize: 14, letterSpacing: 0 },
  error: { fontSize: 12, fontFamily: 'Inter-Regular', marginTop: 4, marginLeft: 2 },
});

const deriveCode = (name: string) => name.trim().split(/\s+/)[0]?.slice(0, 3).toUpperCase() ?? '';

// ─── Mock-option → real DepartmentSettings mapping ────────────────────────────
// The working-schedule/task-default pickers reuse Admin's own mock value
// vocabulary (adminSettings.mock); convert to the real DTO's shape (day
// indices, HH:mm hours) on submit.

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

// 0 = Sunday … 6 = Saturday (JS Date.getDay() convention); -1 = no weekly holiday.
const WEEKLY_HOLIDAY_TO_INDEX: Record<string, number> = {
  SUNDAY: 0,
  SATURDAY: 6,
  NONE: -1,
};

const priorityDotColor: Record<TaskPriorityKey, string> = {
  CRITICAL: '#7C3AED',
  HIGH: '#EF4444',
  MEDIUM: '#F59E0B',
  LOW: '#22C55E',
};

type PickerKind = 'workingDays' | 'workingHours' | 'weeklyHoliday' | 'priority' | 'dueWindow' | null;

// ─── Screen ───────────────────────────────────────────────────────────────────

export function CreateOrgDepartmentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const adminsQuery = useOrgAdmins();
  const createDepartment = useCreateOrgDepartment();
  const admins = adminsQuery.data ?? [];

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [headUserId, setHeadUserId] = useState<string | undefined>(undefined);
  const [headSheetVisible, setHeadSheetVisible] = useState(false);

  const [workingDays, setWorkingDays] = useState('MON_SAT');
  const [workingHours, setWorkingHours] = useState('9_5');
  const [weeklyHoliday, setWeeklyHoliday] = useState('SUNDAY');
  const [defaultPriority, setDefaultPriority] = useState<TaskPriorityKey>('MEDIUM');
  const [defaultDueWindowDays, setDefaultDueWindowDays] = useState(3);
  const [activePicker, setActivePicker] = useState<PickerKind>(null);

  const [focused, setFocused] = useState<string | null>('name');
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      if (!codeManuallyEdited) setCode(deriveCode(value));
    },
    [codeManuallyEdited]
  );

  const handleCodeChange = useCallback((value: string) => {
    setCodeManuallyEdited(true);
    setCode(value.toUpperCase());
  }, []);

  const selectedHead = admins.find((a) => a.id === headUserId);

  const validate = useCallback(async (): Promise<boolean> => {
    const errs: { name?: string; code?: string } = {};

    if (!name.trim()) errs.name = 'Department name is required';
    if (!code.trim()) errs.code = 'Code is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [name, code]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const valid = await validate();
      if (!valid) return;

      const hours = WORKING_HOURS_TO_RANGE[workingHours] ?? WORKING_HOURS_TO_RANGE['9_5']!;

      await createDepartment.mutateAsync({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        ...(headUserId ? { headId: headUserId } : {}),
        settings: {
          workingDays: WORKING_DAYS_TO_INDICES[workingDays] ?? [],
          workingHoursStart: hours.start,
          workingHoursEnd: hours.end,
          weeklyHoliday: WEEKLY_HOLIDAY_TO_INDEX[weeklyHoliday] ?? -1,
          defaultPriority,
          defaultDueWindowDays,
        },
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert('Error', 'Could not create this department. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [validate, createDepartment, name, code, headUserId, workingDays, workingHours, weeklyHoliday, defaultPriority, defaultDueWindowDays, router]);

  const workingDaysLabel = WORKING_DAYS_OPTIONS.find((o) => o.value === workingDays)?.label ?? '';
  const workingHoursLabel = WORKING_HOURS_OPTIONS.find((o) => o.value === workingHours)?.label ?? '';
  const weeklyHolidayLabel = WEEKLY_HOLIDAY_OPTIONS.find((o) => o.value === weeklyHoliday)?.label ?? '';
  const priorityLabel = DEFAULT_PRIORITY_OPTIONS.find((o) => o.value === defaultPriority)?.label ?? '';
  const dueWindowLabel = DUE_WINDOW_OPTIONS.find((o) => o.value === defaultDueWindowDays)?.label ?? '';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
          <Pressable onPress={() => router.back()} style={s.headerBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
            <Feather name="x" size={22} color={colors.text.primary} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.text.primary }]}>New department</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.form, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* Identity */}
          <View style={s.identityRow}>
            <View style={{ flex: 1.7 }}>
              <FieldLabel>Department name</FieldLabel>
              <FieldInput
                value={name}
                onChangeText={handleNameChange}
                placeholder="Robotics Lab"
                {...(errors.name ? { error: errors.name } : {})}
                focused={focused === 'name'}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel>Code</FieldLabel>
              <FieldInput
                value={code}
                onChangeText={handleCodeChange}
                placeholder="ROB"
                {...(errors.code ? { error: errors.code } : {})}
                focused={focused === 'code'}
                onFocus={() => setFocused('code')}
                onBlur={() => setFocused(null)}
                autoCapitalize="characters"
                mono
              />
            </View>
          </View>

          {/* Department head */}
          <View>
            <FieldLabel hint="an admin">Department head</FieldLabel>
            <Pressable
              onPress={() => setHeadSheetVisible(true)}
              style={[s.headRow, { backgroundColor: colors.surface.card, borderColor: colors.surface.border }]}
            >
              {selectedHead ? (
                <>
                  <View style={[s.headAvatar, { backgroundColor: selectedHead.avatarBg }]}>
                    <Text style={[s.headAvatarText, { color: selectedHead.avatarText }]}>{selectedHead.initials}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[s.headName, { color: colors.text.primary }]} numberOfLines={1}>{selectedHead.name}</Text>
                    <Text style={[s.headSub, { color: colors.text.tertiary }]} numberOfLines={1}>
                      Admin · {selectedHead.departments.map((d) => d.name).join(', ')}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={[s.headPlaceholder, { color: colors.text.tertiary }]}>Select an admin (optional)</Text>
              )}
              <Feather name="chevron-down" size={18} color={colors.text.tertiary} />
            </Pressable>
          </View>

          {/* Working schedule */}
          <View>
            <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Working schedule</Text>
            <View style={[s.card, { backgroundColor: colors.surface.card }]}>
              <SettingsValueRow label="Working days" value={workingDaysLabel} onPress={() => setActivePicker('workingDays')} showDivider />
              <SettingsValueRow label="Working hours" value={workingHoursLabel} onPress={() => setActivePicker('workingHours')} showDivider />
              <SettingsValueRow label="Weekly holiday" value={weeklyHolidayLabel} onPress={() => setActivePicker('weeklyHoliday')} />
            </View>
          </View>

          {/* Task defaults */}
          <View>
            <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Task defaults</Text>
            <View style={[s.card, { backgroundColor: colors.surface.card }]}>
              <SettingsValueRow
                label="Default priority"
                value={priorityLabel}
                valueDotColor={priorityDotColor[defaultPriority]}
                onPress={() => setActivePicker('priority')}
                showDivider
              />
              <SettingsValueRow label="Default due window" value={dueWindowLabel} onPress={() => setActivePicker('dueWindow')} />
            </View>
          </View>
        </ScrollView>

        {/* ── Footer CTA ──────────────────────────────────────────────── */}
        <View style={[s.footer, { paddingBottom: insets.bottom + 12, backgroundColor: colors.surface.card, borderTopColor: colors.surface.border }]}>
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              s.submitBtn,
              { backgroundColor: colors.brand.primary },
              pressed && { opacity: 0.88 },
              submitting && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Create department"
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Feather name="plus" size={17} color="#FFFFFF" />
                <Text style={s.submitBtnText}>Create department</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* ── Pickers ───────────────────────────────────────────────────── */}
      <HeadPickerSheet
        visible={headSheetVisible}
        admins={admins}
        {...(headUserId ? { selectedId: headUserId } : {})}
        onSelect={(admin) => setHeadUserId(admin.id)}
        onClose={() => setHeadSheetVisible(false)}
      />

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
      <SettingsPickerSheet
        visible={activePicker === 'weeklyHoliday'}
        title="Weekly holiday"
        options={WEEKLY_HOLIDAY_OPTIONS}
        selected={weeklyHoliday}
        onSelect={setWeeklyHoliday}
        onClose={() => setActivePicker(null)}
      />
      <SettingsPickerSheet
        visible={activePicker === 'priority'}
        title="Default priority"
        options={DEFAULT_PRIORITY_OPTIONS.map((o) => ({ ...o, color: priorityDotColor[o.value] }))}
        selected={defaultPriority}
        onSelect={setDefaultPriority}
        onClose={() => setActivePicker(null)}
      />
      <SettingsPickerSheet
        visible={activePicker === 'dueWindow'}
        title="Default due window"
        options={DUE_WINDOW_OPTIONS}
        selected={defaultDueWindowDays}
        onSelect={setDefaultDueWindowDays}
        onClose={() => setActivePicker(null)}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1 },
  headerBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  form: { paddingHorizontal: Spacing[4], paddingTop: 16, gap: 18 },
  identityRow: { flexDirection: 'row', gap: 12 },
  headRow: { height: 60, borderRadius: 11, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 },
  headAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headAvatarText: { fontSize: 12, fontFamily: 'Inter-Bold' },
  headName: { fontSize: 13.5, fontFamily: 'Inter-SemiBold' },
  headSub: { fontSize: 11.5, fontFamily: 'Inter-Regular', marginTop: 1 },
  headPlaceholder: { flex: 1, fontSize: 14, fontFamily: 'Inter-Regular' },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter-Bold', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 9 },
  card: { borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  footer: { paddingHorizontal: Spacing[4], paddingTop: 12, borderTopWidth: 1 },
  submitBtn: { height: 50, borderRadius: Layout.buttonRadius, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  submitBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFFFFF', letterSpacing: 0 },
});
