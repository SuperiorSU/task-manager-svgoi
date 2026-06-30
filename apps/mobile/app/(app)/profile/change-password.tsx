import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../../src/constants/colors';
import { useChangePassword } from '../../../src/hooks/useProfile';

// ─── Password strength ────────────────────────────────────────────────────────

type Strength = 'empty' | 'weak' | 'medium' | 'strong';

function getStrength(pw: string): { level: Strength; score: number } {
  if (!pw) return { level: 'empty', score: 0 };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[!@#$%^&*]/.test(pw)) score++;
  if (score <= 1) return { level: 'weak', score: 1 };
  if (score === 2) return { level: 'medium', score: 2 };
  return { level: 'strong', score: score };
}

const STRENGTH_HEX: Record<Strength, string> = {
  empty: '', weak: '#EF4444', medium: '#F59E0B', strong: '#15803D',
};
const STRENGTH_LABELS: Record<Strength, string> = {
  empty: '', weak: 'Weak', medium: 'Medium', strong: 'Strong',
};

// ─── Policy checklist ─────────────────────────────────────────────────────────

type PolicyItem = { label: string; pass: boolean };

function getPolicyItems(pw: string): PolicyItem[] {
  return [
    { label: 'At least 8 characters', pass: pw.length >= 8 },
    { label: 'Upper & lowercase letters', pass: /[A-Z]/.test(pw) && /[a-z]/.test(pw) },
    { label: 'At least one number', pass: /\d/.test(pw) },
    { label: 'One special character (! @ # $)', pass: /[!@#$]/.test(pw) },
    { label: 'Not one of your last 5 passwords', pass: pw.length >= 12 },
  ];
}

const StrengthMeter = ({ password }: { password: string }) => {
  const { level, score } = getStrength(password);
  if (level === 'empty') return null;
  const color = STRENGTH_HEX[level];
  return (
    <View style={sm.row}>
      <View style={sm.bars}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[sm.bar, { backgroundColor: i <= score ? color : '#E2E8F0' }]} />
        ))}
      </View>
      <Text style={[sm.label, { color }]}>{STRENGTH_LABELS[level]}</Text>
    </View>
  );
};
const sm = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10 },
  bars: { flex: 1, flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 5, borderRadius: 3 },
  label: { fontSize: 11, fontFamily: 'Inter-SemiBold' },
});

