/**
 * Edit Member screen — thin wrapper that pre-fills the CreateMember form
 * with existing member data. Reuses the same form layout (§4.12 edit mode).
 */

import React, { useEffect, useRef, useState } from 'react';
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

import { useUser, useUpdateUser } from '../../../../src/hooks/usePeople';
import { useColors } from '../../../../src/constants/colors';
import { Layout, Spacing } from '../../../../src/constants/spacing';

// ─── Field helpers (minimal, same as create screen) ──────────────────────────

function FieldLabel({ children, hint }: { children: string; hint?: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', marginBottom: 8 }}>
      <Text style={{ fontSize: 12, fontFamily: 'Inter-SemiBold', color: colors.text.secondary }}>
        {children}
      </Text>
      {hint && (
        <Text style={{ fontSize: 12, fontFamily: 'Inter-Regular', color: colors.text.tertiary }}>
          {' '}· {hint}
        </Text>
      )}
    </View>
  );
}

export default function EditMemberScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: member, isLoading } = useUser(id ?? '');
  const updateUser = useUpdateUser();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  const phoneRef = useRef<TextInput>(null);
  const designationRef = useRef<TextInput>(null);

  useEffect(() => {
    if (member) {
      setName(member.name);
      setPhone(member.phone ?? '');
      setDesignation(member.designation ?? '');
    }
  }, [member]);

  const handleSave = async () => {
    if (!member || !name.trim()) return;
    setSaving(true);
    try {
      await updateUser.mutateAsync({
        id: member.id,
        dto: {
          name: name.trim(),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
          designation: designation.trim(),
        },
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[s.center, { backgroundColor: colors.surface.background, paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.brand.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.screen, { backgroundColor: colors.surface.background }]}>

        {/* Header */}
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
          <Pressable onPress={() => router.back()} style={s.headerBtn} hitSlop={8}>
            <Feather name="chevron-left" size={22} color={colors.text.primary} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.text.primary }]}>Edit profile</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.form, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* Full name */}
          <FieldLabel>Full name</FieldLabel>
          <View
            style={[
              s.input,
              {
                backgroundColor: colors.surface.card,
                borderColor: focused === 'name' ? colors.brand.primary : colors.surface.border,
              },
            ]}
          >
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={colors.text.tertiary}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              style={[s.textInput, { color: colors.text.primary }]}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
          </View>

          {/* Phone */}
          <FieldLabel hint="optional">Phone</FieldLabel>
          <View
            style={[
              s.input,
              {
                backgroundColor: colors.surface.card,
                borderColor: focused === 'phone' ? colors.brand.primary : colors.surface.border,
              },
            ]}
          >
            <TextInput
              ref={phoneRef}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91…"
              placeholderTextColor={colors.text.tertiary}
              onFocus={() => setFocused('phone')}
              onBlur={() => setFocused(null)}
              keyboardType="phone-pad"
              style={[s.textInput, { color: colors.text.primary }]}
              returnKeyType="next"
              onSubmitEditing={() => designationRef.current?.focus()}
            />
          </View>

          {/* Designation */}
          <FieldLabel hint="optional">Designation</FieldLabel>
          <View
            style={[
              s.input,
              {
                backgroundColor: colors.surface.card,
                borderColor: focused === 'designation' ? colors.brand.primary : colors.surface.border,
              },
            ]}
          >
            <TextInput
              ref={designationRef}
              value={designation}
              onChangeText={setDesignation}
              placeholder="Lab Assistant"
              placeholderTextColor={colors.text.tertiary}
              onFocus={() => setFocused('designation')}
              onBlur={() => setFocused(null)}
              style={[s.textInput, { color: colors.text.primary }]}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>

          {/* Read-only fields */}
          {member && (
            <>
              <FieldLabel>Employee ID</FieldLabel>
              <View style={[s.input, { backgroundColor: '#F8FAFC', borderColor: colors.surface.border }]}>
                <Text style={[s.textInput, { color: colors.text.secondary }]}>{member.employeeId}</Text>
              </View>

              <FieldLabel>Email</FieldLabel>
              <View style={[s.input, { backgroundColor: '#F8FAFC', borderColor: colors.surface.border }]}>
                <Text style={[s.textInput, { color: colors.text.secondary }]}>{member.email}</Text>
              </View>

              <FieldLabel>Department</FieldLabel>
              <View style={[s.input, { backgroundColor: '#F8FAFC', borderColor: colors.surface.border }]}>
                <Text style={[s.textInput, { color: colors.text.secondary }]}>{member.department?.name ?? '—'}</Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View
          style={[
            s.footer,
            { paddingBottom: insets.bottom + 12, backgroundColor: colors.surface.card, borderTopColor: colors.surface.border },
          ]}
        >
          <Pressable
            onPress={handleSave}
            disabled={saving || !name.trim()}
            style={({ pressed }) => [
              s.saveBtn,
              { backgroundColor: colors.brand.primary },
              pressed && { opacity: 0.88 },
              (saving || !name.trim()) && { opacity: 0.6 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Save changes"
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={s.saveBtnText}>Save changes</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  form: { paddingHorizontal: Spacing[5], paddingTop: 18, gap: 18 },
  input: {
    height: 50,
    borderRadius: Layout.inputRadius,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  textInput: { fontSize: 14, fontFamily: 'Inter-Regular', letterSpacing: 0 },
  footer: { paddingHorizontal: Spacing[4], paddingTop: 12, borderTopWidth: 1 },
  saveBtn: {
    height: 50,
    borderRadius: Layout.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFFFFF', letterSpacing: 0 },
});
