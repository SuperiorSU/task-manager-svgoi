import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { authApi } from '@godigitify/api-client';

import { useColors } from '../../src/constants/colors';
import { Typography } from '../../src/constants/typography';
import { Spacing } from '../../src/constants/spacing';
import { Input } from '../../src/components/ui/Input';
import { useToast } from '../../src/hooks/useToast';
import { getErrorMessage } from '../../src/utils/errorHandler';

/**
 * Public account-setup screen, reached via the invite deep link
 * (svgoitasks://setup?token=…) that an admin shares with a new member. The
 * account has no usable password until this flow completes — here the member
 * verifies the invite and chooses their first password, then signs in.
 */
export default function SetupScreen() {
  const C = useColors();
  const router = useRouter();
  const toast = useToast();
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const inviteQuery = useQuery({
    queryKey: ['invite', token],
    queryFn: () => authApi.getInvite(token ?? '').then((r) => r.data),
    enabled: !!token,
    retry: false,
  });

  const accept = useMutation({
    mutationFn: () => authApi.acceptInvite(token ?? '', password),
    onSuccess: () => {
      toast.success('Account ready — sign in with your Employee ID.');
      router.replace('/(auth)/login');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleSubmit = () => {
    if (password.length < 8) return setError('Use at least 8 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setError('');
    accept.mutate();
  };

  // ── Invalid / expired link ──────────────────────────────────────────────────
  const invalid = !token || inviteQuery.isError;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.surface.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {inviteQuery.isLoading ? (
            <View style={s.center}>
              <ActivityIndicator color={C.brand.primary} />
            </View>
          ) : invalid ? (
            <View style={s.center}>
              <View style={[s.iconCircle, { backgroundColor: C.semantic.errorBg }]}>
                <Feather name="link-2" size={26} color={C.semantic.error} />
              </View>
              <Text style={[s.title, { color: C.text.primary }]}>This link isn&apos;t valid</Text>
              <Text style={[s.subtitle, { color: C.text.tertiary }]}>
                Your invite link is invalid or has expired. Ask your admin to send a fresh one.
              </Text>
              <Pressable
                onPress={() => router.replace('/(auth)/login')}
                style={({ pressed }) => [s.linkBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={[s.linkBtnText, { color: C.brand.primary }]}>Back to sign in</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={[s.iconCircle, { backgroundColor: C.brand.primaryLight }]}>
                <Feather name="user-check" size={26} color={C.brand.primary} />
              </View>
              <Text style={[s.title, { color: C.text.primary }]}>Welcome, {inviteQuery.data?.name}</Text>
              <Text style={[s.subtitle, { color: C.text.tertiary }]}>
                Set a password to finish setting up your account. You&apos;ll sign in with your Employee ID
                {inviteQuery.data?.employeeId ? ` (${inviteQuery.data.employeeId})` : ''}.
              </Text>

              <View style={s.form}>
                <Input
                  label="New password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChangeText={setPassword}
                  secureToggle
                  autoCapitalize="none"
                  textContentType="newPassword"
                />
                <Input
                  label="Confirm password"
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChangeText={setConfirm}
                  secureToggle
                  autoCapitalize="none"
                  {...(error ? { error } : {})}
                />
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={accept.isPending}
                style={({ pressed }) => [s.submitBtn, { backgroundColor: C.brand.primary }, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel="Set password and continue"
              >
                {accept.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={s.submitText}>Set password &amp; continue</Text>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  center: { alignItems: 'center' },
  iconCircle: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 18 },
  title: { ...Typography.h2, fontFamily: 'Inter-Bold', textAlign: 'center' },
  subtitle: { ...Typography.bodySm, fontFamily: 'Inter-Regular', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  form: { gap: Spacing[3], marginTop: 28 },
  submitBtn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  submitText: { fontSize: 15, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
  linkBtn: { marginTop: 20, padding: 8 },
  linkBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
});
