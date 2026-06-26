import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { z } from 'zod';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../src/constants/colors';
import { Typography } from '../../src/constants/typography';
import { Input } from '../../src/components/ui/Input';
import { useLogin } from '../../src/hooks/useAuth';
import { getErrorMessage } from '../../src/utils/errorHandler';

const schema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const C = useColors();
  const { mutate: login, isPending, error } = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { employeeId: '', password: '' },
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.surface.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Horizontal logo row */}
          <View style={styles.logoRow}>
            <View style={[styles.logoBox, { backgroundColor: C.brand.primary }]}>
              <Feather name="check" size={24} color="#fff" />
            </View>
            <View>
              <Text style={[styles.appName, { color: C.brand.secondary }]}>TaskFlow</Text>
              <Text style={[styles.appSub, { color: C.text.tertiary }]}>SVGOI</Text>
            </View>
          </View>

          {/* Heading */}
          <View style={styles.headingBlock}>
            <Text style={[styles.heading, { color: C.text.primary }]}>Sign in to your account</Text>
            <Text style={[styles.subheading, { color: C.text.secondary }]}>
              Enter your credentials to continue. Accounts are issued by your administrator.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="employeeId"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Employee ID"
                  placeholder="e.g. EMP001 or you@svgoi.edu.in"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.employeeId?.message}
                />
              )}
            />

            <View>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    secureToggle
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    error={errors.password?.message}
                  />
                )}
              />
              <Pressable
                style={({ pressed }) => [styles.forgotLink, pressed && { opacity: 0.6 }]}
                onPress={() => router.push('/(auth)/forgot-password')}
                accessibilityRole="link"
              >
                <Text style={[styles.forgotText, { color: C.brand.primary }]}>Forgot password?</Text>
              </Pressable>
            </View>
          </View>

          {/* API error banner */}
          {error && (
            <View style={[styles.errorBox, { backgroundColor: C.semantic.errorBg }]}>
              <Feather name="alert-circle" size={16} color={C.semantic.error} />
              <Text style={[styles.errorText, { color: C.semantic.error }]}>{getErrorMessage(error)}</Text>
            </View>
          )}

          {/* CTA */}
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: C.brand.primary },
              pressed && { backgroundColor: C.brand.primaryDark },
            ]}
            onPress={handleSubmit((data) => login(data))}
            disabled={isPending}
            accessibilityRole="button"
          >
            {isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.btnText}>Sign In</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </>
            )}
          </Pressable>

          <View style={styles.spacer} />

          {/* Footer info box */}
          <View style={[styles.infoBox, { backgroundColor: C.brand.primaryLight, borderColor: C.surface.border }]}>
            <Feather name="info" size={18} color={C.brand.primary} style={{ flexShrink: 0 }} />
            <Text style={[styles.infoText, { color: C.text.secondary }]}>
              No self-registration. Locked accounts reset after 15 min — contact HR if deactivated.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A5CF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 6,
  },
  appName: {
    fontSize: 19,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  appSub: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  headingBlock: { marginTop: 52 },
  heading: { ...Typography.h1, fontFamily: 'Inter-SemiBold' },
  subheading: { ...Typography.bodyMd, fontFamily: 'Inter-Regular', marginTop: 8 },
  form: { marginTop: 32, gap: 18 },
  forgotLink: { alignSelf: 'flex-end', marginTop: 10, paddingVertical: 2 },
  forgotText: { ...Typography.labelMd, fontFamily: 'Inter-SemiBold' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  errorText: { flex: 1, ...Typography.bodyMd, fontFamily: 'Inter-Regular' },
  btn: {
    marginTop: 28,
    height: 52,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1A5CF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 6,
  },
  btnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#fff', letterSpacing: 0.1 },
  spacer: { flex: 1, minHeight: 24 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 17, fontFamily: 'Inter-Regular' },
});
