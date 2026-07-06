/**
 * Create User screen — Super Admin (screen 53, §4.12 SA variant).
 *
 * Unlike the Admin variant (screen 37 — Employee-only, dept locked), Super
 * Admin can create either role and assign any department. Granting the
 * Admin role is the elevated action (navy pill). Admins can manage more than
 * one department (§2 role architecture — "Admin ... can be multi-dept"), so
 * Admin role reveals a multi-select "Departments managed" chip field;
 * Employee keeps the single-department field (Prisma `departmentId` is a
 * singular FK).
 */

import React, { useCallback, useRef, useState } from 'react';
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
import * as Haptics from 'expo-haptics';

import type { OrgRole } from '../hooks/useOrgDirectory';
import { useOrgDepartmentRefs, useCreateOrgUser } from '../hooks/useOrgDirectory';
import { useColors } from '../constants/colors';
import { Layout, Spacing } from '../constants/spacing';

import { DepartmentChipPicker } from '../components/people/DepartmentChipPicker';
import { SettingsPickerSheet } from '../components/profile/SettingsPickerSheet';

// ─── Types ────────────────────────────────────────────────────────────────────

type FormErrors = {
  name?: string | undefined;
  staffId?: string | undefined;
  email?: string | undefined;
  departments?: string | undefined;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Field helpers (mirrors the local convention in people/create.tsx) ────────

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
  inputRef,
  keyboardType,
  autoCapitalize = 'words',
  returnKeyType = 'next',
  onSubmit,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  error?: string;
  focused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
  keyboardType?: TextInput['props']['keyboardType'];
  autoCapitalize?: TextInput['props']['autoCapitalize'];
  returnKeyType?: TextInput['props']['returnKeyType'];
  onSubmit?: () => void;
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
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          onFocus={onFocus}
          onBlur={onBlur}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmit}
          style={[fi.textInput, { color: colors.text.primary }, Platform.select({ android: { padding: 0 } })]}
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export function CreateOrgUserScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Pre-selects the department when reached from a department's "Add member"
  // row (Department members screen, 56b) — otherwise unset, same as before.
  const { departmentId: prefillDepartmentId } = useLocalSearchParams<{ departmentId?: string }>();

  const deptRefsQuery = useOrgDepartmentRefs();
  const createUser = useCreateOrgUser();
  const allDepartments = deptRefsQuery.data ?? [];

  const [role, setRole] = useState<OrgRole>('EMPLOYEE');
  const [name, setName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [departmentIds, setDepartmentIds] = useState<string[]>(prefillDepartmentId ? [prefillDepartmentId] : []);
  const [deptSheetVisible, setDeptSheetVisible] = useState(false);

  const [focused, setFocused] = useState<string | null>('name');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const staffIdRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  const handleRoleChange = useCallback((next: OrgRole) => {
    setRole(next);
    setDepartmentIds([]);
    setErrors((e) => ({ ...e, departments: undefined }));
  }, []);

  const validate = useCallback(async (): Promise<boolean> => {
    const errs: FormErrors = {};

    if (!name.trim()) errs.name = 'Full name is required';

    if (!staffId.trim()) errs.staffId = 'Staff ID is required';

    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!EMAIL_RE.test(email.trim())) {
      errs.email = 'Enter a valid email address';
    }

    if (departmentIds.length === 0) {
      errs.departments = role === 'ADMIN' ? 'Select at least one department' : 'Select a department';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [name, staffId, email, departmentIds, role]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const valid = await validate();
      if (!valid) return;

      // Prisma `departmentId` is a singular FK — an Admin's multi-select
      // "Departments managed" chips are captured here as the primary
      // department only, until the backend supports multi-dept admins.
      await createUser.mutateAsync({
        name: name.trim(),
        employeeId: staffId.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        role,
        ...(departmentIds[0] ? { departmentId: departmentIds[0] } : {}),
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      // Error toast already shown by useCreateOrgUser (useApiMutation).
    } finally {
      setSubmitting(false);
    }
  }, [validate, createUser, name, staffId, email, phone, role, departmentIds, router]);

  const selectedDeptName = allDepartments.find((d) => d.id === departmentIds[0])?.name;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
          <Pressable onPress={() => router.back()} style={s.headerBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
            <Feather name="x" size={22} color={colors.text.primary} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.text.primary }]}>Create user</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.form, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* Role selector */}
          <View>
            <FieldLabel>Role</FieldLabel>
            <View style={s.roleRow}>
              <Pressable
                onPress={() => handleRoleChange('EMPLOYEE')}
                style={[
                  s.rolePillBtn,
                  { backgroundColor: colors.surface.card, borderColor: role === 'EMPLOYEE' ? colors.brand.primary : colors.surface.border },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: role === 'EMPLOYEE' }}
              >
                <Feather name="user" size={17} color={role === 'EMPLOYEE' ? colors.brand.primary : colors.text.tertiary} />
                <Text style={[s.rolePillText, { color: role === 'EMPLOYEE' ? colors.brand.primary : colors.text.secondary }]}>
                  Employee
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleRoleChange('ADMIN')}
                style={[
                  s.rolePillBtn,
                  role === 'ADMIN'
                    ? { backgroundColor: colors.brand.secondary, borderColor: colors.brand.secondary, ...s.roleActiveShadow }
                    : { backgroundColor: colors.surface.card, borderColor: colors.surface.border },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: role === 'ADMIN' }}
              >
                <Feather name="shield" size={17} color={role === 'ADMIN' ? '#FFFFFF' : colors.text.tertiary} />
                <Text style={[s.rolePillText, { color: role === 'ADMIN' ? '#FFFFFF' : colors.text.secondary }]}>Admin</Text>
              </Pressable>
            </View>
            <Text style={[s.roleHint, { color: colors.text.tertiary }]}>
              Admins manage departments and can create employees. This is an elevated role.
            </Text>
          </View>

          {/* Full name */}
          <View>
            <FieldLabel>Full name</FieldLabel>
            <FieldInput
              value={name}
              onChangeText={setName}
              placeholder="Anjali Sharma"
              {...(errors.name ? { error: errors.name } : {})}
              focused={focused === 'name'}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              onSubmit={() => staffIdRef.current?.focus()}
            />
          </View>

          {/* Staff ID + Phone */}
          <View style={s.twoUp}>
            <View style={{ flex: 1 }}>
              <FieldLabel>Staff ID</FieldLabel>
              <FieldInput
                value={staffId}
                onChangeText={(v) => setStaffId(v.toUpperCase())}
                placeholder="SVGOI-0012"
                {...(errors.staffId ? { error: errors.staffId } : {})}
                focused={focused === 'staffId'}
                onFocus={() => setFocused('staffId')}
                onBlur={() => setFocused(null)}
                inputRef={staffIdRef}
                autoCapitalize="characters"
                onSubmit={() => phoneRef.current?.focus()}
              />
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel hint="opt.">Phone</FieldLabel>
              <FieldInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+91…"
                focused={focused === 'phone'}
                onFocus={() => setFocused('phone')}
                onBlur={() => setFocused(null)}
                inputRef={phoneRef}
                keyboardType="phone-pad"
                autoCapitalize="none"
                onSubmit={() => emailRef.current?.focus()}
              />
            </View>
          </View>

          {/* Email */}
          <View>
            <FieldLabel hint="for password setup">Email</FieldLabel>
            <FieldInput
              value={email}
              onChangeText={setEmail}
              placeholder="anjali.sharma@svgoi.ac.in"
              {...(errors.email ? { error: errors.email } : {})}
              focused={focused === 'email'}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              inputRef={emailRef}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
            />
          </View>

          {/* Departments managed (Admin: multi-select) / Department (Employee: single-select) */}
          <View>
            <FieldLabel>{role === 'ADMIN' ? 'Departments managed' : 'Department'}</FieldLabel>
            {role === 'ADMIN' ? (
              <DepartmentChipPicker
                allDepartments={allDepartments}
                selectedIds={departmentIds}
                onChange={(ids) => {
                  setDepartmentIds(ids);
                  setErrors((e) => ({ ...e, departments: undefined }));
                }}
                {...(errors.departments ? { error: errors.departments } : {})}
              />
            ) : (
              <>
                <Pressable
                  onPress={() => setDeptSheetVisible(true)}
                  style={[
                    s.deptDropdown,
                    { backgroundColor: colors.surface.card, borderColor: errors.departments ? colors.semantic.error : colors.surface.border },
                  ]}
                >
                  <Text style={[s.deptDropdownText, { color: selectedDeptName ? colors.text.primary : colors.text.tertiary }]}>
                    {selectedDeptName ?? 'Select department'}
                  </Text>
                  <Feather name="chevron-down" size={18} color={colors.text.tertiary} />
                </Pressable>
                {errors.departments ? <Text style={[s.deptError, { color: colors.semantic.error }]}>{errors.departments}</Text> : null}
                <SettingsPickerSheet
                  visible={deptSheetVisible}
                  title="Department"
                  options={allDepartments.map((d) => ({ value: d.id, label: d.name }))}
                  selected={departmentIds[0] ?? ''}
                  onSelect={(id) => {
                    setDepartmentIds([id]);
                    setErrors((e) => ({ ...e, departments: undefined }));
                  }}
                  onClose={() => setDeptSheetVisible(false)}
                />
              </>
            )}
          </View>

          {/* Info note */}
          <View style={[s.infoNote, { backgroundColor: colors.brand.primaryLight }]}>
            <Feather name="mail" size={18} color={colors.brand.primary} />
            <Text style={[s.infoNoteText, { color: '#1E3A8A' }]}>
              A temporary password is emailed to {name.trim() || 'the new user'}. They set a new one on first login.
            </Text>
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
            accessibilityLabel="Create and send invite"
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Feather name="user-plus" size={17} color="#FFFFFF" />
                <Text style={s.submitBtnText}>Create &amp; send invite</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1 },
  headerBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  form: { paddingHorizontal: Spacing[5], paddingTop: 18, gap: 18 },
  roleRow: { flexDirection: 'row', gap: 10 },
  rolePillBtn: { flex: 1, height: 56, borderRadius: 11, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  roleActiveShadow: { shadowColor: '#0D2270', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.24, shadowRadius: 14, elevation: 4 },
  rolePillText: { fontSize: 13.5, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  roleHint: { fontSize: 11.5, fontFamily: 'Inter-Regular', marginTop: 8 },
  twoUp: { flexDirection: 'row', gap: 12 },
  deptDropdown: { height: 50, borderRadius: Layout.inputRadius, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  deptDropdownText: { fontSize: 14, fontFamily: 'Inter-Regular', letterSpacing: 0 },
  deptError: { fontSize: 12, fontFamily: 'Inter-Regular', marginTop: 4, marginLeft: 2 },
  infoNote: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 12 },
  infoNoteText: { fontSize: 12, fontFamily: 'Inter-Regular', lineHeight: 17, flex: 1 },
  footer: { paddingHorizontal: Spacing[4], paddingTop: 12, borderTopWidth: 1 },
  submitBtn: { height: 50, borderRadius: Layout.buttonRadius, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  submitBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFFFFF', letterSpacing: 0 },
});
