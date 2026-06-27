import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../../src/constants/colors';
import { useProfileData, useUpdateProfile } from '../../../src/hooks/useProfile';

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

// ─── Read-only row ────────────────────────────────────────────────────────────

const ReadOnlyRow = ({ label, value }: { label: string; value: string }) => {
  const colors = useColors();
  return (
    <View style={s.readOnlyRow}>
      <Text style={[s.readOnlyLabel, { color: colors.text.secondary }]}>{label}</Text>
      <Text style={[s.readOnlyValue, { color: colors.text.secondary }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const { data: profile } = useProfileData();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [name, setName] = useState(profile?.name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
      setPhone(profile.phone);
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile({ name, email, phone }, { onSuccess: () => router.back() });
  };

  const inputStyle = (field: string) => [
    s.input,
    {
      backgroundColor: colors.surface.card,
      borderColor: focusedField === field ? colors.brand.primary : colors.surface.border,
      color: colors.text.primary,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={[s.screen, { backgroundColor: colors.surface.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ── */}
      <View style={[s.headerBar, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.closeBtn, pressed && { opacity: 0.7 }]}
        >
          <Feather name="x" size={20} color={colors.text.primary} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.text.primary }]}>Edit Profile</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar ── */}
        <View style={s.avatarSection}>
          <View style={s.avatarWrap}>
            <View style={[s.avatar, { backgroundColor: colors.brand.secondary }]}>
              <Text style={s.initials}>{getInitials(name)}</Text>
            </View>
            <View style={[s.cameraBadge, { backgroundColor: colors.brand.primary, borderColor: colors.surface.background }]}>
              <Feather name="camera" size={13} color="#fff" />
            </View>
          </View>
          <Text style={[s.changePhotoLink, { color: colors.brand.primary }]}>Change photo</Text>
        </View>

        {/* ── Editable fields ── */}
        <View style={s.fieldsCard}>
          <Text style={[s.fieldLabel, { color: colors.text.secondary }]}>Full name</Text>
          <TextInput
            style={inputStyle('name')}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholderTextColor={colors.text.tertiary}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
          />

          <Text style={[s.fieldLabel, { color: colors.text.secondary, marginTop: 18 }]}>Email</Text>
          <TextInput
            style={inputStyle('email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={colors.text.tertiary}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
          />

          <Text style={[s.fieldLabel, { color: colors.text.secondary, marginTop: 18 }]}>Phone</Text>
          <TextInput
            style={inputStyle('phone')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={colors.text.tertiary}
            onFocus={() => setFocusedField('phone')}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        {/* ── Read-only fields ── */}
        <View style={[s.readOnlyCard, { backgroundColor: colors.surface.background, borderColor: colors.surface.border }]}>
          <View style={s.readOnlyHeader}>
            <Feather name="lock" size={14} color={colors.text.tertiary} />
            <Text style={[s.readOnlyHeaderText, { color: colors.text.tertiary }]}>
              Managed by admin · read-only
            </Text>
          </View>
          <View style={[s.readOnlyDivider, { backgroundColor: colors.surface.border }]} />
          <ReadOnlyRow label="Employee ID" value={profile?.employeeId ?? ''} />
          <View style={[s.readOnlyDivider, { backgroundColor: colors.surface.border }]} />
          <ReadOnlyRow label="Department" value={profile?.department ?? ''} />
          <View style={[s.readOnlyDivider, { backgroundColor: colors.surface.border }]} />
          <ReadOnlyRow label="Role" value={profile?.role ?? ''} />
          <View style={[s.readOnlyDivider, { backgroundColor: colors.surface.border }]} />
          <ReadOnlyRow label="Reporting manager" value={profile?.reportingManager ?? ''} />
        </View>
      </ScrollView>

      {/* ── Bottom action bar ── */}
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
            <Text style={s.saveLabel}>Save changes</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    letterSpacing: 1,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  changePhotoLink: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginTop: 10,
  },
  fieldsCard: { marginBottom: 20 },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  readOnlyCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  readOnlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  readOnlyHeaderText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  readOnlyDivider: { height: 1 },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  readOnlyLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  readOnlyValue: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    maxWidth: '55%',
    textAlign: 'right',
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
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
  cancelLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  saveBtn: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
});