const PolicyCheckItem = ({ label, pass }: PolicyItem) => (
  <View style={pc.row}>
    <View style={[pc.icon, pass ? pc.iconPass : pc.iconFail]}>
      {pass ? <Feather name="check" size={10} color="#15803D" /> : <View style={pc.emptyCircle} />}
    </View>
    <Text style={[pc.label, !pass && pc.labelFail]}>{label}</Text>
  </View>
);
const pc = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 4 },
  icon: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  iconPass: { backgroundColor: '#F0FDF4' },
  iconFail: { backgroundColor: '#FEF2F2' },
  emptyCircle: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#CBD5E1' },
  label: { fontSize: 12.5, fontFamily: 'Inter-Regular', color: '#334155', flex: 1 },
  labelFail: { color: '#94A3B8' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { mutate: changePassword, isPending } = useChangePassword();

  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const policyItems = getPolicyItems(newPw);
  const allPoliciesMet = policyItems.every((p) => p.pass);
  const passwordsMatch = newPw.length > 0 && newPw === confirm;
  const canSubmit = current.length > 0 && allPoliciesMet && passwordsMatch;

  const inputRow = (field: string) => [
    s.inputRow,
    {
      backgroundColor: colors.surface.card,
      borderColor: focusedField === field ? colors.brand.primary : colors.surface.border,
    },
  ];

  const handleUpdate = () => {
    changePassword(
      { currentPassword: current, newPassword: newPw },
      {
        onSuccess: () =>
          Alert.alert('Password updated', 'Your password has been changed successfully.', [
            { text: 'OK', onPress: () => router.back() },
          ]),
        onError: () =>
          Alert.alert('Error', 'Current password is incorrect. Please try again.'),
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={[s.screen, { backgroundColor: colors.surface.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ── */}
      <View style={[s.headerBar, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}>
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.text.primary }]}>Change Password</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* ── Current password ── */}
        <Text style={[s.fieldLabel, { color: colors.text.secondary }]}>Current password</Text>
        <View style={inputRow('current')}>
          <TextInput
            style={[s.input, { color: colors.text.primary }]}
            value={current}
            onChangeText={setCurrent}
            secureTextEntry={!showCurrent}
            placeholder="Enter current password"
            placeholderTextColor={colors.text.tertiary}
            onFocus={() => setFocusedField('current')}
            onBlur={() => setFocusedField(null)}
          />
          <Pressable onPress={() => setShowCurrent((v) => !v)}>
            <Feather name={showCurrent ? 'eye' : 'eye-off'} size={20} color={focusedField === 'current' ? colors.brand.primary : colors.text.tertiary} />
          </Pressable>
        </View>

        {/* ── New password ── */}
        <Text style={[s.fieldLabel, { color: colors.text.secondary, marginTop: 18 }]}>New password</Text>
        <View style={inputRow('new')}>
          <TextInput
            style={[s.input, { color: colors.text.primary }]}
            value={newPw}
            onChangeText={setNewPw}
            secureTextEntry={!showNew}
            placeholder="Enter new password"
            placeholderTextColor={colors.text.tertiary}
            onFocus={() => setFocusedField('new')}
            onBlur={() => setFocusedField(null)}
          />
          <Pressable onPress={() => setShowNew((v) => !v)}>
            <Feather name={showNew ? 'eye' : 'eye-off'} size={20} color={focusedField === 'new' ? colors.brand.primary : colors.text.tertiary} />
          </Pressable>
        </View>
        <StrengthMeter password={newPw} />

        {/* ── Confirm password ── */}
        <Text style={[s.fieldLabel, { color: colors.text.secondary, marginTop: 18 }]}>Confirm new password</Text>
        <View style={inputRow('confirm')}>
          <TextInput
            style={[s.input, { color: colors.text.primary }]}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!showConfirm}
            placeholder="Re-enter new password"
            placeholderTextColor={colors.text.tertiary}
            onFocus={() => setFocusedField('confirm')}
            onBlur={() => setFocusedField(null)}
          />
          {passwordsMatch ? (
            <View style={s.matchIcon}>
              <Feather name="check" size={11} color="#15803D" />
            </View>
          ) : (
            <Pressable onPress={() => setShowConfirm((v) => !v)}>
              <Feather name={showConfirm ? 'eye' : 'eye-off'} size={20} color={focusedField === 'confirm' ? colors.brand.primary : colors.text.tertiary} />
            </Pressable>
          )}
        </View>

        {/* ── Policy card ── */}
        <View style={[s.policyCard, { backgroundColor: colors.surface.card }]}>
          <Text style={[s.policyTitle, { color: colors.text.tertiary }]}>Password must contain</Text>
          {policyItems.map((item) => (
            <PolicyCheckItem key={item.label} {...item} />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Footer button ── */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.surface.card, borderTopColor: colors.surface.border }]}>
        <Pressable
          onPress={handleUpdate}
          disabled={!canSubmit || isPending}
          style={({ pressed }) => [
            s.updateBtn,
            { backgroundColor: canSubmit ? colors.brand.primary : '#A8BFF8' },
            pressed && canSubmit && { opacity: 0.85 },
          ]}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.updateLabel}>Update Password</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter-SemiBold', marginBottom: 8 },
  inputRow: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 14,
  },
  input: { flex: 1, fontSize: 14, fontFamily: 'Inter-Regular', height: '100%' },
  matchIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.6,
    borderColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyCard: {
    borderRadius: 12,
    padding: 14,
    paddingHorizontal: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  policyTitle: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 11,
  },
  bottomBar: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  updateBtn: { height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  updateLabel: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#fff' },
});
