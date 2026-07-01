/**
 * Create User screen (screen 37, §4.12).
 *
 * Admin view (role locked to EMPLOYEE, dept locked to own dept):
 *  - Full name (required, focused first)
 *  - Two-up: Employee ID + Phone (optional)
 *  - Email (for password reset, not login)
 *  - Role: locked pill "EMPLOYEE · Admins are created by Super Admin" + lock icon
 *  - Department: pre-filled read-only "Physics · your department"
 *  - Designation (optional)
 *  - Info note: "A temporary password is emailed…"
 *  - [Create & send invite] primary CTA
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ADMIN_DEPT } from '../../../src/data/team.mock';
import { teamService } from '../../../src/services/team.service';
import { useColors } from '../../../src/constants/colors';
import { Layout, Spacing } from '../../../src/constants/spacing';
import { Typography } from '../../../src/constants/typography';

// ─── Types ────────────────────────────────────────────────────────────────────

type FormErrors = Partial<Record<
  'name' | 'employeeId' | 'email' | 'designation',
  string
>>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Sub-components ───────────────────────────────────────────────────────────

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
  editable = true,
  mono = false,
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
  editable?: boolean;
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
            borderColor: error
              ? colors.semantic.error
              : focused
              ? colors.brand.primary
              : colors.surface.border,
            borderWidth: 1.5,
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
          editable={editable}
          style={[
            fi.textInput,
            { color: colors.text.primary, fontFamily: mono ? 'Inter-Regular' : 'Inter-Regular' },
            Platform.select({ android: { padding: 0 } }),
          ]}
        />
      </View>
      {error ? (
        <Text style={[fi.error, { color: colors.semantic.error }]}>{error}</Text>
      ) : null}
    </>
  );
}
const fi = StyleSheet.create({
  input: {
    height: 50,
    borderRadius: Layout.inputRadius,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  focused: {
    shadowColor: '#1A5CF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    letterSpacing: 0,
  },
  error: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    marginLeft: 2,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreateMemberScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Form state
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');

  // Focus tracking
  const [focused, setFocused] = useState<string | null>('name');

  // Form status
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Refs for keyboard navigation
  const empIdRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const designationRef = useRef<TextInput>(null);

  // ─── Validation ────────────────────────────────────────────────────────

  const validate = useCallback(async (): Promise<boolean> => {
    const errs: FormErrors = {};

    if (!name.trim()) errs.name = 'Full name is required';

    if (!employeeId.trim()) {
      errs.employeeId = 'Employee ID is required';
    } else {
      const taken = await teamService.isEmployeeIdTaken(employeeId.trim());
      if (taken) errs.employeeId = 'This Employee ID is already in use';
    }

    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!EMAIL_RE.test(email.trim())) {
      errs.email = 'Enter a valid email address';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [name, employeeId, email]);

  // ─── Submit ────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const valid = await validate();
      if (!valid) return;

      await teamService.createMember({
        name: name.trim(),
        employeeId: employeeId.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(designation.trim() ? { designation: designation.trim() } : {}),
        role: 'EMPLOYEE',
        departmentId: ADMIN_DEPT.id,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setSubmitting(false);
    }
  }, [validate, name, employeeId, email, phone, designation, router]);

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.screen, { backgroundColor: colors.surface.background }]}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <View
          style={[
            s.header,
            {
              paddingTop: insets.top + 6,
              backgroundColor: colors.surface.card,
              borderBottomColor: colors.surface.border,
            },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={s.headerBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Feather name="x" size={22} color={colors.text.primary} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.text.primary }]}>Add team member</Text>
        </View>

        {/* ── Form ────────────────────────────────────────────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.form, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* Full name */}
          <FieldLabel>Full name</FieldLabel>
          <FieldInput
            value={name}
            onChangeText={setName}
            placeholder="Karthik Venkat"
            {...(errors.name ? { error: errors.name } : {})}
            focused={focused === 'name'}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
            returnKeyType="next"
            onSubmit={() => empIdRef.current?.focus()}
          />

          {/* Two-up: Employee ID + Phone */}
          <View style={s.twoUp}>
            <View style={{ flex: 1 }}>
              <FieldLabel>Employee ID</FieldLabel>
              <FieldInput
                value={employeeId}
                onChangeText={(v) => setEmployeeId(v.toUpperCase())}
                placeholder="EMP-2310"
                {...(errors.employeeId ? { error: errors.employeeId } : {})}
                focused={focused === 'employeeId'}
                onFocus={() => setFocused('employeeId')}
                onBlur={() => setFocused(null)}
                inputRef={empIdRef}
                autoCapitalize="characters"
                returnKeyType="next"
                onSubmit={() => phoneRef.current?.focus()}
                mono
              />
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel hint="optional">Phone</FieldLabel>
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
                returnKeyType="next"
                onSubmit={() => emailRef.current?.focus()}
              />
            </View>
          </View>

          {/* Email */}
          <FieldLabel hint="for password setup, not login">Email</FieldLabel>
          <FieldInput
            value={email}
            onChangeText={setEmail}
            placeholder="karthik.v@svgoi.ac.in"
            {...(errors.email ? { error: errors.email } : {})}
            focused={focused === 'email'}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            inputRef={emailRef}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmit={() => designationRef.current?.focus()}
          />

          {/* Role (locked) */}
          <View style={{ marginBottom: 18 }}>
            <FieldLabel>Role</FieldLabel>
            <View
              style={[
                s.lockedField,
                {
                  backgroundColor: '#F8FAFC',
                  borderColor: colors.surface.border,
                },
              ]}
            >
              <View style={[s.rolePill, { backgroundColor: '#F1F5F9' }]}>
                <Text style={[s.rolePillText, { color: '#475569' }]}>EMPLOYEE</Text>
              </View>
              <Text style={[s.lockedHint, { color: colors.text.tertiary }]}>
                Admins are created by Super Admin
              </Text>
              <Feather name="lock" size={16} color={colors.text.tertiary} />
            </View>
          </View>

          {/* Department (locked) */}
          <View style={{ marginBottom: 18 }}>
            <FieldLabel>Department</FieldLabel>
            <View
              style={[
                s.lockedField,
                {
                  backgroundColor: '#F8FAFC',
                  borderColor: colors.surface.border,
                },
              ]}
            >
              <Text style={[s.lockedValue, { color: colors.text.primary }]}>
                {ADMIN_DEPT.name}{' '}
                <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>
                  · your department
                </Text>
              </Text>
              <Feather name="lock" size={16} color={colors.text.tertiary} />
            </View>
          </View>

          {/* Designation */}
          <FieldLabel hint="optional">Designation</FieldLabel>
          <FieldInput
            value={designation}
            onChangeText={setDesignation}
            placeholder="Lab Assistant"
            {...(errors.designation ? { error: errors.designation } : {})}
            focused={focused === 'designation'}
            onFocus={() => setFocused('designation')}
            onBlur={() => setFocused(null)}
            inputRef={designationRef}
            returnKeyType="done"
            onSubmit={handleSubmit}
          />

          {/* Info note */}
          <View style={[s.infoNote, { backgroundColor: colors.brand.primaryLight }]}>
            <Feather name="mail" size={18} color={colors.brand.primary} />
            <Text style={[s.infoNoteText, { color: '#1E3A8A' }]}>
              A temporary password is emailed to the new member. They set a new one on first login.
            </Text>
          </View>
        </ScrollView>

        {/* ── Footer CTA ──────────────────────────────────────────────── */}
        <View
          style={[
            s.footer,
            {
              paddingBottom: insets.bottom + 12,
              backgroundColor: colors.surface.card,
              borderTopColor: colors.surface.border,
            },
          ]}
        >
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
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
    letterSpacing: 0,
  },
  form: {
    paddingHorizontal: Spacing[5],
    paddingTop: 18,
    gap: 18,
  },
  twoUp: {
    flexDirection: 'row',
    gap: 12,
  },
  lockedField: {
    height: 50,
    borderRadius: Layout.inputRadius,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  lockedValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
  },
  lockedHint: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    flexShrink: 0,
  },
  rolePillText: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoNoteText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 17,
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing[4],
    paddingTop: 12,
    borderTopWidth: 1,
  },
  submitBtn: {
    height: 50,
    borderRadius: Layout.buttonRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  submitBtnText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
});
