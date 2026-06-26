import React, { useState } from 'react';
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

import { Colors } from '../../src/constants/colors';
import { Typography } from '../../src/constants/typography';
import { Input } from '../../src/components/ui/Input';
import { useForgotPassword } from '../../src/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [submittedEmail, setSubmittedEmail] = useState('');
  const { mutate: sendReset, isPending, submitted } = useForgotPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = (data: FormData) => {
    setSubmittedEmail(data.email);
    sendReset(data.email);
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.successContainer}>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Feather name="check" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.appName}>TaskFlow</Text>
              <Text style={styles.appSub}>SVGOI</Text>
            </View>
          </View>

          <View style={styles.successIconWrap}>
            <Feather name="mail" size={36} color={Colors.brand.primary} />
          </View>

          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successBody}>
            If <Text style={styles.emailHighlight}>{submittedEmail}</Text> is linked to an account, a password reset link has been sent.
          </Text>
          <Text style={styles.successNote}>
            Didn't receive it? Check your spam folder or contact HR.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.btn, styles.btnMargin, pressed && styles.btnPressed]}
            onPress={() => router.replace('/(auth)/login')}
            accessibilityRole="button"
          >
            <Feather name="arrow-left" size={18} color="#fff" />
            <Text style={styles.btnText}>Back to Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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
            <View style={styles.logoBox}>
              <Feather name="check" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.appName}>TaskFlow</Text>
              <Text style={styles.appSub}>SVGOI</Text>
            </View>
          </View>

          {/* Back link */}
          <Pressable
            style={({ pressed }) => [styles.backLink, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
            accessibilityRole="link"
          >
            <Feather name="arrow-left" size={16} color={Colors.text.secondary} />
            <Text style={styles.backText}>Back to Sign In</Text>
          </Pressable>

          {/* Heading */}
          <View style={styles.headingBlock}>
            <Text style={styles.heading}>Reset your password</Text>
            <Text style={styles.subheading}>
              Enter your work email address and we'll send you a reset link if the account exists.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Work Email"
                  placeholder="you@svgoi.edu.in"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />
          </View>

          {/* CTA */}
          <Pressable
            style={({ pressed }) => [styles.btn, styles.btnMargin, pressed && styles.btnPressed]}
            onPress={handleSubmit(onSubmit)}
            disabled={isPending}
            accessibilityRole="button"
          >
            {isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.btnText}>Send Reset Link</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </>
            )}
          </Pressable>

          <View style={styles.spacer} />

          {/* Footer info box */}
          <View style={styles.infoBox}>
            <Feather name="lock" size={18} color={Colors.brand.primary} />
            <Text style={styles.infoText}>
              Reset links expire after 30 minutes. Only work email addresses can be used.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface.background },
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
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 6,
  },
  appName: {
    fontSize: 19,
    fontFamily: 'Inter-Bold',
    color: Colors.brand.secondary,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  appSub: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.tertiary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 3,
  },

  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 28,
    alignSelf: 'flex-start',
  },
  backText: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Medium',
    color: Colors.text.secondary,
  },

  headingBlock: { marginTop: 32 },
  heading: {
    ...Typography.h1,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
  },
  subheading: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    marginTop: 8,
  },

  form: { marginTop: 32 },

  btn: {
    height: 52,
    backgroundColor: Colors.brand.primary,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 6,
  },
  btnMargin: { marginTop: 28 },
  btnPressed: { backgroundColor: Colors.brand.primaryDark },
  btnText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    letterSpacing: 0.1,
  },

  spacer: { flex: 1, minHeight: 32 },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: Colors.brand.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Inter-Regular',
    color: Colors.brand.primaryDark,
  },

  // Success state
  successContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 64,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  successTitle: {
    ...Typography.h1,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginTop: 24,
  },
  successBody: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    marginTop: 12,
    lineHeight: 22,
  },
  emailHighlight: {
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  successNote: {
    ...Typography.bodySm,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
    marginTop: 12,
  },
});
